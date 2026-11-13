/**
 * ASRTAVA Medical Intelligence & Recommendation Engine
 * Provides specialized clinical decision support (CDSS), revenue cycle intelligence (RCIS),
 * nursing vigilance (NEWS2), and pharmacy supply chain optimization across portals.
 */

// ==========================================
// 1. DOCTOR & CLINICAL DECISION SUPPORT (CDSS)
// ==========================================

export interface DrugInteractionAlert {
  drugA: string;
  drugB: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  mechanism: string;
  recommendation: string;
}

export interface AllergyAlert {
  drug: string;
  allergyMatch: string;
  severity: 'FATAL_ANAPHYLAXIS' | 'SEVERE' | 'MODERATE';
  recommendation: string;
}

export interface ClinicalPathway {
  diagnosis: string;
  recommendedLabs: string[];
  recommendedRadiology: string[];
  firstLineTherapies: string[];
  monitoringGuidance: string;
}

const KNOWN_INTERACTIONS: Array<{
  pair: [string, string];
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  mechanism: string;
  recommendation: string;
}> = [
  {
    pair: ['warfarin', 'aspirin'],
    severity: 'CRITICAL',
    mechanism: 'Synergistic antiplatelet and anticoagulant effect increases fatal gastrointestinal/intracranial bleeding risk.',
    recommendation: 'Avoid co-prescription unless mechanical heart valve indicated. Co-prescribe PPI and monitor INR closely.'
  },
  {
    pair: ['clopidogrel', 'omeprazole'],
    severity: 'HIGH',
    mechanism: 'Omeprazole inhibits CYP2C19, significantly reducing the active antiplatelet metabolite of clopidogrel.',
    recommendation: 'Substitute Omeprazole with Pantoprazole or Famotidine which do not impair CYP2C19.'
  },
  {
    pair: ['lisinopril', 'spironolactone'],
    severity: 'HIGH',
    mechanism: 'Dual blockade of renin-angiotensin-aldosterone axis induces life-threatening hyperkalemia and acute kidney injury.',
    recommendation: 'Monitor serum Potassium and creatinine within 5 days. Hold potassium supplements.'
  },
  {
    pair: ['metformin', 'iodinated contrast'],
    severity: 'CRITICAL',
    mechanism: 'Radiocontrast-induced nephropathy can lead to catastrophic lactic acidosis accumulation.',
    recommendation: 'Withhold Metformin 48 hours before and 48 hours after iodinated contrast imaging.'
  },
  {
    pair: ['ciprofloxacin', 'theophylline'],
    severity: 'HIGH',
    mechanism: 'Ciprofloxacin inhibits hepatic CYP1A2, elevating theophylline serum levels into toxic ranges.',
    recommendation: 'Reduce theophylline dose by 50% or choose Azithromycin/Levofloxacin.'
  },
  {
    pair: ['atorvastatin', 'clarithromycin'],
    severity: 'HIGH',
    mechanism: 'CYP3A4 inhibition by macrolide elevates statin exposure, precipitating rhabdomyolysis and renal failure.',
    recommendation: 'Temporarily suspend Atorvastatin during antibiotic course or use Rosuvastatin.'
  }
];

const ALLERGY_CROSS_REACTIVITY: Record<string, { triggers: string[]; severity: 'FATAL_ANAPHYLAXIS' | 'SEVERE' | 'MODERATE' }> = {
  penicillin: {
    triggers: ['amoxicillin', 'ampicillin', 'augmentin', 'piperacillin', 'penicillin v', 'tazobactam'],
    severity: 'FATAL_ANAPHYLAXIS'
  },
  cephalosporin: {
    triggers: ['ceftriaxone', 'cefepime', 'cefixime', 'cefuroxime', 'cephalexin'],
    severity: 'SEVERE'
  },
  sulfa: {
    triggers: ['bactrim', 'trimethoprim', 'sulfamethoxazole', 'sulfasalazine', 'furosemide'],
    severity: 'SEVERE'
  },
  nsaid: {
    triggers: ['aspirin', 'ibuprofen', 'diclofenac', 'naproxen', 'ketorolac'],
    severity: 'SEVERE'
  }
};

