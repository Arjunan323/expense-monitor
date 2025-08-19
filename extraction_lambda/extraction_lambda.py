import pdfplumber
import pytesseract
from pdf2image import convert_from_path
import json
from groq import Groq
import os
import cv2
import numpy as np
from PIL import Image
from typing import Optional, List, Dict
import logging
import sys
import time

logging.basicConfig(filename="python_app.log", level=logging.INFO)

# Initialize Groq client (expects GROQ_API_KEY in environment)
client = Groq(
    api_key=os.environ.get("OPENAI_API_KEY"),
)

# -------------- Image Preprocessing --------------
def preprocess_image(pil_image):
    gray = np.array(pil_image.convert("L"))  # Grayscale
    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)  # Binarize
    return Image.fromarray(thresh)

# -------------- Row-based Chunking --------------
def chunk_by_rows(text: str, header_row: str, rows_per_chunk: int = 50) -> List[str]:
    """Split extracted text into row-based chunks for better transaction preservation."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]

    # Try to remove header repetition
    if header_row:
        try:
            header_index = next(
                i for i, l in enumerate(lines) if header_row.lower() in l.lower()
            )
            lines = lines[header_index + 1 :]  # remove header itself
        except StopIteration:
            pass

    chunks = []
    for i in range(0, len(lines), rows_per_chunk):
        chunk_lines = [header_row] + lines[i : i + rows_per_chunk]
        chunks.append("\n".join(chunk_lines))

    return chunks

# -------------- Groq Calls --------------
def detect_bank_name(text: str) -> Optional[str]:
    """Detect bank name once from a sample of statement text."""
    snippet = (text or "").strip()
    if not snippet:
        return None
    if len(snippet) > 4000:
        snippet = snippet[:4000]
    prompt = f"""
Identify the bank or card issuer SHORT name (one token like HDFC, ICICI, SBI, Axis, Citi, HSBC, Yes, Kotak, BoB, PNB, IDFC) from the statement snippet below.
If unsure return the best guess.
Reply with ONLY the name.
---
{snippet}
---
Bank Name:"""
    try:
        resp = client.chat.completions.create(
            model="moonshotai/kimi-k2-instruct",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_completion_tokens=16,
            top_p=1,
            stream=False,
        )
        content = (resp.choices[0].message.content or "").strip()
        # Take first word, strip punctuation
        bank = content.split()[0] if content else None
        if bank:
            bank = bank.strip().strip(':,.')
        return bank
    except Exception as e:
        logging.warning(f"Bank name detection failed: {e}")
        return None


def call_groq_text_vision(chunk, header_row, bank_name=None):
    """Call Groq model with structured output enforcing an array of transactions."""
    prompt = f"""
You are a financial assistant helping parse and categorize bank transactions.

Bank Name: {bank_name or "Detect if missing"}

Header row:
{header_row}

Bank statement rows:
{chunk}

For each transaction row:
- date (YYYY-MM-DD)
- description
- amount (negative for debit, positive for credit)
- balance (if available, else null)
- category (Food, Travel, Salary, etc.)
- bankName (use {bank_name or "the detected value"} for all rows)

