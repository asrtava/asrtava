# Quality & Accreditation REST API Documentation

## Base Path: `/api/v1/quality`

### 1. Incident Management
- `POST /incidents` - Report a clinical incident (supports anonymous submission)
- `GET /incidents` - List incidents filtered by severity, status, and department
- `POST /incidents/:id/rca` - Submit 5-Whys or Fishbone Root Cause Analysis

### 2. Closed-Loop CAPA
- `POST /capa` - Create Corrective or Preventive Action
- `PATCH /capa/:id/status` - Update status (requires Quality Auditor role to transition to VERIFIED_CLOSED)

### 3. Infection Control & Surveillance
- `POST /infections/surveillance` - Record HAI case and device days (returns normalized rate per 1,000 device days)
- `POST /hygiene/audits` - Record WHO 5 Moments hand hygiene observational audit

### 4. Clinical Audits & Peer Reviews
- `POST /audits` - Initiate clinical audit
- `POST /audits/:id/findings` - Record audit checklist findings and compliance score

### 5. Patient Grievances
- `POST /grievances` - Register patient grievance with statutory SLA countdown
- `PATCH /grievances/:id/resolve` - Record grievance resolution and patient satisfaction rating

### 6. Accreditation & Risk
- `GET /accreditation/readiness` - Get NABH 5th Edition chapter readiness scores
- `POST /risks` - Record clinical/operational risk on 5x5 matrix
- `GET /dashboard/summary` - Get executive hospital safety and quality composite metrics