const CLINICAL_PATHWAYS: Record<string, ClinicalPathway> = {
  'acute coronary syndrome': {
    diagnosis: 'Acute Coronary Syndrome (ACS / STEMI / NSTEMI)',
    recommendedLabs: ['Troponin-I STAT (0h & 3h)', 'CK-MB', 'Lipid Profile', 'Serum Creatinine', 'CBC'],
    recommendedRadiology: ['12-Lead ECG STAT', '2D Echocardiography', 'Chest X-Ray (Portable)'],
    firstLineTherapies: ['Aspirin 300mg Loading', 'Ticagrelor 180mg or Clopidogrel 300mg', 'Atorvastatin 80mg STAT', 'Sublingual Nitroglycerin'],
    monitoringGuidance: 'Continuous 12-lead telemetry monitoring in Cardiac ICU. Target door-to-balloon time < 90 mins for primary PCI.'
  },
  'type 2 diabetes': {
    diagnosis: 'Type 2 Diabetes Mellitus with Complications',
    recommendedLabs: ['HbA1c', 'Fasting & Post-Prandial Plasma Glucose', 'Urine Microalbumin/Creatinine Ratio', 'Lipid Panel', 'eGFR'],
    recommendedRadiology: ['Fundus Examination (Retinopathy screening)', 'Bilateral Lower Extremity Arterial Doppler (if PAD symptoms)'],
    firstLineTherapies: ['Metformin 500mg BD with meals', 'SGLT2 Inhibitor (Dapagliflozin 10mg) if ASCVD/CKD', 'Statin therapy'],
    monitoringGuidance: 'Self-monitoring blood glucose log. Target HbA1c < 7.0% without inducing hypoglycemic episodes.'
  },
  'pneumonia': {
    diagnosis: 'Community-Acquired Pneumonia (CAP)',
    recommendedLabs: ['Blood Cultures x 2 sets (prior to antibiotics)', 'CBC with differential', 'C-Reactive Protein (CRP)', 'Serum Procalcitonin'],
    recommendedRadiology: ['Chest X-Ray PA View', 'High-Resolution Chest CT (if non-resolving or immunocompromised)'],
    firstLineTherapies: ['Ceftriaxone 1g IV OD + Azithromycin 500mg IV OD', 'Incentive Spirometry & Chest Physiotherapy', 'Supplemental O2 targeting SpO2 94-98%'],
    monitoringGuidance: 'CURB-65 assessment for ICU admission. Re-evaluate clinical response and oral step-down at 48-72 hours.'
  },
  'hypertension': {
    diagnosis: 'Essential Hypertension (Stage 2)',
    recommendedLabs: ['Serum Electrolytes (Na+, K+)', 'Serum Creatinine & Urea', 'Urinalysis', 'Fasting Blood Glucose'],
    recommendedRadiology: ['12-Lead ECG (Left Ventricular Hypertrophy screening)', 'Renal Artery Doppler (if resistant)'],
    firstLineTherapies: ['Telmisartan 40mg OD', 'Amlodipine 5mg OD (if BP > 20/10 mmHg above goal)', 'DASH dietary sodium restriction'],
    monitoringGuidance: 'Home BP diary. Target BP < 130/80 mmHg within 3 months.'
  }
};

