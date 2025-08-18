import pdfplumber
import pytesseract
from pdf2image import convert_from_path
import json
from openai import OpenAI
import os
import cv2
import numpy as np
from PIL import Image
from typing import Optional, List, Dict
import logging
import sys

logging.basicConfig(filename="python_app.log", level=logging.INFO)

# OpenAI client – expects OPENAI_API_KEY in environment (never hardcode secrets)
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    logging.error("Missing OPENAI_API_KEY environment variable.")
    raise RuntimeError("Missing OPENAI_API_KEY environment variable.")
client = OpenAI(api_key=api_key)

# -------------- Image Preprocessing --------------
def preprocess_image(pil_image):
    gray = np.array(pil_image.convert("L"))  # Grayscale
    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)  # Binarize
    return Image.fromarray(thresh)

# -------------- Chunking Text --------------
def chunk_text(text: str, chunk_size: int = 3000) -> List[str]:
    return [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]

# -------------- GPT-4 Text Extraction Logic --------------
def call_gpt_text_vision(chunk, header_row):
    prompt = f"""
You are a financial assistant helping parse and categorize bank transactions.

The following bank statement text starts with a header row. Use the header row to map columns for each transaction. If the header includes columns like 'Debit', 'Credit', 'Type', 'Dr/Cr', or similar, use those to determine the sign of the transaction amount. If only an 'Amount' column is present, use any indicator column (like 'Type', 'Dr/Cr') to determine sign. If no indicator is present, use the amount as-is.

Header row:
{header_row}

Bank statement text:
{chunk}

Output a JSON object with two keys:
- "header": a list of column names you detected
- "transactions": an array of transaction objects, each including all relevant columns (e.g., date, description, debit, credit, amount, type, balance, category, bankName, etc.)

Example output:
{{
  "header": ["Date", "Description", "Debit", "Credit", "Balance"],
  "transactions": [
    {{
      "date": "2023-07-01",
      "description": "POS AMAZON 1234",
      "debit": "120.50",
      "credit": "",
      "balance": "5420.45",
      "category": "Shopping",
      "bankName": "HDFC"
    }},
    {{
      "date": "2023-07-01",
      "description": "NEFT ICICI BANK",
      "debit": "",
      "credit": "2000.00",
      "balance": "7420.45",
      "category": "Salary",
      "bankName": "HDFC"
    }}
  ]
}}

If no transactions are found, return {{"header": [], "transactions": []}}.
"""

    response = client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[
            {
                "role": "system",
                "content": "You are a helpful assistant that extracts and categorizes financial transactions from text."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0
    )

    raw_content = response.choices[0].message.content.strip()

    # Clean markdown wrappers if present
    if raw_content.startswith('```'):
        raw_content = raw_content.lstrip('`').strip()
        if raw_content.lower().startswith('json'):
            raw_content = raw_content[4:].strip()
        if raw_content.endswith('```'):
            raw_content = raw_content[:-3].strip()

    try:
        return json.loads(raw_content)
    except json.JSONDecodeError:
        return {"header": [], "transactions": []}

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
                    # Try OCR if no extractable text
                    image = convert_from_path(pdf_path, first_page=page.page_number, last_page=page.page_number)[0]
                    processed_image = preprocess_image(image)
                    text = pytesseract.image_to_string(processed_image)

                if text and text.strip():
                    empty_pdf = False
                    if idx == 0:
                        # Try to extract header row from first page
                        lines = text.splitlines()
                        for line in lines:
                            if any(col in line.lower() for col in ['date', 'desc', 'debit', 'credit', 'amount', 'balance', 'type']):
                                header_row = line.strip()
                                break
                    all_text += "\n" + text
                else:
                    logging.warning(f"Page {page.page_number} is empty or unreadable.")
    except Exception as e:
        # Provide clearer guidance for password-protected PDFs
        if 'password' in str(e).lower():
            raise RuntimeError(
                "PDF appears to be password-protected. Provide password via function arg or CLI: python extraction_lambda.py <pdf> <password>"
            ) from e
        raise

    if empty_pdf:
        logging.error(f"PDF {pdf_path} appears to be empty or non-standard. No transactions extracted.")
        return []

    if not header_row:
        logging.warning(f"No header row detected in {pdf_path}. Extraction may be unreliable.")
        header_row = ""

    # Now chunk and process the combined text
    all_headers = None
    all_transactions = []
    for chunk in chunk_text(all_text):
        result = call_gpt_text_vision(chunk, header_row)
        if not isinstance(result, dict) or 'transactions' not in result:
            logging.warning(f"Non-standard GPT response: {result}")
            continue
        if all_headers is None and 'header' in result:
            all_headers = result['header']
        # Try to extract bankName from first transaction
        if bank_name is None and result['transactions'] and 'bankName' in result['transactions'][0]:
            bank_name = result['transactions'][0]['bankName']
        all_transactions.extend(result['transactions'])

    processed = postprocess_transactions(all_transactions, all_headers or [], bank_name)
    if not processed:
        logging.warning(f"No valid transactions extracted from {pdf_path}. Check statement format.")

    return processed


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        logging.warning("Usage: python extraction_lambda.py <path_to_pdf> [pdf_password]")
        sys.exit(1)

    pdf_path = sys.argv[1]
    pdf_password = sys.argv[2] if len(sys.argv) > 2 else None
    txns = extract_transactions_from_pdf(pdf_path, password=pdf_password)
    print(json.dumps(txns, indent=2))
