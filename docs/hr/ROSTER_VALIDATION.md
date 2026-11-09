# ASRTAVA — Shift Rostering & Anti-Collision Validation

## 1. Overview
Hospital staff rostering requires 24/7 coverage across emergency rooms, ICUs, operation theatres, wards, and pharmacies. The ASRTAVA Rostering Engine prevents scheduling collisions and ensures clinical continuity.

## 2. Anti-Collision Rules & Concurrency Guards
1. **Single Shift Per Day**: An employee cannot be rostered for more than one primary shift on the same calendar date without explicit reliever/on-call flag. The system detects and rejects conflicting assignments with `409 Conflict`.
2. **Rest Period Guidelines**: The system enforces mandatory minimum rest periods between shifts (e.g. night shift ending at 07:00 AM cannot immediately be followed by a morning shift at 08:00 AM).
3. **Duty Swaps**: When two clinicians agree to swap shifts, both must acknowledge the request, and the Department Incharge must approve the exchange before roster tables are updated.

