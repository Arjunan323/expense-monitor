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

# -------------- Footer / Legend Stripping --------------
LEGEND_TRIGGER_KEYWORDS = [
    "legends", "legend :", "legend:", "++++ end of statement", "end of statement", "this is a system generated", "registered office", "branch address",
    "gst list", "gstin", "hsbc site list", "terms and conditions", "for any further clarifications", "cheque books", "rbi notification", "non cts cheque",
    "goods and services tax", "visit our website", "for more details", "valuable feedback", "nomination facility", "harmonized system nomenclature"
]

# Descriptions that are almost certainly legend entries (not real transactions)
LEGEND_DESCRIPTION_BLACKLIST = {
    "interest paid to customer",
    "interest collected from the customer",
    "cheque clearing transaction",
    "transaction through internet banking",
    "cash withdrawal through atm",
    "pos purchase",
    "surcharge on usage of debit card at pumps/railway ticket purchase or hotel tips",
    "difference in rates on usage of card internationally",
}

def strip_footer_and_legends(text: str) -> str:
    """Remove footer / legend / glossary sections so they are not hallucinated as transactions.

    Additional heuristics for varied bank footers:
    - If we see 3 consecutive long narrative lines ( >160 chars, many spaces) without digits in money/date patterns, treat the rest as footer.
    - Trigger phrases (LEGEND_TRIGGER_KEYWORDS) immediately start footer removal.
    - Remove glossary pattern CODE - Description lines.
    """
    if not text:
        return text
    cleaned_lines: List[str] = []
    narrative_run = 0
    stop = False
    for raw in text.splitlines():
        line = raw.rstrip()
        if not line.strip():
            continue
        lower = line.lower()
        if any(k in lower for k in LEGEND_TRIGGER_KEYWORDS):
            stop = True
        # Heuristic: narrative paragraph line
        has_money_or_date = bool(__import__('re').search(r"(\d{1,2}[-/][A-Za-z]{3}|\d{4}-\d{2}-\d{2}|\d+\.\d{2})", line))
        if not has_money_or_date and len(line) > 160 and line.count(' ') > 15:
            narrative_run += 1
        else:
            narrative_run = 0
        if narrative_run >= 3:
            stop = True
        if stop:
            continue
        # Glossary style lines CODE - Description
        if " - " in line:
            left = line.split(" - ", 1)[0].strip()
            if 2 <= len(left) <= 15 and left.replace('.', '').replace('/', '').replace('-', '').isalpha():
                continue
        cleaned_lines.append(line.strip())
    return "\n".join(cleaned_lines)

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
You are a precise bank statement transaction extractor.

GOAL: Extract ONLY genuine monetary transactions from the provided statement text. Output must follow the JSON schema already supplied (array of objects). Do NOT wrap inside any extra object (no type/value wrappers) and do NOT add commentary.

BANK NAME:
- In every transaction, set bankName to: {bank_name or "the bank you infer once"}.
- If not given above, infer a SHORT uppercase bank identifier (e.g., HDFC, ICICI, SBI, AXIS, CITI, HSBC, YES) exactly once and reuse it.

INPUT METADATA
Header row (use to map columns & infer debit/credit semantics):
{header_row}

Statement text slice (may contain noise / footer):
{chunk}

INCLUDE a row ONLY if ALL are true:
1. It corresponds to a financial movement line (not a note, footer, legend, address, compliance paragraph, or glossary definition).
2. Contains a plausible date and an amount.
3. Description is not purely a legend/glossary explanation (e.g., 'Interest paid to customer', 'Transaction through Internet Banking', 'POS purchase' as a definition line without its own date/amount context).

DATE NORMALIZATION:
- Accept common date formats (DD-MM-YYYY, DD/MM/YYYY, DD Mon YYYY, DD-Mon-YY, YYYY-MM-DD).
- Convert all to ISO YYYY-MM-DD.
- If day or month is ambiguous or invalid -> skip the line.

AMOUNT & SIGN RULES:
- If separate Debit/Credit columns: debit -> negative, credit -> positive.
- If a single Amount plus a Type/Dr/Cr indicator: Dr/DEBIT => negative, Cr/CREDIT => positive.
- If no indicator columns: keep sign as shown; do NOT guess.
- Never fabricate amounts. Use numeric characters only; strip commas.
- Ignore thousands separators; preserve decimals (two decimal places if present).

BALANCE:
- Include balance only if clearly present on the same line; else set to null (do NOT compute).

CATEGORY:
- Short semantic label (examples: Salary, Food, Groceries, Travel, Fuel, Rent, Utilities, Shopping, Transfer, Bank Fee, Interest, Investment, Insurance, Tax, Entertainment, Healthcare, Education, Misc).
- If uncertain choose a broad neutral category (Misc or Transfer) rather than hallucinating specifics.

EXCLUSIONS (DO NOT OUTPUT):
- Legends/glossaries after sections like 'LEGENDS', 'LEGEND', '++++ End of Statement ++++'.
- Lines of the form CODE - Explanation (e.g., INT.PD - Interest paid to customer).
- Long narrative paragraphs (regulatory / GST / address / RBI notification / disclaimers / website links / nomination facility text).
- State GSTIN lists, address blocks, signature notices, 'This is a system generated output'.

DEDUPLICATION:
- If an identical transaction line (same date, description, amount, balance) repeats inside this chunk, include only once.

OUTPUT FORMAT STRICTNESS:
- Return ONLY a JSON array of transaction objects.
 - Do NOT return any wrapping object like {{"type":..., "value": [...]}}.
- Do NOT include comments, prose, or trailing text.

POSITIVE EXAMPLE (conceptual):
[
    {{"date":"2025-02-18","description":"ATM Withdrawal Chennai","amount":-2000.00,"balance":15340.55,"category":"Cash","bankName":"AXIS"}}
]

If no valid transactions in this slice: return []
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
            # Legend / glossary description blacklist
            desc = str(txn.get("description", "")).strip().lower()
            if desc in LEGEND_DESCRIPTION_BLACKLIST:
                continue
            # Additional heuristic: skip very long paragraph-like descriptions unlikely for a transaction
            if len(desc) > 120 and desc.count(' ') > 15:
                continue
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

    # Strip footer / legends before chunking
    all_text_clean = strip_footer_and_legends(all_text)

    # Chunk rows instead of characters
    chunks = chunk_by_rows(all_text_clean, header_row, rows_per_chunk=50)

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