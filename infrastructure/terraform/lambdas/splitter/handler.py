import os, json, tempfile, boto3, uuid
from PyPDF2 import PdfReader, PdfWriter
import requests

s3 = boto3.client('s3')
CHUNK_PAGES = int(os.getenv('SPLIT_CHUNK_PAGES','4'))
BUCKET = os.getenv('BUCKET_NAME')
QUEUE_URL = os.getenv('CHUNK_QUEUE_URL')
BACKEND_URL = os.getenv('BACKEND_INTERNAL_API')  # e.g., https://api.example.com
INTERNAL_TOKEN = os.getenv('INTERNAL_API_TOKEN')
sqs = boto3.client('sqs')

def split(event, context):
    # event: { "jobId": "..", "bucket": "..", "key": "uploads/.../original.pdf" }
    job_id = event.get('jobId')
    bucket = event.get('bucket') or BUCKET
    key = event.get('key')
    if not (job_id and bucket and key):
        return {"status":"FAILED","error":"Missing job parameters"}
    tmp = tempfile.NamedTemporaryFile(delete=False)
    s3.download_file(bucket, key, tmp.name)
    reader = PdfReader(tmp.name)
    total_pages = len(reader.pages)
    chunks = []
    for start in range(0, total_pages, CHUNK_PAGES):
        end = min(start + CHUNK_PAGES, total_pages)
        writer = PdfWriter()
        for p in range(start, end):
            writer.add_page(reader.pages[p])
        chunk_id = f"{start}_{end-1}"
        chunk_key = f"chunks/{job_id}/chunk_{chunk_id}.pdf"
        with tempfile.NamedTemporaryFile(delete=False) as ctmp:
            writer.write(ctmp)
            ctmp.flush()
            s3.upload_file(ctmp.name, bucket, chunk_key)
        chunks.append(chunk_key)
    # Dispatch SQS messages
    for idx, ck in enumerate(chunks):
        payload = {"jobId": job_id, "chunkKey": ck, "chunkIndex": idx, "totalChunks": len(chunks)}
        sqs.send_message(QueueUrl=QUEUE_URL, MessageBody=json.dumps(payload))
    # Optionally seed totalChunks via internal API (first chunk complete call will set if omitted)
    if BACKEND_URL and INTERNAL_TOKEN:
        try:
            requests.post(f"{BACKEND_URL}/internal/jobs/{job_id}/chunk-complete", json={"totalChunks": len(chunks), "pages": 0}, headers={"X-Internal-Token": INTERNAL_TOKEN}, timeout=5)
        except Exception:
            pass
    return {"status":"OK","totalChunks": len(chunks), "totalPages": total_pages}
