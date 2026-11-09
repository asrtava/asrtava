# Patient Document Upload & Medical Repository

## 1. Overview (`DocumentUploadScreen.tsx`)
Allows patients to upload external medical records directly into their hospital file:
- Categories supported: `Previous Prescription`, `External Lab Report`, `Health Insurance Policy Card`, `Referral Letter`.
- Media selection: Camera capture or native file browser (PDF, JPG, PNG).
- Validation: Enforces 15MB file size limit and MIME-type integrity checks.
- Encryption: Uploaded files are encrypted and tagged with patient UHID, immediately visible to authorized hospital physicians in the Doctor Consultation Workspace.

