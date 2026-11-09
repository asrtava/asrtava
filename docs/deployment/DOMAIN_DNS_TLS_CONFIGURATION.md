# ASRTAVA Domain, DNS, TLS & Network Security Configuration

## 1. Public Domain Layout

| Domain Name | Target Service | Ingress Controller | TLS Protocol |
| :--- | :--- | :--- | :--- |
| `asrtava.com` | Public Marketing Website | Cloudflare CDN | TLS 1.3 / HSTS |
| `app.asrtava.com` | Hospital Staff & Role Portals | AWS ALB $\to$ Nginx Web Containers | TLS 1.3 / HSTS |
| `api.asrtava.com` | Centralized Backend API Gateway | AWS ALB $\to$ ECS Fargate Tasks | TLS 1.3 / HSTS |
| `patient.asrtava.com`| Patient Web Portal | AWS ALB $\to$ Nginx Web Containers | TLS 1.3 / HSTS |
| `admin.asrtava.com` | Super Admin Platform Console | AWS ALB (WAF IP Whitelist Guard) | TLS 1.3 / HSTS |

---

## 2. TLS 1.3 Certificate & HSTS Enforcement

1. **Certificate Management**: Automated provisioning and renewal via AWS Certificate Manager (ACM) with DNS validation.
2. **Cipher Suite Policy**: `ELBSecurityPolicy-TLS13-1-2-2021-06` strictly forbidding legacy SSLv3, TLS 1.0, and TLS 1.1.
3. **HTTP Strict Transport Security (HSTS)**:
   ```
   Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
   ```
4. **Automatic HTTP Redirect**: Port 80 listener redirects with `301 Moved Permanently` to HTTPS on port 443.

---

## 3. Web Application Firewall (AWS WAF) Integration

The ALB is protected by AWS WAF rules:
- **AWSManagedRulesCommonRuleSet**: Blocks core OWASP vulnerabilities.
- **AWSManagedRulesSQLiRuleSet**: Deep SQL injection inspection.
- **AWSManagedRulesKnownBadInputsRuleSet**: Blocks malformed paths and Log4j-style probes.
- **Rate-Based Rule**: Caps requests from a single IP to 1,000 requests per 5-minute sliding window.