export const CDSS = {
  checkDrugInteractions(existingDrugs: string[], candidateDrug: string): DrugInteractionAlert[] {
    const alerts: DrugInteractionAlert[] = [];
    const lowerCandidate = candidateDrug.toLowerCase();

    for (const drug of existingDrugs) {
      const lowerExisting = drug.toLowerCase();
      for (const rule of KNOWN_INTERACTIONS) {
        const [a, b] = rule.pair;
        if (
          (lowerCandidate.includes(a) && lowerExisting.includes(b)) ||
          (lowerCandidate.includes(b) && lowerExisting.includes(a))
        ) {
          alerts.push({
            drugA: candidateDrug,
            drugB: drug,
            severity: rule.severity,
            mechanism: rule.mechanism,
            recommendation: rule.recommendation
          });
        }
      }
    }
    return alerts;
  },

  checkAllergies(patientAllergies: string[], candidateDrug: string): AllergyAlert[] {
    const alerts: AllergyAlert[] = [];
    const lowerCandidate = candidateDrug.toLowerCase();

    for (const allergy of patientAllergies) {
      const lowerAllergy = allergy.toLowerCase();
      for (const [classKey, config] of Object.entries(ALLERGY_CROSS_REACTIVITY)) {
        if (lowerAllergy.includes(classKey)) {
          for (const trigger of config.triggers) {
            if (lowerCandidate.includes(trigger)) {
              alerts.push({
                drug: candidateDrug,
                allergyMatch: `${allergy} (${classKey.toUpperCase()} class cross-reactivity)`,
                severity: config.severity,
                recommendation: `Patient has documented allergy to ${allergy}. Strictly contra-indicated. Select an alternative non-${classKey} class agent.`
              });
            }
          }
        }
      }
    }
    return alerts;
  },

  getClinicalPathway(condition: string): ClinicalPathway | null {
    const lower = condition.toLowerCase();
    for (const [key, pathway] of Object.entries(CLINICAL_PATHWAYS)) {
      if (lower.includes(key) || key.includes(lower)) {
        return pathway;
      }
    }
    return null;
  }
};

// ==========================================
// 2. NURSING & INPATIENT VIGILANCE (NEWS2)
// ==========================================

export interface NEWS2Result {
  score: number;
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH';
  frequency: string;
  clinicalAction: string;
  parameters: Record<string, number>;
}

export const NursingVigilance = {
  calculateNEWS2(vitals: {
    respiratoryRate: number;
    spo2: number;
    onOxygen: boolean;
    systolicBP: number;
    heartRate: number;
    temperature: number;
    consciousness: 'ALERT' | 'VOICE' | 'PAIN' | 'UNRESPONSIVE';
  }): NEWS2Result {
    let score = 0;
    const parameters: Record<string, number> = {};

    // Respiratory Rate
    let rrScore = 0;
    if (vitals.respiratoryRate <= 8 || vitals.respiratoryRate >= 25) rrScore = 3;
    else if (vitals.respiratoryRate >= 21) rrScore = 2;
    else if (vitals.respiratoryRate <= 11) rrScore = 1;
    score += rrScore;
    parameters['Respiratory Rate'] = rrScore;

    // SpO2
    let spo2Score = 0;
    if (vitals.spo2 <= 91) spo2Score = 3;
    else if (vitals.spo2 <= 93) spo2Score = 2;
    else if (vitals.spo2 <= 95) spo2Score = 1;
    score += spo2Score;
    parameters['Oxygen Saturation'] = spo2Score;

    // Supplemental Oxygen
    let o2Score = vitals.onOxygen ? 2 : 0;
    score += o2Score;
    parameters['Air / Oxygen'] = o2Score;

    // Systolic BP
    let sbpScore = 0;
    if (vitals.systolicBP <= 90 || vitals.systolicBP >= 220) sbpScore = 3;
    else if (vitals.systolicBP <= 100) sbpScore = 2;
    else if (vitals.systolicBP <= 110) sbpScore = 1;
    score += sbpScore;
    parameters['Systolic BP'] = sbpScore;

    // Heart Rate
    let hrScore = 0;
    if (vitals.heartRate <= 40 || vitals.heartRate >= 131) hrScore = 3;
    else if (vitals.heartRate >= 111) hrScore = 2;
    else if (vitals.heartRate <= 50 || vitals.heartRate >= 91) hrScore = 1;
    score += hrScore;
    parameters['Heart Rate'] = hrScore;

    // Temperature
    let tempScore = 0;
    if (vitals.temperature <= 35.0) tempScore = 3;
    else if (vitals.temperature >= 39.1) tempScore = 2;
    else if (vitals.temperature <= 36.0 || vitals.temperature >= 38.1) tempScore = 1;
    score += tempScore;
    parameters['Temperature'] = tempScore;

    // Consciousness (AVPU)
    let avpuScore = vitals.consciousness === 'ALERT' ? 0 : 3;
    score += avpuScore;
    parameters['Consciousness (AVPU)'] = avpuScore;

    // Determine Risk Category & Action
    let riskCategory: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let frequency = 'Every 12 hours';
    let clinicalAction = 'Routine nursing observations. Continue baseline ward care plan.';

    if (score >= 7 || Object.values(parameters).some((s) => s === 3)) {
      riskCategory = 'HIGH';
      frequency = 'Continuous / Every 30 mins';
      clinicalAction = 'Emergency Medical Team (MET) / ICU Registrar call. Urgent bedside review and consider ICU transfer.';
    } else if (score >= 5) {
      riskCategory = 'MEDIUM';
      frequency = 'Minimum hourly';
      clinicalAction = 'Urgent review by Ward Doctor. Escalate care to Senior Nurse in charge and prepare resuscitation equipment.';
    } else if (score >= 1) {
      riskCategory = 'LOW';
      frequency = 'Every 4-6 hours';
      clinicalAction = 'Inform Registered Nurse in charge. Evaluate response to treatment.';
    }

    return { score, riskCategory, frequency, clinicalAction, parameters };
  }
};

