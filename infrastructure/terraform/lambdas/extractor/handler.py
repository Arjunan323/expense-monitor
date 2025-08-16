import os, json, tempfile, boto3, requests, time
from openai import OpenAI
import pdfplumber
import pytesseract
from pdf2image import convert_from_path
from PIL import Image
import numpy as np
import cv2

s3 = boto3.client('s3')
ssm = boto3.client('ssm')
queue_url_env = os.getenv('QUEUE_URL')
BUCKET = os.getenv('BUCKET_NAME')
BACKEND_URL = os.getenv('BACKEND_INTERNAL_API')
INTERNAL_TOKEN = os.getenv('INTERNAL_API_TOKEN')
OPENAI_SSM_PARAM = os.getenv('OPENAI_KEY_SSM')

_client_cache = None

def get_client():
    global _client_cache
    if _client_cache:
        return _client_cache
    key = ssm.get_parameter(Name=OPENAI_SSM_PARAM, WithDecryption=True)['Parameter']['Value']
    _client_cache = OpenAI(api_key=key)
    return _client_cache

# Basic preprocessing

def preprocess(pil_image):
    gray = np.array(pil_image.convert("L"))
    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
    return Image.fromarray(thresh)


def extract(event, context):
    # SQS event
    for record in event.get('Records', []):
        body = json.loads(record['body'])
        job_id = body['jobId']
        chunk_key = body['chunkKey']
        total_chunks = body.get('totalChunks')
        tmp = tempfile.NamedTemporaryFile(delete=False)
        s3.download_file(BUCKET, chunk_key, tmp.name)
        text = ""
        try:
            with pdfplumber.open(tmp.name) as pdf:
                for page in pdf.pages:
                    t = page.extract_text() or ""
                    if not t.strip():
                        # OCR fallback
                        img = convert_from_path(tmp.name, first_page=page.page_number, last_page=page.page_number)[0]
                        processed = preprocess(img)
                        t = pytesseract.image_to_string(processed)
                    text += "\n" + t
        except Exception:
            text = ""
        if not text.strip():
            # Mark failure for this chunk
            if BACKEND_URL and INTERNAL_TOKEN:
                try:
                    requests.post(f"{BACKEND_URL}/internal/jobs/{job_id}/fail", json={"error":"empty chunk"}, headers={"X-Internal-Token": INTERNAL_TOKEN}, timeout=5)
                except Exception:
                    pass
            continue
        # Call OpenAI
        client = get_client()
        prompt = f"Parse bank transactions JSON array from statement fragment:\n{text[:4000]}"
        try:
            resp = client.chat.completions.create(model="gpt-4-turbo", messages=[{"role":"user","content":prompt}], temperature=0)
            raw = resp.choices[0].message.content.strip()
            if raw.startswith('```'):
                raw = raw.strip('`')
                if raw.lower().startswith('json'):
                    raw = raw[4:].strip()
                if raw.endswith('```'):
                    raw = raw[:-3].strip()
            # We do not send transactions here; backend parses on full completion OR future endpoint
        except Exception:
            pass
        # Notify backend chunk complete
        if BACKEND_URL and INTERNAL_TOKEN:
            try:
                requests.post(f"{BACKEND_URL}/internal/jobs/{job_id}/chunk-complete", json={"pages":1, "totalChunks": total_chunks}, headers={"X-Internal-Token": INTERNAL_TOKEN}, timeout=5)
            except Exception:
                pass
    return {"status":"OK"}
