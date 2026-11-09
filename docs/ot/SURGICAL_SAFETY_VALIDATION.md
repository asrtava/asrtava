# ASRTAVA WHO Surgical Safety Checklist Validation

## 1. Regulatory Context
The World Health Organization (WHO) Surgical Safety Checklist has been proven internationally to reduce perioperative mortality and major surgical complications by more than 30%. ASRTAVA implements this as an automated digital hard-stop protocol.

## 2. Three Mandatory Phases
1. **Phase 1: Sign-In (Prior to Induction of Anaesthesia)**:
   - Verbal verification of patient identity, surgical consent, and operative site marking.
   - Confirmation of functioning pulse oximeter.
   - Known allergy audit.
   - Assessment of difficult airway / aspiration risk.
   - Anticipated blood loss calculation ($> 500\text{ mL}$ requires blood crossmatch verification).
2. **Phase 2: Time-Out (Prior to Skin Incision)**:
   - All operating room team members introduce themselves by name and role.
   - Surgeon, anaesthetist, and circulating nurse verbally confirm patient name, procedure, and anatomical site.
   - Verification that surgical antibiotic prophylaxis was administered within 60 minutes prior to incision.
   - Essential diagnostic imaging actively displayed on theatre monitors.
   - Strict sequence assertion: Attempting Time-Out before Sign-In throws `WHO_CHECKLIST_SEQUENCE_ERROR`.
3. **Phase 3: Sign-Out (Prior to Patient Leaving Operating Room)**:
   - Nurse verbally confirms name of the surgical procedure recorded.
   - Instrument, sponge, and sharps count confirmed as balanced.
   - Specimen labeling confirmed with two unique patient identifiers.
   - Surgeon, anaesthetist, and nursing staff review post-op management concerns.

