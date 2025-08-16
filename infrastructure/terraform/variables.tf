variable "project" { type = string default = "expense-monitor" }
variable "env" { type = string default = "dev" }
variable "aws_region" { type = string default = "us-east-1" }
variable "openai_api_key_ssm_param" { type = string description = "SSM parameter name for OpenAI key" default = "/expense-monitor/dev/openai_api_key" }
variable "pdf_bucket_name" { type = string default = null description = "Override S3 bucket name" }
variable "lambda_memory_mb" { type = number default = 1024 }
variable "split_chunk_pages" { type = number default = 4 }
variable "backend_internal_api_url" { type = string description = "Base URL of backend (e.g. https://api.example.com)" }
variable "internal_api_token" { type = string description = "Shared secret token for internal API calls" }
