export const EVENT_CODES = {
  IAF: { name: 'Receipt Letter Emailed', desc: 'Application receipt notice generated and emailed.', cat: 'receipt' },
  IAA: { name: 'Receipt Notice Sent (Mail)', desc: 'Physical receipt notice mailed.', cat: 'receipt' },
  AALB: { name: 'Received at Lockbox Facility', desc: 'Package received at USCIS lockbox.', cat: 'receipt' },
  FTA0: { name: 'Database Checks Received', desc: 'Background check results received (FBI, biometrics, name checks).', cat: 'checks' },
  FTA1: { name: 'Database Checks Received', desc: 'Follow-up background checks — case actively being reviewed.', cat: 'checks' },
  FNB: { name: 'Fingerprints Taken at ASC', desc: 'Biometrics collected at Application Support Center.', cat: 'checks' },
  FNA: { name: 'Fingerprint Appointment Notice Ordered', desc: 'Biometrics appointment notice ordered.', cat: 'checks' },
  FJ: { name: 'Interview Scheduled', desc: 'Interview notice ordered — major milestone.', cat: 'interview' },
  HG: { name: 'Interview Conducted', desc: 'Interview completed; post-interview adjudication.', cat: 'interview' },
  IM: { name: 'Interview Notice Sent', desc: 'Official interview notice sent.', cat: 'interview' },
  FT0: { name: 'Officer Processing Begun', desc: 'Officer actively reviewing the case.', cat: 'processing' },
  TA: { name: 'Pre-Adjudicated — Under Review', desc: 'Case under supervisory review before final decision.', cat: 'processing' },
  DA: { name: 'Application APPROVED', desc: 'Application approved; approval notice ordered.', cat: 'approved' },
  H008: { name: 'Case Approved', desc: 'I-485 approved; green card processing.', cat: 'approved' },
  IEA: { name: 'Approval Notice Sent', desc: 'Approval notice mailed.', cat: 'approved' },
  IEC: { name: 'Welcome Notice Sent', desc: 'LPR / green card status granted.', cat: 'approved' },
  LAA: { name: 'Card Request Sent to Production', desc: 'Green card production request sent.', cat: 'card' },
  LDA: { name: 'Green Card Produced', desc: 'Permanent resident card produced.', cat: 'card' },
  LEA: { name: 'Green Card Mailed', desc: 'Green card mailed — expect 7–10 business days.', cat: 'card' },
  FBA: { name: 'RFE Ordered', desc: 'Request for Evidence ordered.', cat: 'rfe' },
  IK: { name: 'RFE Sent', desc: 'Request for Evidence mailed.', cat: 'rfe' },
  HA: { name: 'RFE Response Received', desc: 'USCIS received your RFE response.', cat: 'rfe' },
  EA: { name: 'Denial Notice Ordered', desc: 'Denial notice ordered.', cat: 'denied' },
  IFA: { name: 'Denial Notice Sent', desc: 'Denial notice mailed.', cat: 'denied' },
  FS: { name: 'Adjudication Hold Placed', desc: 'Adjudication temporarily paused.', cat: 'hold' },
};

export const CAT_STYLE = {
  receipt: { label: 'Receipt', color: '#58a6ff' },
  checks: { label: 'Bg Checks', color: '#bc8cff' },
  interview: { label: 'Interview', color: '#d4a843' },
  approved: { label: 'Approved', color: '#3fb950' },
  denied: { label: 'Denied', color: '#f85149' },
  hold: { label: 'Hold', color: '#f0883e' },
  processing: { label: 'Processing', color: '#58a6ff' },
  card: { label: 'Green Card', color: '#3fb950' },
  rfe: { label: 'RFE', color: '#f85149' },
  default: { label: 'Event', color: '#8b949e' },
};

export function getEventInfo(code) {
  return EVENT_CODES[code] ?? {
    name: `Event: ${code}`,
    desc: `USCIS internal event code "${code}".`,
    cat: 'default',
  };
}
