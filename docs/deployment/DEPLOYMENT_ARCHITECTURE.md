# ASRTAVA Production Deployment Architecture & Topology Blueprint

## 1. Executive Deployment Blueprint

ASRTAVA is an enterprise multi-tenant SaaS Hospital Management System designed for high availability, zero-trust security, and zero-downtime continuous operations.

```
                                  [Internet Client Traffic]
                                              |
                          [AWS Route 53 / Cloudflare DNS (Anycast)]
                                              |
                   [AWS WAF (DDoS, SQLi, XSS, Rate Limiting Guard)]
                                              |
                  [Application Load Balancer (ALB) - TLS 1.3 Terminated]
                                /                           \
                               /                             \
        Path: /* (Web Portal) /                               \ Path: /api/* (API Gateway)
                             /                                 \
           [Public Subnet: Nginx Web Containers]       [Private App Subnet: ECS Fargate API Tasks]
           - React SPA Bundles (Chunk Split)           - 20 Domain API Gateways (Node 22)
           - Hardened CSP Headers                      - Tenant Isolation & RLS Guard
           - Gzip / Cache Invalidation                 - Ephemeral Task Autoscaling
                                                               |
                                        +----------------------+----------------------+
                                        |                                             |
                   [Private DB Subnet: Aurora PostgreSQL RDS]        [Private DB Subnet: Redis Cluster]
                   - Multi-AZ High Availability Replication          - ElastiCache Redis 7 (In-Transit TLS)
                   - Row-Level Security (RLS) Enforced               - Background Outbox Queues & DLQ
                   - KMS Storage Encryption (AES-256)                - Progressive Throttling Cache
                   - Continuous WAL Archival (PITR)                  - Rate Limiting Memory Store
                                        |
                   [Private Object Storage: AWS S3 Bucket]
                   - Patient Medical Documents & DICOM Scans
                   - WORM Object Lock in Compliance Mode
                   - KMS Envelope Encryption
                   - Short-lived Presigned URLs (15m expiry)
```

---

## 2. Logical Tier Boundaries & Security Segmentation

1. **Perimeter & Edge Tier**: Public subnets host only the Application Load Balancer and static CDN caching layers. All direct public access to compute containers and database instances is categorically blocked by security groups.
2. **Compute & Application Tier**: Private subnets host ECS Fargate container instances. Nodes communicate out to external services (Meta WhatsApp, Razorpay, SES) via managed NAT Gateways with dedicated Elastic IPs.
3. **Data Persistence Tier**: Completely isolated database subnets without internet gateways or NAT routes. Connections are restricted to authenticated TLS 1.3 traffic from the application compute security group.
4. **Storage & Compliance Tier**: Encrypted S3 storage buckets with AWS KMS key envelopes and strict S3 Block Public Access policies.

