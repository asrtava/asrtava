# Appointment Booking Workflow & Concurrency Protection

## 1. Booking Sequence (`BookAppointmentScreen.tsx`)
1. **Doctor & Hospital Context Confirmation**: Displays selected doctor, specialty, and hospital location.
2. **Consultation Format**:
   - `In-Person Hospital Visit` (Physical OPD consultation)
   - `Secure Tele-Consult` (Video consultation)
3. **Date Selection**: Horizontal date selector highlighting available consultation days.
4. **Time Slot Reservation**: Slot grid displaying available morning and afternoon consultation windows.
5. **Chief Complaint / Symptoms Input**: Patient enters symptoms or reasons for visit.
6. **Booking Pass Review & Confirmation**:
   - Displays patient name, UHID, consultation format, and total fee.
   - Invokes backend `POST /api/v1/appointments`.
   - The backend locks the doctor schedule slot using PostgreSQL `SELECT ... FOR UPDATE` to prevent race conditions and double-booking.
   - Generates unique appointment token (e.g. *Token #14*) and check-in pass.