// ==========================================
// 3. FINANCE & REVENUE CYCLE INTELLIGENCE (RCIS)
// ==========================================

export interface DenialPrediction {
  riskScore: number; // 0 to 100
  riskTier: 'LOW' | 'MODERATE' | 'CRITICAL';
  detectedVulnerabilities: string[];
  remediationSteps: string[];
}

export interface UnbilledChargeItem {
  serviceName: string;
  department: string;
  estimatedAmount: number;
  reason: string;
}

export const RevenueCycleIntelligence = {
  predictClaimDenial(claim: {
    insurer: string;
    patientName: string;
    amount: number;
    diagnosis: string;
    hasPreAuthApproval: boolean;
    hasDischargeSummary: boolean;
    hasItemizedBills: boolean;
    hasInvestigativeReports: boolean;
  }): DenialPrediction {
    let risk = 10;
    const vulnerabilities: string[] = [];
    const remediation: string[] = [];

    if (!claim.hasPreAuthApproval) {
      risk += 45;
      vulnerabilities.push('Missing Initial Cashless Pre-Authorization Letter from TPA');
      remediation.push('Upload pre-authorization approval document or file emergency intimation form.');
    }

    if (!claim.hasDischargeSummary) {
      risk += 25;
      vulnerabilities.push('Discharge summary with physician signature not attached');
      remediation.push('Ensure attending consultant completes final diagnosis and treatment summary.');
    }

    if (!claim.hasInvestigativeReports) {
      risk += 15;
      vulnerabilities.push('Clinical justification reports (ECG/Echo/CT/Biopsy) missing');
      remediation.push('Attach verified PACS / LIS diagnostic reports validating admission justification.');
    }

    if (claim.amount > 100000 && !claim.hasItemizedBills) {
      risk += 20;
      vulnerabilities.push('High-value claim (> ₹1,00,000) lacks consolidated itemized pharmacy & OT breakdown');
      remediation.push('Generate categorized invoice breakdown before submission.');
    }

    const clampedRisk = Math.min(99, Math.max(5, risk));
    const riskTier = clampedRisk >= 60 ? 'CRITICAL' : clampedRisk >= 35 ? 'MODERATE' : 'LOW';

    return {
      riskScore: clampedRisk,
      riskTier,
      detectedVulnerabilities: vulnerabilities,
      remediationSteps: remediation
    };
  },

  detectUnbilledCharges(
    administeredMedications: string[],
    billedItems: string[]
  ): UnbilledChargeItem[] {
    const unbilled: UnbilledChargeItem[] = [];
    const billedLower = billedItems.map((b) => b.toLowerCase());

    const HIGH_VALUE_DRUGS = [
      { name: 'Meropenem 1g IV', dept: 'Pharmacy', cost: 1850 },
      { name: 'Enoxaparin 40mg Inj', dept: 'Pharmacy', cost: 720 },
      { name: 'Human Albumin 20%', dept: 'Blood Bank', cost: 4200 },
      { name: 'Remdesivir 100mg IV', dept: 'Pharmacy', cost: 2400 }
    ];

    for (const drug of HIGH_VALUE_DRUGS) {
      const wasAdministered = administeredMedications.some((m) => m.toLowerCase().includes(drug.name.toLowerCase()));
      const wasBilled = billedLower.some((b) => b.includes(drug.name.toLowerCase()));

      if (wasAdministered && !wasBilled) {
        unbilled.push({
          serviceName: drug.name,
          department: drug.dept,
          estimatedAmount: drug.cost,
          reason: 'Documented as administered in Inpatient MAR, but missing from patient billing invoice.'
        });
      }
    }

    return unbilled;
  }
};

