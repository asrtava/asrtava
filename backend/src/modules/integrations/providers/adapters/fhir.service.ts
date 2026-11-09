export class FHIRService {
  /**
   * Transforms internal ASRTAVA Patient model to FHIR R4 Patient Resource
   */
  public static toFHIRPatient(patient: {
    id: string;
    uhid: string;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    phone: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    abhaId?: string;
  }) {
    return {
      resourceType: 'Patient',
      id: patient.id,
      identifier: [
        {
          system: 'https://asrtava.health/uhid',
          value: patient.uhid,
          use: 'official',
        },
        ...(patient.abhaId
          ? [
              {
                system: 'https://abdm.gov.in/abha',
                value: patient.abhaId,
                use: 'secondary',
              },
            ]
          : []),
      ],
      active: true,
      name: [
        {
          use: 'official',
          family: patient.lastName,
          given: [patient.firstName],
        },
      ],
      telecom: [
        {
          system: 'phone',
          value: patient.phone,
          use: 'mobile',
        },
        ...(patient.email
          ? [
              {
                system: 'email',
                value: patient.email,
              },
            ]
          : []),
      ],
      gender: patient.gender ? patient.gender.toLowerCase() : 'unknown',
      birthDate: patient.dateOfBirth,
      address: [
        {
          line: patient.address ? [patient.address] : undefined,
          city: patient.city,
          state: patient.state,
          country: 'IND',
        },
      ],
    };
  }

  /**
   * Transforms internal lab analyte or vital to FHIR R4 Observation Resource
   */
  public static toFHIRObservation(observation: {
    id: string;
    patientId: string;
    patientUhid: string;
    code: string;
    display: string;
    value: number | string;
    unit?: string;
    referenceRangeLow?: number;
    referenceRangeHigh?: number;
    effectiveDateTime: string;
    status?: 'final' | 'preliminary' | 'amended';
  }) {
    const isNumeric = typeof observation.value === 'number' || !isNaN(Number(observation.value));

    return {
      resourceType: 'Observation',
      id: observation.id,
      status: observation.status || 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'laboratory',
              display: 'Laboratory',
            },
          ],
        },
      ],
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: observation.code,
            display: observation.display,
          },
        ],
        text: observation.display,
      },
      subject: {
        reference: `Patient/${observation.patientId}`,
        display: `UHID: ${observation.patientUhid}`,
      },
      effectiveDateTime: observation.effectiveDateTime,
      ...(isNumeric
        ? {
            valueQuantity: {
              value: Number(observation.value),
              unit: observation.unit || '',
              system: 'http://unitsofmeasure.org',
            },
          }
        : {
            valueString: String(observation.value),
          }),
      referenceRange:
        observation.referenceRangeLow !== undefined || observation.referenceRangeHigh !== undefined
          ? [
              {
                low: observation.referenceRangeLow !== undefined ? { value: observation.referenceRangeLow } : undefined,
                high: observation.referenceRangeHigh !== undefined ? { value: observation.referenceRangeHigh } : undefined,
              },
            ]
          : undefined,
    };
  }

  /**
   * Packages FHIR Resources into an ABDM-compliant Care Context Bundle
   */
  public static createFHIRBundle(bundleId: string, resources: any[]) {
    return {
      resourceType: 'Bundle',
      id: bundleId,
      type: 'collection',
      timestamp: new Date().toISOString(),
      entry: resources.map((r) => ({
        fullUrl: `urn:uuid:${r.id}`,
        resource: r,
      })),
    };
  }
}

