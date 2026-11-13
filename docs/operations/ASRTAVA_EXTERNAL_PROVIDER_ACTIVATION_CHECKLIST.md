# ASRTAVA External Provider Activation Checklist & Credentialing Guide

**Document Reference:** `docs/operations/ASRTAVA_EXTERNAL_PROVIDER_ACTIVATION_CHECKLIST.md`  
**Security Standard:** Zero Real Credentials in Code, Logs, or Source Control; AWS Secrets Manager / HashiCorp Vault Storage  
**Status:** **OPERATIONAL ACTIVATION CHECKLIST PREPARED**

---

## 1. Provider Activation Status Standard

To maintain rigorous transparency, every external integration is classified into one of six standardized activation tiers:
1. **Local Implementation Complete:** Code logic, models, and protocol handlers are implemented in repository.
2. **Simulator / Mock Active:** Protocol tested and verified locally against a high-fidelity simulator.
3. **Credential Configuration Pending:** Software is ready; awaiting production API keys, account credentials, or certificates from hospital or vendor.
4. **External Authorization Pending:** Awaiting formal regulatory review, government empanelment, or statutory approval (e.g. NHA, NOTTO).
5. **Integration Testing Pending:** Credentials configured in sandbox; awaiting live end-to-end integration test.
6. **Production Connection Verified:** Independently verified in live production with active external traffic.

---

## 2. Comprehensive Provider Activation Matrix (9 Integration Groups)

| # | External Provider / Service | Protocol & Interfaces | Current Code Status | Activation Tier | Configuration Prerequisite |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | **Ayushman Bharat Digital Mission (ABDM)** | REST / JSON / RSA-2048 (M1 ABHA, M2 HIP, M3 HIU) | Complete in `abdm.service.ts` | **3 & 4 (Credentials & Empanelment Pending)** | NHA Sandbox Bridge ID, Client ID, Client Secret, and Public/Private Encryption Keypair. |
| **2** | **National Health Claims Exchange (NHCX)** | FHIR R4 Claim & CoveragePayor | Complete in `nhcx.service.ts` | **3 & 4 (Credentials & Empanelment Pending)** | IIB / NHA NHCX live participant credentials and insurer digital signature certificates. |
| **3** | **NOTTO / ROTTO / SOTTO Organ Network** | THOA Apnea Protocol & Organ Case Dispatch | Complete in `federated-coordination.service.ts` | **4 (Statutory Empanelment Pending)** | Official empanelment by National Organ and Tissue Transplant Organization as authorized retrieval/transplant center. |
| **4** | **Meta WhatsApp Business Cloud API** | Graph API v21.0 HTTPS Webhooks | Complete in `whatsapp.service.ts` | **3 (Credentials Pending)** | Meta Business Manager ID, Verified WhatsApp Phone Number ID, System User Permanent Access Token (`WHATSAPP_TOKEN`). |
| **5** | **MSG91 & Twilio (SMS Gateways)** | HTTPS REST Gateway with Auto-Failover | Complete in `sms.service.ts` | **3 (Credentials Pending)** | Production API authentication tokens (`MSG91_AUTH_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`). |
| **6** | **Indian Telecom SMS DLT (TRAI)** | DLT Header & PE ID Metadata Headers | Complete in `sms.service.ts` | **3 & 4 (DLT Approval Pending)** | Principal Entity ID (`DLT_PE_ID`), Registered Sender Headers (e.g. `ASRTVA`), Approved Content Template IDs (`DLT_TE_ID`). |
| **7** | **Razorpay & Stripe (Payment Gateways)** | HTTPS REST & HMAC-SHA256 Webhooks | Complete in `payment.service.ts` | **3 (Credentials Pending)** | Live Merchant Key ID, Key Secret, and Webhook Signing Secret (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`). |
| **8** | **TURN / coturn (WebRTC Video Telehealth)** | RFC 5766 TURN over UDP/TCP | Complete in `webrtc.service.ts` | **3 (Cluster Provisioning Pending)** | Deployment of high-availability coturn server cluster on public IPs; static secret for ephemeral HMAC credential generation. |
| **9** | **Hospital Analyzers & Modalities (LIS/PACS)** | ASTM 1394-97 (Serial), HL7 v2.5.1 MLLP, DICOM C-FIND | Complete in `astm.service.ts`, `hl7.service.ts`, `pacs.service.ts` | **1 & 5 (Local Complete, Testing Pending)** | Hospital on-site RS-232 to Ethernet converter IP, MLLP port mapping (port 2575), modality DICOM AE Titles. |

---

## 3. Step-by-Step Administrator Configuration Guide

### 3.1 ABDM Gateway Configuration
To activate live ABDM connectivity once NHA credentials are issued:
```bash
# Set environment variables in production vault
ABDM_BASE_URL="https://dev.abdm.gov.in/gateway/v0.5" # Switch to production URL upon empanelment
ABDM_CLIENT_ID="<nha_assigned_client_id>"
ABDM_CLIENT_SECRET="<nha_assigned_client_secret>"
ABDM_BRIDGE_ID="<hospital_bridge_id>"
ABDM_PUBLIC_KEY_PATH="/etc/asrtava/certs/abdm_public.pem"
ABDM_PRIVATE_KEY_PATH="/etc/asrtava/certs/abdm_private.pem"
```

### 3.2 Meta WhatsApp Cloud API Configuration
1. Register hospital WhatsApp phone number on Meta Business Manager.
2. Submit pre-approved healthcare notification templates (Appointment Confirmation, Lab Report Ready, OTP Pass).
3. Inject credentials into `/opt/asrtava/.env`:
   ```ini
   WHATSAPP_API_URL=https://graph.facebook.com/v21.0
   WHATSAPP_PHONE_NUMBER_ID=<meta_phone_number_id>
   WHATSAPP_BUSINESS_ACCOUNT_ID=<meta_waba_id>
   WHATSAPP_TOKEN=<meta_system_user_token>
   WHATSAPP_WEBHOOK_VERIFY_TOKEN=<custom_high_entropy_verify_token>
   ```

### 3.3 Indian Telecom DLT Headers Configuration
Under Telecom Regulatory Authority of India (TRAI) regulations, unapproved SMS headers are blocked by Indian telecom operators:
```ini
SMS_DEFAULT_GATEWAY=msg91
SMS_SENDER_ID=ASRTVA
DLT_PRINCIPAL_ENTITY_ID=1101XXXXXXXXXXXX
DLT_APPOINTMENT_TEMPLATE_ID=1107XXXXXXXXXXXX
DLT_OTP_TEMPLATE_ID=1107XXXXXXXXXXXX
DLT_DISCHARGE_TEMPLATE_ID=1107XXXXXXXXXXXX
```

### 3.4 WebRTC TURN Cluster Configuration
To enable video telehealth connections across symmetric enterprise hospital firewalls:
```ini
WEBRTC_ICE_SERVERS=[{"urls":"stun:stun.l.google.com:19302"},{"urls":"turn:turn.asrtava.com:3478","username":"<ephemeral_user>","credential":"<hmac_key>"}]
TURN_STATIC_AUTH_SECRET=<high_entropy_turn_secret_min_32_chars>
```
