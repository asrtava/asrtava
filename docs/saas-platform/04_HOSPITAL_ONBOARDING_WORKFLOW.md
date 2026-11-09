# Hospital Self-Serve Onboarding Workflow

## 1. Public Entry Point: `/register-hospital`
Hospital administrators register their healthcare organizations via the public onboarding gateway:
1. Organization Name & Slug generation (`apex-care`).
2. Official email, phone, location (city, state, PIN).
3. Primary Hospital Administrator credentials.
4. Preferred subscription plan (includes complimentary 30-day Enterprise trial).

## 2. Multi-Step Onboarding Stepper (10 Steps)
Progress is tracked in `tenant_onboarding` with a cryptographically secure `resumption_token`:
- **Step 1: Organization Profile**: Entity legal name, registration number, GSTIN.
- **Step 2: Hospital Branding**: Custom logo upload (PNG/SVG) and primary accent color selection.
- **Step 3: Branch Setup**: Verification of initial `Main Campus` and multi-facility options.
- **Step 4: Clinical Departments**: Cardiology, Medicine, Orthopedics, Pediatrics, OB/GYN, Emergency.
- **Step 5: Working Hours & Shifts**: Consultation slot duration (10m, 15m, 20m, 30m) and OPD shift windows.
- **Step 6: Clinical Modules**: OPD, IPD, Pharmacy FEFO, LIMS, RIS RIS, Billing.
- **Step 7: Staff Invitations**: Initial attending doctors and department HOD assignments.
- **Step 8: Plan Confirmation**: Free trial activation with zero credit card commitment.
- **Step 9: Billing Details**: Tax invoice address and GST treatment settings.
- **Step 10: Final Activation**: Cryptographic tenant lock, RLS initialization, and workspace launch.

Administrators can save their progress at any step and resume later using `/onboarding?token=onb_...`.

