# ==============================================================================
# ASRTAVA HMS - Secure S3 Object Storage for Medical Documents & Imaging Scans
# Private Bucket, KMS Server-Side Encryption, Object Lock (WORM), Lifecycle Rules
# ==============================================================================

resource "aws_kms_key" "s3_kms_key" {
  description             = "KMS Key for ASRTAVA Medical Documents Storage"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_s3_bucket" "medical_documents" {
  bucket        = "asrtava-${var.environment}-medical-documents"
  force_destroy = false

  object_lock_enabled = true # WORM protection against ransomware/accidental deletion

  tags = {
    Name        = "asrtava-${var.environment}-medical-documents"
    Sensitivity = "PHI-Restricted"
  }
}

# Block all public access categorically
resource "aws_s3_bucket_public_access_block" "documents_block_public" {
  bucket = aws_s3_bucket.medical_documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enforce KMS Server-Side Encryption at Rest
resource "aws_s3_bucket_server_side_encryption_configuration" "documents_encryption" {
  bucket = aws_s3_bucket.medical_documents.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_kms_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# Lifecycle Management: Transition historical documents (> 365 days) to Cold Tier
resource "aws_s3_bucket_lifecycle_configuration" "documents_lifecycle" {
  bucket = aws_s3_bucket.medical_documents.id

  rule {
    id     = "archive-historical-medical-records"
    status = "Enabled"

    transition {
      days          = 365
      storage_class = "STANDARD_IA" # Infrequent Access
    }

    transition {
      days          = 1095 # 3 Years
      storage_class = "GLACIER"
    }
  }
}