Return ONLY a JSON array of transactions.
"""

    # JSON Schema for structured output
    transactions_schema = {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "date": {"type": "string"},
                "description": {"type": "string"},
                "amount": {"type": "number"},
                "balance": {"type": ["number", "null"]},
                "category": {"type": "string"},
                "bankName": {"type": "string"},
            },
            "required": ["date", "description", "amount", "category", "bankName"],
            "additionalProperties": False,
        },
    }

    max_retries = 5
    for attempt in range(1, max_retries + 1):
        try:
            completion = client.chat.completions.create(
                model="moonshotai/kimi-k2-instruct",
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
                max_completion_tokens=2048,
                top_p=1,
                stream=False,
                response_format={
                    "type": "json_schema",
                    "json_schema": {"name": "transactions_array", "schema": transactions_schema},
                },
            )
            raw_content = completion.choices[0].message.content.strip()
            if raw_content.startswith("```"):
                raw_content = raw_content.strip("`")
                if raw_content.lower().startswith("json"):
                    raw_content = raw_content[4:].strip()
            try:
                data = json.loads(raw_content)
                # Unwrap various structured wrappers: {type, value|items|data}
                if isinstance(data, dict):
                    for key in ("value", "items", "data"):
                        if key in data and isinstance(data[key], list):
                            data = data[key]
                            break
                if not isinstance(data, list):
                    logging.warning("Parsed JSON is not a list; got %s", type(data))
                    return []
                return data
            except json.JSONDecodeError:
                logging.warning("Groq response JSON parse error (attempt %s).", attempt)
                continue
        except Exception as e:  # Retry on rate limits
            msg = str(e).lower()
            is_rate = "rate limit" in msg or "rate_limit_exceeded" in msg
            if attempt < max_retries and is_rate:
                wait_time = 5 * attempt
                logging.warning(f"Rate limit hit. Retrying in {wait_time}s...")
                time.sleep(wait_time)
                continue
            logging.error(f"Groq API error: {e}")
            break
    return []

# -------------- Transaction Post-Processor --------------
def postprocess_transactions(transactions: List[Dict], header: List[str], bank_name=None):
    cleaned = []
    for txn in transactions:
        try:
            amt = txn.get("amount")
            if amt is None:
                continue
            txn["amount"] = float(amt)
            if "balance" in txn and txn["balance"] not in [None, "", 0, "0"]:
                txn["balance"] = float(txn["balance"])
            if bank_name:
                txn["bankName"] = bank_name
            cleaned.append(txn)
        except Exception:
            continue
    return cleaned

# -------------- Main Extraction Pipeline --------------
def extract_transactions_from_pdf(pdf_path: str, password: Optional[str] = None):
    all_text = ""
    header_row = None
    first_pages_text = ""

    try:
        with pdfplumber.open(pdf_path, password=password) as pdf:
            for idx, page in enumerate(pdf.pages):
                text = page.extract_text()
                if not text or not text.strip():
                    image = convert_from_path(pdf_path, first_page=page.page_number, last_page=page.page_number)[0]
                    processed_image = preprocess_image(image)
                    text = pytesseract.image_to_string(processed_image)

                if text and text.strip():
                    if idx < 2:  # collect first 2 pages for bank detection
                        first_pages_text += "\n" + text
                    if idx == 0:
                        lines = text.splitlines()
                        for line in lines:
                            if any(
                                col in line.lower()
                                for col in ["date", "desc", "debit", "credit", "amount", "balance", "type"]
                            ):
                                header_row = line.strip()
                                break
                    all_text += "\n" + text
    except Exception as e:
        if "password" in str(e).lower():
            raise RuntimeError("PDF is password-protected. Pass password argument.") from e
        raise

    if not header_row:
        logging.warning("No header row detected; extraction may be unreliable.")
        header_row = ""

    # Detect bank name once
    bank_name = detect_bank_name(first_pages_text) or None

    # Chunk rows instead of characters
    chunks = chunk_by_rows(all_text, header_row, rows_per_chunk=50)

    all_transactions = []
    for chunk in chunks:
        result = call_groq_text_vision(chunk, header_row, bank_name)
        if isinstance(result, list):
            all_transactions.extend(result)

    all_headers = [h.strip().title() for h in header_row.split()] if header_row else []
    processed = postprocess_transactions(all_transactions, all_headers, bank_name)

    if not processed:
        logging.warning(f"No valid transactions extracted from {pdf_path}.")
    return processed

# -------------- Entry Point --------------
if __name__ == "__main__":
    if len(sys.argv) < 2:
        logging.warning("Usage: python extraction_lambda.py <path_to_pdf> [pdf_password]")
        sys.exit(1)

    pdf_path = sys.argv[1]
    pdf_password = sys.argv[2] if len(sys.argv) > 2 else None
    # txns = extract_transactions_from_pdf("C:\\Users\\admin\\Downloads\\XXXXXXXXXX3449-15-02-2025to14-08-2025.pdf", password="ARJU962196663")
    txns = extract_transactions_from_pdf(pdf_path, password=pdf_password)
    print(json.dumps(txns, indent=2))