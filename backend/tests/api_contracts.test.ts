import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

describe('ASRTAVA API Contract & Boundary Condition Specifications', () => {

  // Standard API Envelope Definition
  const ApiResponseEnvelopeSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    code: z.string().optional(),
    data: z.any().optional(),
    requestId: z.string().optional(),
  });

  // Patient Registration Request Schema
  const PatientRegistrationSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Valid E.164 phone number required'),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD format required'),
    gender: z.enum(['Male', 'Female', 'Other']),
  });

  // --------------------------------------------------------------------------
  // 1. Success Envelope Contract
  // --------------------------------------------------------------------------
  it('1. Formats successful response conforming to canonical ASRTAVA envelope', () => {
    const mockSuccessResponse = {
      success: true,
      message: 'Patient registered successfully.',
      data: {
        id: 'pat-9912',
        uhid: 'ASR-PAT-2026-9912',
        fullName: 'Aarav Patel',
      },
      requestId: 'req-1731144000-xyz12',
    };

    const parsed = ApiResponseEnvelopeSchema.safeParse(mockSuccessResponse);
    assert.equal(parsed.success, true);
    assert.equal(mockSuccessResponse.success, true);
    assert.ok(mockSuccessResponse.data.id);
  });

  // --------------------------------------------------------------------------
  // 2. Error Envelope & Stack Trace Suppression Contract
  // --------------------------------------------------------------------------
  it('2. Suppresses internal database stack traces and returns clean error structure', () => {
    const rawError = new Error('FATAL: connection to server at "10.0.1.20", port 5432 failed: Connection refused\n    at Connection.parseE (/app/node_modules/pg/lib/connection.js:614:11)\n    at Connection.parseMessage (/app/node_modules/pg/lib/connection.js:413:19)');

    // Centralized Error Filter logic
    function sanitizeErrorResponse(err: any, requestId: string) {
      // In production, internal error details and stack traces must never leak to client
      return {
        success: false,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'A technical error occurred while processing your request. Please quote the Request ID to support.',
        requestId,
      };
    }

    const sanitized = sanitizeErrorResponse(rawError, 'req-err-001');

    assert.equal(sanitized.success, false);
    assert.equal(sanitized.code, 'INTERNAL_SERVER_ERROR');
    assert.equal((sanitized as any).stack, undefined, 'Stack trace must NEVER be present in response');
    assert.equal(sanitized.message.includes('Connection refused'), false, 'Internal DB IPs must not leak');
  });

  // --------------------------------------------------------------------------
  // 3. Schema Boundary Validation & 400 Bad Request
  // --------------------------------------------------------------------------
  it('3. Rejects invalid input with structured 400 validation error details', () => {
    const invalidPayload = {
      firstName: 'A', // Too short (min 2)
      lastName: '',   // Empty
      phone: '12345', // Invalid phone format
      dateOfBirth: 'invalid-date',
      gender: 'Unknown', // Invalid enum
    };

    const validation = PatientRegistrationSchema.safeParse(invalidPayload);
    assert.equal(validation.success, false);

    if (!validation.success) {
      const issues = validation.error.issues;
      assert.ok(issues.length >= 4);
      assert.ok(issues.some(i => i.path.includes('firstName')));
      assert.ok(issues.some(i => i.path.includes('phone')));
    }
  });

  // --------------------------------------------------------------------------
  // 4. State Machine Transition Conflict (409 Conflict)
  // --------------------------------------------------------------------------
  it('4. Rejects invalid business state transition with 409 Conflict', () => {
    type AppointmentStatus = 'scheduled' | 'checked_in' | 'in_consultation' | 'completed' | 'cancelled';

    const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      scheduled: ['checked_in', 'cancelled'],
      checked_in: ['in_consultation', 'cancelled'],
      in_consultation: ['completed'],
      completed: [], // Terminal state
      cancelled: [], // Terminal state
    };

    function transitionAppointment(current: AppointmentStatus, target: AppointmentStatus): { allowed: boolean; code?: string } {
      if (!validTransitions[current].includes(target)) {
        return {
          allowed: false,
          code: 'INVALID_STATE_TRANSITION',
        };
      }
      return { allowed: true };
    }

    // Valid transition: scheduled -> checked_in
    assert.equal(transitionAppointment('scheduled', 'checked_in').allowed, true);

    // Invalid transition: completed -> in_consultation (re-opening finalized encounter)
    const invalidTransition = transitionAppointment('completed', 'in_consultation');
    assert.equal(invalidTransition.allowed, false);
    assert.equal(invalidTransition.code, 'INVALID_STATE_TRANSITION');

    // Invalid transition: cancelled -> completed
    const cancelledTransition = transitionAppointment('cancelled', 'completed');
    assert.equal(cancelledTransition.allowed, false);
  });

  // --------------------------------------------------------------------------
  // 5. Financial Payment Idempotency Key Duplicate Prevention
  // --------------------------------------------------------------------------
  it('5. Detects duplicate financial payment submission and prevents double charge', () => {
    const processedIdempotencyKeys = new Set<string>();

    function processPaymentWithIdempotency(key: string, amount: number) {
      if (processedIdempotencyKeys.has(key)) {
        return {
          statusCode: 409,
          code: 'IDEMPOTENCY_KEY_REUSED',
          message: 'A payment transaction with this idempotency key was already completed.',
        };
      }
      processedIdempotencyKeys.add(key);
      return {
        statusCode: 200,
        status: 'settled',
        amount,
      };
    }

    const key = 'idem-trans-2026-9901';
    // First transmission
    const firstCall = processPaymentWithIdempotency(key, 5000);
    assert.equal(firstCall.statusCode, 200);

    // Duplicate transmission (network retry or accidental double click)
    const duplicateCall = processPaymentWithIdempotency(key, 5000);
    assert.equal(duplicateCall.statusCode, 409);
    assert.equal(duplicateCall.code, 'IDEMPOTENCY_KEY_REUSED');
  });
});

