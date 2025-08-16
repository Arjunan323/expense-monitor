locals {
  name_prefix = "${var.project}-${var.env}"
  bucket_name = coalesce(var.pdf_bucket_name, "${local.name_prefix}-statements")
}

resource "aws_s3_bucket" "statements" {
  bucket = local.bucket_name
  force_destroy = true
}

resource "aws_sqs_queue" "extraction_chunks" {
  name                      = "${local.name_prefix}-extraction-chunks"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 86400
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.extraction_chunks_dlq.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue" "extraction_chunks_dlq" {
  name = "${local.name_prefix}-extraction-chunks-dlq"
}

# IAM role for Lambdas
resource "aws_iam_role" "lambda_role" {
  name = "${local.name_prefix}-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "lambda.amazonaws.com" },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "${local.name_prefix}-lambda-policy"
  role = aws_iam_role.lambda_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      { Effect = "Allow", Action = ["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"], Resource = "arn:aws:logs:*:*:*" },
      { Effect = "Allow", Action = ["s3:GetObject","s3:PutObject","s3:ListBucket"], Resource = [aws_s3_bucket.statements.arn, "${aws_s3_bucket.statements.arn}/*"] },
      { Effect = "Allow", Action = ["sqs:SendMessage","sqs:ReceiveMessage","sqs:DeleteMessage","sqs:GetQueueAttributes"], Resource = [aws_sqs_queue.extraction_chunks.arn, aws_sqs_queue.extraction_chunks_dlq.arn] },
      { Effect = "Allow", Action = ["states:SendTaskSuccess","states:SendTaskFailure"], Resource = "*" },
      { Effect = "Allow", Action = ["ssm:GetParameter"], Resource = "*" }
    ]
  })
}

# Splitter Lambda (placeholder zip path)
resource "aws_lambda_function" "splitter" {
  function_name = "${local.name_prefix}-splitter"
  role          = aws_iam_role.lambda_role.arn
  handler       = "handler.split"
  runtime       = "python3.11"
  filename      = "lambdas/splitter/splitter.zip"
  source_code_hash = filebase64sha256("lambdas/splitter/splitter.zip")
  timeout       = 300
  memory_size   = var.lambda_memory_mb
  environment {
    variables = {
      BUCKET_NAME        = local.bucket_name
      CHUNK_QUEUE_URL    = aws_sqs_queue.extraction_chunks.id
      SPLIT_CHUNK_PAGES  = tostring(var.split_chunk_pages)
    }
  }
}

# Extractor Lambda (SQS triggered)
resource "aws_lambda_function" "extractor" {
  function_name = "${local.name_prefix}-extractor"
  role          = aws_iam_role.lambda_role.arn
  handler       = "handler.extract"
  runtime       = "python3.11"
  filename      = "lambdas/extractor/extractor.zip"
  source_code_hash = filebase64sha256("lambdas/extractor/extractor.zip")
  timeout       = 900
  memory_size   = var.lambda_memory_mb
  environment {
    variables = {
      BUCKET_NAME     = local.bucket_name
      OPENAI_KEY_SSM  = var.openai_api_key_ssm_param
    }
  }
}

# SQS Event source mapping for extractor
resource "aws_lambda_event_source_mapping" "extractor_sqs" {
  event_source_arn = aws_sqs_queue.extraction_chunks.arn
  function_name    = aws_lambda_function.extractor.arn
  batch_size       = 1
}

# Step Function state machine
resource "aws_iam_role" "sfn_role" {
  name = "${local.name_prefix}-sfn-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "states.amazonaws.com" },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "sfn_policy" {
  name = "${local.name_prefix}-sfn-policy"
  role = aws_iam_role.sfn_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      { Effect = "Allow", Action = ["lambda:InvokeFunction"], Resource = [aws_lambda_function.splitter.arn] },
      { Effect = "Allow", Action = ["logs:CreateLogStream","logs:PutLogEvents"], Resource = "arn:aws:logs:*:*:*" },
      { Effect = "Allow", Action = ["sqs:GetQueueAttributes"], Resource = aws_sqs_queue.extraction_chunks.arn }
    ]
  })
}

locals {
  sfn_definition = jsonencode({
    Comment = "Statement Extraction Pipeline",
    StartAt = "Split",
    States = {
      Split = {
        Type = "Task",
        Resource = aws_lambda_function.splitter.arn,
        Next = "WaitForProcessing"
      },
      WaitForProcessing = {
        Type = "Wait",
        Seconds = 15,
        Next = "CheckProgress"
      },
      CheckProgress = {
        Type = "Task",
        Resource = aws_lambda_function.splitter.arn, # placeholder for a progress-check Lambda
        Next = "ProgressDecision"
      },
      ProgressDecision = {
        Type = "Choice",
        Choices = [
          { Variable = "$.status", StringEquals = "COMPLETED", Next = "Success" },
          { Variable = "$.status", StringEquals = "FAILED", Next = "Failed" }
        ],
        Default = "WaitForProcessing"
      },
      Success = { Type = "Succeed" },
      Failed  = { Type = "Fail" }
    }
  })
}

resource "aws_sfn_state_machine" "extraction" {
  name     = "${local.name_prefix}-extraction"
  role_arn = aws_iam_role.sfn_role.arn
  definition = local.sfn_definition
}

output "bucket_name" { value = aws_s3_bucket.statements.bucket }
output "chunk_queue_url" { value = aws_sqs_queue.extraction_chunks.id }
output "state_machine_arn" { value = aws_sfn_state_machine.extraction.arn }
