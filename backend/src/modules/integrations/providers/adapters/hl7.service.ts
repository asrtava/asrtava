export interface HL7Message {
  msh: Record<string, string>;
  pid?: Record<string, string>;
  pv1?: Record<string, string>;
  obrs?: Array<Record<string, string>>;
  obxs?: Array<Record<string, string>>;
}

export class HL7Service {
  /**
   * Parses standard HL7 v2.x pipe-delimited message string into structured segments
   */
  public static parseHL7(rawText: string): HL7Message {
    const lines = rawText.split(/\r?\n|\r/).filter((l) => l.trim().length > 0);
    const parsed: HL7Message = { msh: {} };
    const obrs: Array<Record<string, string>> = [];
    const obxs: Array<Record<string, string>> = [];

    for (const line of lines) {
      const fields = line.split('|');
      const segmentType = fields[0];

      if (segmentType === 'MSH') {
        parsed.msh = {
          sendingApp: fields[2] || '',
          sendingFacility: fields[3] || '',
          receivingApp: fields[4] || '',
          receivingFacility: fields[5] || '',
          dateTime: fields[6] || '',
          messageType: fields[8] || '',
          messageControlId: fields[9] || '',
          processingId: fields[10] || 'P',
          version: fields[11] || '2.5.1',
        };
      } else if (segmentType === 'PID') {
        parsed.pid = {
          setId: fields[1] || '1',
          patientId: fields[2] || fields[3] || '',
          uhid: fields[3] || '',
          patientName: fields[5] || '',
          dob: fields[7] || '',
          gender: fields[8] || '',
          address: fields[11] || '',
          phone: fields[13] || '',
        };
      } else if (segmentType === 'PV1') {
        parsed.pv1 = {
          patientClass: fields[2] || 'O',
          assignedLocation: fields[3] || '',
          attendingDoctor: fields[7] || '',
          visitNumber: fields[19] || '',
        };
      } else if (segmentType === 'OBR') {
        obrs.push({
          setId: fields[1] || '1',
          placerOrderNumber: fields[2] || '',
          fillerOrderNumber: fields[3] || '',
          universalServiceId: fields[4] || '',
          observationDateTime: fields[7] || '',
          specimenReceivedDateTime: fields[14] || '',
          resultStatus: fields[25] || 'F',
        });
      } else if (segmentType === 'OBX') {
        obxs.push({
          setId: fields[1] || '1',
          valueType: fields[2] || 'NM', // NM = Numeric, ST = String
          observationIdentifier: fields[3] || '',
          observationValue: fields[5] || '',
          units: fields[6] || '',
          referenceRange: fields[7] || '',
          abnormalFlags: fields[8] || 'N', // N = Normal, H = High, L = Low, A = Abnormal
          resultStatus: fields[11] || 'F',
        });
      }
    }

    if (obrs.length > 0) parsed.obrs = obrs;
    if (obxs.length > 0) parsed.obxs = obxs;

    return parsed;
  }

  /**
   * Generates an Outbound HL7 v2.5.1 ORU^R01 (Observation Result) Message
   */
  public static buildORUMessage(data: {
    messageControlId: string;
    hospitalCode: string;
    uhid: string;
    patientName: string;
    gender: string;
    dob?: string;
    orderNumber: string;
    testCode: string;
    testName: string;
    results: Array<{
      code: string;
      name: string;
      value: string | number;
      units: string;
      range: string;
      flag: string;
    }>;
  }): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

    const msh = `MSH|^~\\&|ASRTAVA_HMS|${data.hospitalCode}|EXT_LIS|CENTRAL|${timestamp}||ORU^R01|${data.messageControlId}|P|2.5.1`;
    const pid = `PID|1||${data.uhid}||${data.patientName}||${data.dob || '19900101'}|${data.gender}`;
    const obr = `OBR|1|${data.orderNumber}||${data.testCode}^${data.testName}|||${timestamp}||||||||||||||||F`;

    const obxLines = data.results.map((r, idx) => {
      return `OBX|${idx + 1}|NM|${r.code}^${r.name}||${r.value}|${r.units}|${r.range}|${r.flag}|||F`;
    });

    return [msh, pid, obr, ...obxLines].join('\r\n');
  }

  /**
   * Generates standard HL7 ACK (Acknowledgement) message
   */
  public static buildACK(
    incomingControlId: string,
    ackCode: 'AA' | 'AE' | 'AR' = 'AA',
    errorMessage?: string
  ): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const msh = `MSH|^~\\&|ASRTAVA_HMS|RECEIVER|EXT_LIS|SENDER|${timestamp}||ACK|ACK-${Date.now()}|P|2.5.1`;
    const msa = `MSA|${ackCode}|${incomingControlId}${errorMessage ? `|${errorMessage}` : ''}`;
    return [msh, msa].join('\r\n');
  }
}

