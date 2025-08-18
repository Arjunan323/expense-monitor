import pdfplumber
import pytesseract
from pdf2image import convert_from_path
import json
from openai import OpenAI
import os
import cv2
import numpy as np
from PIL import Image
from typing import Optional, List
import logging

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
def call_gpt_text_vision(chunk):
    prompt = f"""
You are a financial assistant helping parse and categorize bank transactions.

Given the following bank statement text, infer the bankName (the name of the bank or card issuer, e.g., 'HDFC', 'ICICI', 'SBI', 'Axis', 'Citi', 'HSBC', etc.) ONCE from the entire statement (not per transaction). Then, for each transaction, add this bankName as a field.

Each transaction must include:
- date (in YYYY-MM-DD format)
- description (short merchant or transfer info)
- amount (positive for credit, negative for debit)
- balance (account balance after transaction)
- category (short label like 'Food', 'Travel', 'Utilities', 'Salary', 'Shopping', 'Rent', 'Bank Fee', etc.)
- bankName (use the value you inferred from the whole statement for all transactions)

Bank statement text:
\"\"\"
{chunk}
\"\"\"

Output only a valid JSON array of transactions, for example:
[
  {{
    "date": "2023-07-01",
    "description": "POS AMAZON 1234",
    "amount": "-120.50",
    "balance": "5420.45",
    "category": "Shopping",
    "bankName": "HDFC"
  }},
  {{
    "date": "2023-07-01",
    "description": "NEFT ICICI BANK",
    "amount": "2000.00",
    "balance": "7420.45",
    "category": "Salary",
    "bankName": "HDFC"
  }}
]

If no transactions are found, return an empty array [].
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
        return []

# -------------- Transaction Post-Processor --------------
def postprocess_transactions(transactions, bank_name=None):
    cleaned = []
    for txn in transactions:
        try:
            # Heuristic: If description or category suggests debit, force negative
            desc = txn.get('description', '').lower()
            cat = txn.get('category', '').lower()
            amt = float(txn['amount'])
            # If amount is positive but description/category indicates debit, flip sign
            if amt > 0 and (
                'debit' in desc or 'debit' in cat or
                'payment' in desc or 'withdrawal' in cat or 'withdrawal' in desc or
                'atm' in desc or 'fee' in cat or 'fee' in desc or 'transfer' in cat or 'transfer' in desc or
                'upi' in desc or 'neft' in desc or 'imps' in desc or 'rtgs' in desc
            ):
                amt = -amt
            # If amount is negative but description/category indicates credit, flip sign
            if amt < 0 and (
                'credit' in desc or 'salary' in cat or 'deposit' in desc or 'interest' in cat or 'interest' in desc or
                'dividend' in cat or 'dividend' in desc or 'refund' in desc or 'reversal' in desc
            ):
                amt = abs(amt)
            txn['amount'] = amt
            txn['balance'] = float(txn['balance'])
            if bank_name:
                txn['bankName'] = bank_name
            cleaned.append(txn)
        except Exception:
            continue
    return cleaned

# -------------- Main Extraction Pipeline --------------
def extract_transactions_from_pdf(pdf_path: str, password: Optional[str] = None):
    import logging
    transactions = []
    empty_pdf = True
    bank_name = None
    all_text = ""
    try:
        with pdfplumber.open(pdf_path, password=password) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if not text or not text.strip():
                    # Try OCR if no extractable text
                    image = convert_from_path(pdf_path, first_page=page.page_number, last_page=page.page_number)[0]
                    processed_image = preprocess_image(image)
                    text = pytesseract.image_to_string(processed_image)
                if text and text.strip():
                    empty_pdf = False
                    all_text += "\n" + text
                else:
                    logging.warning(f"Page {page.page_number} is empty or unreadable.")
    except Exception as e:
        # Provide clearer guidance for password-protected PDFs
        if 'password' in str(e).lower():
            raise RuntimeError("PDF appears to be password-protected. Provide password via function arg or CLI: python extraction_lambda.py <pdf> <password>") from e
        raise

    if empty_pdf:
        logging.error(f"PDF {pdf_path} appears to be empty or non-standard. No transactions extracted.")
        return []

    # Now chunk and process the combined text
    for chunk in chunk_text(all_text):
        result = call_gpt_text_vision(chunk)
        if not isinstance(result, list):
            logging.warning(f"Non-standard GPT response: {result}")
            continue
        # Try to extract bankName from first transaction
        if bank_name is None and result and isinstance(result, list) and 'bankName' in result[0]:
            bank_name = result[0]['bankName']
        transactions.extend(result)

    processed = postprocess_transactions(transactions, bank_name)
    if not processed:
        logging.warning(f"No valid transactions extracted from {pdf_path}. Check statement format.")

    return processed

# -------------- Entry Point --------------
if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        logging.warning("Usage: python extraction_lambda.py <path_to_pdf> [pdf_password]")
        sys.exit(1)

    pdf_path = sys.argv[1]
    pdf_password = sys.argv[2] if len(sys.argv) > 2 else None
    txns = extract_transactions_from_pdf(pdf_path, password=pdf_password)
    print(json.dumps(txns, indent=2))
