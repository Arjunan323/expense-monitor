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

# -------------- Chunking Text --------------
def chunk_text(text: str, chunk_size: int = 1000) -> List[str]:
    return [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]

# -------------- Groq LLM Extraction Logic --------------
def call_groq_text_vision(chunk, header_row):
    """Call Groq model with structured output enforcing an array of transactions."""
    prompt = f"""
You are a financial assistant helping parse and categorize bank transactions.

Given the following bank statement text, infer the bankName (the name of the bank or card issuer, e.g., 'HDFC', 'ICICI', 'SBI', 'Axis', 'Citi', 'HSBC', etc.) ONCE from the entire statement (not per transaction). Then, for each transaction, add this bankName as a field.

Each transaction must include:
- date (in YYYY-MM-DD format)
- description (short merchant or transfer info)
- amount (positive for credit, negative for debit)
- balance (account balance after transaction if available)
- category (short label like 'Food', 'Travel', 'Utilities', 'Salary', 'Shopping', 'Rent', 'Bank Fee', etc.)
- bankName (use the value you inferred from the whole statement for all transactions)

The statement starts with a header row. Use the header row to map columns for each transaction. If the header includes columns like 'Debit', 'Credit', 'Type', 'Dr/Cr', or similar, use those to determine the sign of the transaction amount. If only an 'Amount' column is present, use any indicator column (like 'Type', 'Dr/Cr') to determine sign. If no indicator is present, use the amount as-is.

Header row:
{header_row}

Bank statement text:
{chunk}

Return ONLY a JSON array of transactions. If none, return [].
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
                "balance": {"type": "number"},
                "category": {"type": "string"},
                "bankName": {"type": "string"}
            },
            "required": ["date", "description", "amount", "category", "bankName"],
            "additionalProperties": False
        }
    }

    import time
    max_retries = 5
    for attempt in range(1, max_retries + 1):
        try:
            completion = client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
                max_completion_tokens=2048,
                top_p=1,
                stream=False,
                stop=None,
                response_format={
                    "type": "json_schema",
                    "json_schema": {"name": "transactions_array", "schema": transactions_schema}
                }
            )
            raw_content = completion.choices[0].message.content.strip()
            # Clean fenced code blocks if present
            if raw_content.startswith("```"):
                raw_content = raw_content.strip("`")
                if raw_content.lower().startswith("json"):
                    raw_content = raw_content[4:].strip()
            try:
                data = json.loads(raw_content)
                # Groq structured output may wrap the schema result as {"type": "name", "value": <schema>}
                if isinstance(data, dict):
                    if 'value' in data and isinstance(data['value'], list):
                        data = data['value']
                    elif 'data' in data and isinstance(data['data'], list):  # fallback key variant
                        data = data['data']
                if not isinstance(data, list):
                    logging.warning("Parsed JSON is not a list of transactions; got type %s", type(data))
                    return []
                return data
            except json.JSONDecodeError:
                logging.warning("Groq response could not be parsed as JSON (attempt %s).", attempt)
                return []
        except Exception as e:  # Retry on rate limits
            msg = str(e).lower()
            is_rate = "rate limit" in msg or "rate_limit_exceeded" in msg
            if attempt < max_retries and is_rate:
                wait_time = 5 * attempt
                logging.warning(f"Rate limit encountered. Retry in {wait_time}s (attempt {attempt}/{max_retries})")
                time.sleep(wait_time)
                continue
            logging.error(f"Groq API error (attempt {attempt}): {e}")
            break
    return []

# -------------- Transaction Post-Processor --------------
def postprocess_transactions(transactions: List[Dict], header: List[str], bank_name=None):
    cleaned = []
    for txn in transactions:
        try:
            amt = None
            # Use header info for sign detection
            if 'Debit' in header and txn.get('debit') not in [None, '', 0, '0']:
                amt = -abs(float(txn['debit']))
            elif 'Credit' in header and txn.get('credit') not in [None, '', 0, '0']:
                amt = abs(float(txn['credit']))
            elif 'Type' in header and txn.get('amount') not in [None, '', 0, '0']:
                amt_val = abs(float(txn['amount']))
                if str(txn.get('type', '')).strip().lower() in ['dr', 'debit']:
                    amt = -amt_val
                elif str(txn.get('type', '')).strip().lower() in ['cr', 'credit']:
                    amt = amt_val
                else:
                    amt = float(txn['amount'])
            elif 'Amount' in header and txn.get('amount') not in [None, '', 0, '0']:
                amt = float(txn['amount'])
            elif txn.get('amount') not in [None, '', 0, '0']:
                amt = float(txn['amount'])
            else:
                continue

            txn['amount'] = amt
            if 'balance' in txn:
                txn['balance'] = float(txn['balance'])
            if bank_name:
                txn['bankName'] = bank_name
            cleaned.append(txn)
        except Exception:
            continue
    return cleaned

# -------------- Main Extraction Pipeline --------------
def extract_transactions_from_pdf(pdf_path: str, password: Optional[str] = None):
    transactions = []
    empty_pdf = True
    bank_name = None
    all_text = ""
    header_row = None

    try:
        with pdfplumber.open(pdf_path, password=password) as pdf:
            for idx, page in enumerate(pdf.pages):
                text = page.extract_text()
                if not text or not text.strip():
                    image = convert_from_path(pdf_path, first_page=page.page_number, last_page=page.page_number)[0]
                    processed_image = preprocess_image(image)
                    text = pytesseract.image_to_string(processed_image)

                if text and text.strip():
                    empty_pdf = False
                    if idx == 0:
                        lines = text.splitlines()
                        for line in lines:
                            if any(col in line.lower() for col in ['date', 'desc', 'debit', 'credit', 'amount', 'balance', 'type']):
                                header_row = line.strip()
                                break
                    all_text += "\n" + text
                else:
                    logging.warning(f"Page {page.page_number} is empty or unreadable.")
    except Exception as e:
        if 'password' in str(e).lower():
            raise RuntimeError(
                "PDF appears to be password-protected. Provide password via function arg or CLI: python extraction_lambda_groq.py <pdf> <password>"
            ) from e
        raise

    if empty_pdf:
        logging.error(f"PDF {pdf_path} appears to be empty or non-standard. No transactions extracted.")
        return []

    if not header_row:
        logging.warning(f"No header row detected in {pdf_path}. Extraction may be unreliable.")
        header_row = ""

    all_headers = None
    all_transactions = []
    for chunk in chunk_text(all_text):
        result = call_groq_text_vision(chunk, header_row)
        if not isinstance(result, list):
            logging.warning(f"Non-standard Groq response: {result}")
            continue
        if bank_name is None and result and 'bankName' in result[0]:
            bank_name = result[0]['bankName']
        all_transactions.extend(result)

    if header_row:
        all_headers = [h.strip().title() for h in header_row.split() if h.strip()]
    else:
        all_headers = []

    processed = postprocess_transactions(all_transactions, all_headers, bank_name)
    if not processed:
        logging.warning(f"No valid transactions extracted from {pdf_path}. Check statement format.")

    return processed

# -------------- Entry Point --------------
if __name__ == "__main__":
    if len(sys.argv) < 2:
        logging.warning("Usage: python extraction_lambda.py <path_to_pdf> [pdf_password]")
        sys.exit(1)

    pdf_path = sys.argv[1]
    pdf_password = sys.argv[2] if len(sys.argv) > 2 else None
    txns = extract_transactions_from_pdf(pdf_path, password=pdf_password)
    print(json.dumps(txns, indent=2))