# Expense Monitor Extraction Pipeline (Terraform Skeleton)

This Terraform module provisions the AWS resources for the statement extraction pipeline:

Components:
- S3 bucket for uploaded statements & chunks
- SQS queue (with DLQ) for chunk extraction tasks
- Splitter Lambda (splits PDFs into page chunks, enqueues messages)
- Extractor Lambda (processes each chunk → GPT/OCR → DB update via future API)
- Step Functions state machine orchestrating split + polling loop
- IAM roles & minimal policies (expand with least-privilege as you implement DB access)

## Variables
See `variables.tf` for configurable values (region, memory, chunk size, bucket override, OpenAI SSM param).

## Next Steps
1. Package Python Lambda code into `lambdas/splitter/splitter.zip` and `lambdas/extractor/extractor.zip`.
2. Implement a dedicated progress-check Lambda (replace placeholder in state machine) that queries DB (via JDBC or an internal API).
3. Extend IAM policies for RDS access (or API Gateway/ALB invocation) once DB update mechanism chosen.
4. Wire backend Spring config: set `extraction.mode=aws_pipeline`, `aws.extraction.bucket`, `aws.extraction.stateMachineArn` from outputs.
5. Replace stub `AwsPipelineLauncher` with real S3 & Step Functions client once AWS SDK dependency resolution is fixed.
6. Provide environment variables to Lambdas: `BACKEND_INTERNAL_API` and `INTERNAL_API_TOKEN` (match Spring `internal.api.token`) so they can POST chunk progress.

## Apply
Example (ensure AWS credentials are configured):
```
terraform init
terraform apply -auto-approve
```

## Notes
- Current Step Function reuses the splitter Lambda for progress check as a placeholder.
- Add a Lambda layer or container images for heavier libs (e.g., OCR Tesseract) if required.
- Consider DynamoDB for chunk progress counters to reduce DB contention.