// ==========================================
// 4. PHARMACY SUPPLY INTELLIGENCE
// ==========================================

export interface PharmacyStockRecommendation {
  medicineName: string;
  currentStock: number;
  reorderLevel: number;
  status: 'STOCKOUT_CRITICAL' | 'EXPIRY_RISK_FEFO' | 'OPTIMAL';
  recommendedAction: string;
  suggestedGenericAlternative?: string;
}

const GENERIC_ALTERNATIVES: Record<string, string> = {
  'lipitor': 'Atorvastatin 20mg (Standard Generic)',
  'augmenitn': 'Amoxicillin + Clavulanate 625mg',
  'plavix': 'Clopidogrel 75mg',
  'crestor': 'Rosuvastatin 10mg',
  'januvia': 'Sitagliptin 100mg'
};

export const PharmacyIntelligence = {
  evaluateInventoryItem(item: {
    name: string;
    currentStock: number;
    reorderLevel: number;
    expiryDate: string;
  }): PharmacyStockRecommendation {
    const today = new Date();
    const expiry = new Date(item.expiryDate);
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (item.currentStock <= item.reorderLevel * 0.25) {
      const match = Object.keys(GENERIC_ALTERNATIVES).find((k) => item.name.toLowerCase().includes(k));
      return {
        medicineName: item.name,
        currentStock: item.currentStock,
        reorderLevel: item.reorderLevel,
        status: 'STOCKOUT_CRITICAL',
        recommendedAction: `Stock critically low (${item.currentStock} units remaining). Raise purchase order for ${item.reorderLevel * 2} units immediately.`,
        suggestedGenericAlternative: match ? GENERIC_ALTERNATIVES[match] : undefined
      };
    }

    if (daysUntilExpiry <= 90 && daysUntilExpiry > 0) {
      return {
        medicineName: item.name,
        currentStock: item.currentStock,
        reorderLevel: item.reorderLevel,
        status: 'EXPIRY_RISK_FEFO',
        recommendedAction: `Batch expires in ${daysUntilExpiry} days (${item.expiryDate}). Prioritize dispensing using FEFO protocol or redistribute to high-turnover ICU/ER.`
      };
    }

    return {
      medicineName: item.name,
      currentStock: item.currentStock,
      reorderLevel: item.reorderLevel,
      status: 'OPTIMAL',
      recommendedAction: 'Stock levels within safe operational buffer.'
    };
  }
};
