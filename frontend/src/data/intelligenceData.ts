

// ─── Criminal Network Data ───────────────────────────────────────────

export interface NetworkNode {
  id: string;
  name: string;
  type: "accused" | "victim" | "location" | "account";
  group: number; // cluster id
  firCount: number;
  risk: "high" | "medium" | "low";
}

export interface NetworkEdge {
  source: string;
  target: string;
  type: "co-accused" | "shared-location" | "transaction" | "victim-link";
  weight: number;
}

export const networkNodes: NetworkNode[] = [
  { id: "A1", name: "Rajesh Kumar", type: "accused", group: 1, firCount: 7, risk: "high" },
  { id: "A2", name: "Suresh Patil", type: "accused", group: 1, firCount: 5, risk: "high" },
  { id: "A3", name: "Mohan Rao", type: "accused", group: 1, firCount: 3, risk: "medium" },
  { id: "A4", name: "Anil Gowda", type: "accused", group: 2, firCount: 6, risk: "high" },
  { id: "A5", name: "Prakash Shetty", type: "accused", group: 2, firCount: 4, risk: "medium" },
  { id: "A6", name: "Naveen Reddy", type: "accused", group: 2, firCount: 2, risk: "low" },
  { id: "A7", name: "Farhan Sheikh", type: "accused", group: 3, firCount: 8, risk: "high" },
  { id: "A8", name: "Kiran Das", type: "accused", group: 3, firCount: 3, risk: "medium" },
  { id: "A9", name: "Deepak Jain", type: "accused", group: 4, firCount: 2, risk: "low" },
  { id: "A10", name: "Vikram Singh", type: "accused", group: 4, firCount: 1, risk: "low" },
  { id: "V1", name: "Meera Devi", type: "victim", group: 1, firCount: 2, risk: "low" },
  { id: "V2", name: "Lakshmi Bai", type: "victim", group: 2, firCount: 1, risk: "low" },
  { id: "V3", name: "Fatima Begum", type: "victim", group: 3, firCount: 1, risk: "low" },
  { id: "L1", name: "Majestic Area", type: "location", group: 1, firCount: 12, risk: "high" },
  { id: "L2", name: "KR Puram", type: "location", group: 2, firCount: 8, risk: "medium" },
  { id: "L3", name: "Whitefield", type: "location", group: 3, firCount: 6, risk: "medium" },
  { id: "L4", name: "Jayanagar", type: "location", group: 4, firCount: 3, risk: "low" },
  { id: "B1", name: "HDFC-****4521", type: "account", group: 1, firCount: 3, risk: "high" },
  { id: "B2", name: "SBI-****8832", type: "account", group: 2, firCount: 2, risk: "medium" },
  { id: "B3", name: "ICICI-****1190", type: "account", group: 3, firCount: 4, risk: "high" },
];

export const networkEdges: NetworkEdge[] = [
  { source: "A1", target: "A2", type: "co-accused", weight: 5 },
  { source: "A1", target: "A3", type: "co-accused", weight: 3 },
  { source: "A2", target: "A3", type: "co-accused", weight: 2 },
  { source: "A1", target: "L1", type: "shared-location", weight: 7 },
  { source: "A2", target: "L1", type: "shared-location", weight: 4 },
  { source: "A3", target: "L1", type: "shared-location", weight: 2 },
  { source: "A1", target: "B1", type: "transaction", weight: 3 },
  { source: "A2", target: "B1", type: "transaction", weight: 2 },
  { source: "A1", target: "V1", type: "victim-link", weight: 2 },
  { source: "A4", target: "A5", type: "co-accused", weight: 4 },
  { source: "A4", target: "A6", type: "co-accused", weight: 2 },
  { source: "A5", target: "A6", type: "co-accused", weight: 1 },
  { source: "A4", target: "L2", type: "shared-location", weight: 5 },
  { source: "A5", target: "L2", type: "shared-location", weight: 3 },
  { source: "A4", target: "B2", type: "transaction", weight: 2 },
  { source: "A4", target: "V2", type: "victim-link", weight: 1 },
  { source: "A7", target: "A8", type: "co-accused", weight: 6 },
  { source: "A7", target: "L3", type: "shared-location", weight: 5 },
  { source: "A8", target: "L3", type: "shared-location", weight: 3 },
  { source: "A7", target: "B3", type: "transaction", weight: 4 },
  { source: "A8", target: "B3", type: "transaction", weight: 2 },
  { source: "A7", target: "V3", type: "victim-link", weight: 1 },
  { source: "A9", target: "A10", type: "co-accused", weight: 1 },
  { source: "A9", target: "L4", type: "shared-location", weight: 2 },
  { source: "A10", target: "L4", type: "shared-location", weight: 1 },
  // Cross-cluster links
  { source: "A3", target: "A6", type: "co-accused", weight: 1 },
  { source: "A7", target: "L1", type: "shared-location", weight: 1 },
];

// ─── Offender Profiling Data ─────────────────────────────────────────

export interface Offender {
  id: string;
  name: string;
  age: number;
  photo: string;
  alias: string[];
  gender: "male" | "female";
  height: string;
  weight: string;
  scars: string[];
  lastKnownAddress: string;
  district: string;
  associates: string[];
  paroleOfficer: string | null;
  convictions: number;
  acquittals: number;
  pendingCases: number;
  fingerprint: string;
  nationalId: string;
  totalFIRs: number;
  crimeTypes: string[];
  riskScore: number;
  isHabitual: boolean;
  modusOperandi: string[];
  lastOffense: string;
  status: "active" | "jailed" | "absconding" | "on-bail";
  timeline: { date: string; crime: string; location: string }[];
  // Phase 2 fields
  bloodGroup: string;
  languages: string[];
  occupation: string;
  education: string;
  fatherName: string;
  phoneNumber: string;
  aiBehavioralNote: string;
  personalityTraits: { trait: string; score: number }[];
  courtDates: { date: string; court: string; caseRef: string; outcome: "pending" | "convicted" | "acquitted" | "adjourned" }[];
  linkedFIRs: { firNumber: string; date: string; crime: string; section: string; status: string }[];
  victimCount: number;
  estimatedLoss: string;
  frequencyByYear: { year: string; count: number }[];
}

export const offenders: Offender[] = [
  {
    id: "OFF-001", name: "Rajesh Kumar", age: 34,
    photo: "/offenders/off-001.png",
    alias: ["Raju Bhai", "RK"],
    gender: "male", height: "5'10\"", weight: "78 kg",
    scars: ["Scar on left forearm", "Tattoo on right shoulder — snake"],
    lastKnownAddress: "42, 3rd Cross, Gandhinagar, Majestic, Bengaluru - 560009",
    district: "Bengaluru Central",
    associates: ["Suresh Patil", "Mohan Rao"],
    paroleOfficer: "SI Raghavendra K.",
    convictions: 3, acquittals: 1, pendingCases: 2,
    fingerprint: "Whorl — Right Thumb",
    nationalId: "XXXX-XXXX-4521",
    totalFIRs: 7, crimeTypes: ["Robbery", "Assault", "Extortion"],
    riskScore: 92, isHabitual: true, modusOperandi: ["Armed robbery", "Vehicle theft at night", "Extortion via threats"],
    lastOffense: "2025-03-15", status: "on-bail",
    timeline: [
      { date: "2019-06-12", crime: "Petty Theft", location: "Majestic" },
      { date: "2020-01-23", crime: "Robbery", location: "Majestic" },
      { date: "2020-11-08", crime: "Assault", location: "KR Puram" },
      { date: "2021-07-19", crime: "Armed Robbery", location: "Jayanagar" },
      { date: "2022-03-02", crime: "Extortion", location: "Whitefield" },
      { date: "2023-08-14", crime: "Armed Robbery", location: "Majestic" },
      { date: "2025-03-15", crime: "Extortion", location: "KR Puram" },
    ],
    bloodGroup: "B+", languages: ["Kannada", "Hindi", "Telugu"], occupation: "Auto Rickshaw Driver (Claimed)", education: "10th Pass",
    fatherName: "Ramesh Kumar", phoneNumber: "XXXXX-XX890",
    aiBehavioralNote: "Displays escalating pattern of violence with each offense. Subject transitions from petty theft to armed confrontations, suggesting growing confidence and desensitization. High recidivism risk — reoffends within 8–14 months of release. Territorial attachment to Majestic area indicates a comfort zone for operations.",
    personalityTraits: [
      { trait: "Aggression", score: 88 }, { trait: "Manipulation", score: 55 }, { trait: "Impulsivity", score: 78 },
      { trait: "Social Deviance", score: 82 }, { trait: "Criminal Sophistication", score: 65 },
    ],
    courtDates: [
      { date: "2020-04-15", court: "3rd ACMM, Bengaluru", caseRef: "CC-1204/2020", outcome: "convicted" },
      { date: "2021-11-20", court: "Sessions Court, Bengaluru", caseRef: "SC-892/2021", outcome: "convicted" },
      { date: "2023-02-10", court: "3rd ACMM, Bengaluru", caseRef: "CC-3341/2023", outcome: "acquitted" },
      { date: "2024-01-18", court: "Sessions Court, Bengaluru", caseRef: "SC-114/2024", outcome: "convicted" },
      { date: "2025-06-22", court: "Sessions Court, Bengaluru", caseRef: "SC-501/2025", outcome: "pending" },
      { date: "2025-09-10", court: "3rd ACMM, Bengaluru", caseRef: "CC-778/2025", outcome: "pending" },
    ],
    linkedFIRs: [
      { firNumber: "FIR-2019-BLR-0312", date: "2019-06-12", crime: "Petty Theft", section: "IPC 379", status: "convicted" },
      { firNumber: "FIR-2020-BLR-0145", date: "2020-01-23", crime: "Robbery", section: "IPC 392", status: "convicted" },
      { firNumber: "FIR-2020-BLR-0891", date: "2020-11-08", crime: "Assault", section: "IPC 323, 324", status: "convicted" },
      { firNumber: "FIR-2021-BLR-0673", date: "2021-07-19", crime: "Armed Robbery", section: "IPC 392, 397", status: "acquitted" },
      { firNumber: "FIR-2022-BLR-0234", date: "2022-03-02", crime: "Extortion", section: "IPC 384, 506", status: "charge-sheeted" },
      { firNumber: "FIR-2023-BLR-0412", date: "2023-08-14", crime: "Armed Robbery", section: "IPC 392, 397, 34", status: "convicted" },
      { firNumber: "FIR-2025-BLR-0847", date: "2025-03-15", crime: "Extortion", section: "IPC 384, 506", status: "under-investigation" },
    ],
    victimCount: 14, estimatedLoss: "₹18.2 Lakh",
    frequencyByYear: [
      { year: "2019", count: 1 }, { year: "2020", count: 2 }, { year: "2021", count: 1 },
      { year: "2022", count: 1 }, { year: "2023", count: 1 }, { year: "2024", count: 0 }, { year: "2025", count: 1 },
    ],
  },
  {
    id: "OFF-002", name: "Farhan Sheikh", age: 29,
    photo: "/offenders/off-002.png",
    alias: ["Phantom", "FS Cyber"],
    gender: "male", height: "5'7\"", weight: "65 kg",
    scars: ["No visible scars"],
    lastKnownAddress: "Flat 12B, Prestige Tower, Whitefield, Bengaluru - 560066",
    district: "Bengaluru East",
    associates: ["Kiran Das"],
    paroleOfficer: null,
    convictions: 2, acquittals: 2, pendingCases: 3,
    fingerprint: "Loop — Left Index",
    nationalId: "XXXX-XXXX-8817",
    totalFIRs: 8, crimeTypes: ["Cybercrime", "Fraud", "Identity Theft"],
    riskScore: 88, isHabitual: true, modusOperandi: ["Phishing attacks", "SIM swap fraud", "Fake KYC scams"],
    lastOffense: "2025-05-20", status: "absconding",
    timeline: [
      { date: "2020-02-11", crime: "Online Fraud", location: "Whitefield" },
      { date: "2020-09-17", crime: "Identity Theft", location: "Electronic City" },
      { date: "2021-03-05", crime: "Phishing", location: "Whitefield" },
      { date: "2021-11-22", crime: "SIM Swap Fraud", location: "Koramangala" },
      { date: "2022-06-08", crime: "Bank Fraud", location: "MG Road" },
      { date: "2023-01-14", crime: "Cybercrime", location: "Whitefield" },
      { date: "2024-04-30", crime: "KYC Scam", location: "HSR Layout" },
      { date: "2025-05-20", crime: "Wire Fraud", location: "Whitefield" },
    ],
    bloodGroup: "O+", languages: ["Hindi", "English", "Urdu"], occupation: "Self-Employed IT Consultant (Claimed)", education: "B.Tech (Dropout)",
    fatherName: "Mohammed Sheikh", phoneNumber: "XXXXX-XX234",
    aiBehavioralNote: "Highly sophisticated digital criminal with above-average intelligence. Displays classic traits of a social engineer — calm under pressure, articulate, and technically proficient. Avoids physical confrontation entirely. Flight risk is extremely high — has used multiple identities and may have international connections. Operates through proxy networks making digital forensics challenging.",
    personalityTraits: [
      { trait: "Aggression", score: 15 }, { trait: "Manipulation", score: 95 }, { trait: "Impulsivity", score: 30 },
      { trait: "Social Deviance", score: 70 }, { trait: "Criminal Sophistication", score: 92 },
    ],
    courtDates: [
      { date: "2021-06-15", court: "Cyber Crime Court, Bengaluru", caseRef: "CYB-201/2021", outcome: "convicted" },
      { date: "2022-02-20", court: "Cyber Crime Court, Bengaluru", caseRef: "CYB-445/2022", outcome: "acquitted" },
      { date: "2023-05-12", court: "Sessions Court, Bengaluru", caseRef: "SC-667/2023", outcome: "acquitted" },
      { date: "2024-08-30", court: "Cyber Crime Court, Bengaluru", caseRef: "CYB-112/2024", outcome: "convicted" },
      { date: "2025-07-15", court: "Sessions Court, Bengaluru", caseRef: "SC-330/2025", outcome: "pending" },
    ],
    linkedFIRs: [
      { firNumber: "FIR-2020-BLR-0221", date: "2020-02-11", crime: "Online Fraud", section: "IT Act 66C", status: "convicted" },
      { firNumber: "FIR-2020-BLR-0678", date: "2020-09-17", crime: "Identity Theft", section: "IT Act 66C, 66D", status: "convicted" },
      { firNumber: "FIR-2021-BLR-0189", date: "2021-03-05", crime: "Phishing", section: "IT Act 66D, IPC 420", status: "acquitted" },
      { firNumber: "FIR-2021-BLR-0901", date: "2021-11-22", crime: "SIM Swap Fraud", section: "IT Act 66C", status: "acquitted" },
      { firNumber: "FIR-2022-BLR-0445", date: "2022-06-08", crime: "Bank Fraud", section: "IPC 420, IT Act 66D", status: "charge-sheeted" },
      { firNumber: "FIR-2023-BLR-0112", date: "2023-01-14", crime: "Cybercrime", section: "IT Act 43, 66", status: "charge-sheeted" },
      { firNumber: "FIR-2024-BLR-0891", date: "2024-04-30", crime: "KYC Scam", section: "IPC 468, 471", status: "convicted" },
      { firNumber: "FIR-2025-BLR-1234", date: "2025-05-20", crime: "Wire Fraud", section: "IT Act 66C, 66D", status: "under-investigation" },
    ],
    victimCount: 47, estimatedLoss: "₹1.2 Crore",
    frequencyByYear: [
      { year: "2020", count: 2 }, { year: "2021", count: 2 }, { year: "2022", count: 1 },
      { year: "2023", count: 1 }, { year: "2024", count: 1 }, { year: "2025", count: 1 },
    ],
  },
  {
    id: "OFF-003", name: "Anil Gowda", age: 41,
    photo: "/offenders/off-003.png",
    alias: ["AG", "Gowda Boss"],
    gender: "male", height: "5'9\"", weight: "88 kg",
    scars: ["Burn mark on left hand", "Tattoo on chest — eagle"],
    lastKnownAddress: "23, 7th Main, KR Puram, Bengaluru - 560036",
    district: "Bengaluru East",
    associates: ["Prakash Shetty", "Naveen Reddy"],
    paroleOfficer: null,
    convictions: 4, acquittals: 0, pendingCases: 1,
    fingerprint: "Arch — Right Index",
    nationalId: "XXXX-XXXX-3309",
    totalFIRs: 6, crimeTypes: ["Narcotics", "Smuggling", "Assault"],
    riskScore: 85, isHabitual: true, modusOperandi: ["Drug distribution network", "Interstate smuggling", "Intimidation"],
    lastOffense: "2024-12-01", status: "jailed",
    timeline: [
      { date: "2018-04-20", crime: "Drug Possession", location: "KR Puram" },
      { date: "2019-10-15", crime: "Narcotics Distribution", location: "Majestic" },
      { date: "2020-08-03", crime: "Assault", location: "KR Puram" },
      { date: "2022-01-12", crime: "Smuggling", location: "Mangalore" },
      { date: "2023-06-28", crime: "Drug Trafficking", location: "KR Puram" },
      { date: "2024-12-01", crime: "Narcotics Possession", location: "Whitefield" },
    ],
    bloodGroup: "A+", languages: ["Kannada", "Hindi"], occupation: "Transport Business (Front)", education: "8th Pass",
    fatherName: "Basavanna Gowda", phoneNumber: "XXXXX-XX567",
    aiBehavioralNote: "Classic organized crime profile with hierarchical network control. Uses fear and loyalty to maintain subordinate compliance. Has a pattern of using legitimate businesses as fronts for narcotics distribution. Subject is methodical and patient — avoids impulsive actions. In custody, shows compliance but remains influential through outside associates.",
    personalityTraits: [
      { trait: "Aggression", score: 72 }, { trait: "Manipulation", score: 80 }, { trait: "Impulsivity", score: 35 },
      { trait: "Social Deviance", score: 88 }, { trait: "Criminal Sophistication", score: 78 },
    ],
    courtDates: [
      { date: "2019-01-10", court: "NDPS Court, Bengaluru", caseRef: "NDPS-78/2019", outcome: "convicted" },
      { date: "2020-05-22", court: "NDPS Court, Bengaluru", caseRef: "NDPS-201/2020", outcome: "convicted" },
      { date: "2021-03-14", court: "3rd ACMM, Bengaluru", caseRef: "CC-567/2021", outcome: "convicted" },
      { date: "2022-09-08", court: "Sessions Court, Mangalore", caseRef: "SC-340/2022", outcome: "convicted" },
      { date: "2025-03-20", court: "NDPS Court, Bengaluru", caseRef: "NDPS-45/2025", outcome: "pending" },
    ],
    linkedFIRs: [
      { firNumber: "FIR-2018-BLR-0456", date: "2018-04-20", crime: "Drug Possession", section: "NDPS 20", status: "convicted" },
      { firNumber: "FIR-2019-BLR-0789", date: "2019-10-15", crime: "Narcotics Distribution", section: "NDPS 21, 22", status: "convicted" },
      { firNumber: "FIR-2020-BLR-0612", date: "2020-08-03", crime: "Assault", section: "IPC 323, 506", status: "convicted" },
      { firNumber: "FIR-2022-MNG-0234", date: "2022-01-12", crime: "Smuggling", section: "NDPS 21, 29", status: "convicted" },
      { firNumber: "FIR-2023-BLR-0782", date: "2023-06-28", crime: "Drug Trafficking", section: "NDPS 21, 22, 29", status: "charge-sheeted" },
      { firNumber: "FIR-2024-BLR-0965", date: "2024-12-01", crime: "Narcotics Possession", section: "NDPS 21, 22", status: "under-investigation" },
    ],
    victimCount: 3, estimatedLoss: "₹85 Lakh (seized contraband)",
    frequencyByYear: [
      { year: "2018", count: 1 }, { year: "2019", count: 1 }, { year: "2020", count: 1 },
      { year: "2021", count: 0 }, { year: "2022", count: 1 }, { year: "2023", count: 1 }, { year: "2024", count: 1 },
    ],
  },
  {
    id: "OFF-004", name: "Suresh Patil", age: 37,
    photo: "/offenders/off-004.png",
    alias: ["Shadow", "SP"],
    gender: "male", height: "5'11\"", weight: "75 kg",
    scars: ["Knife scar on right cheek"],
    lastKnownAddress: "118, 2nd Stage, Jayanagar, Bengaluru - 560011",
    district: "Bengaluru South",
    associates: ["Rajesh Kumar"],
    paroleOfficer: null,
    convictions: 2, acquittals: 1, pendingCases: 2,
    fingerprint: "Whorl — Left Thumb",
    nationalId: "XXXX-XXXX-6644",
    totalFIRs: 5, crimeTypes: ["Burglary", "Theft", "Robbery"],
    riskScore: 74, isHabitual: true, modusOperandi: ["Night-time burglary", "Lock picking", "Residential targeting"],
    lastOffense: "2025-01-10", status: "active",
    timeline: [
      { date: "2020-03-15", crime: "Burglary", location: "Jayanagar" },
      { date: "2021-07-22", crime: "Theft", location: "Indiranagar" },
      { date: "2022-11-08", crime: "Burglary", location: "Koramangala" },
      { date: "2023-09-14", crime: "Robbery", location: "Majestic" },
      { date: "2025-01-10", crime: "Burglary", location: "HSR Layout" },
    ],
    bloodGroup: "AB-", languages: ["Kannada", "Marathi", "Hindi"], occupation: "Daily Wage Laborer (Claimed)", education: "7th Pass",
    fatherName: "Hanumant Patil", phoneNumber: "XXXXX-XX112",
    aiBehavioralNote: "Stealthy and methodical burglar who operates exclusively at night (11 PM–3 AM window). Shows strong pattern recognition — targets affluent residential areas during weekdays when occupancy is low. Avoids confrontation but carries weapons as deterrent. Operates solo or with one accomplice. Post-release surveillance recommended during festive seasons (historically peak activity).",
    personalityTraits: [
      { trait: "Aggression", score: 45 }, { trait: "Manipulation", score: 40 }, { trait: "Impulsivity", score: 50 },
      { trait: "Social Deviance", score: 68 }, { trait: "Criminal Sophistication", score: 60 },
    ],
    courtDates: [
      { date: "2020-10-20", court: "JMFC, Bengaluru", caseRef: "CC-2210/2020", outcome: "convicted" },
      { date: "2022-04-12", court: "JMFC, Bengaluru", caseRef: "CC-889/2022", outcome: "acquitted" },
      { date: "2023-07-05", court: "Sessions Court, Bengaluru", caseRef: "SC-445/2023", outcome: "convicted" },
      { date: "2025-04-18", court: "JMFC, Bengaluru", caseRef: "CC-301/2025", outcome: "pending" },
      { date: "2025-08-22", court: "Sessions Court, Bengaluru", caseRef: "SC-201/2025", outcome: "pending" },
    ],
    linkedFIRs: [
      { firNumber: "FIR-2020-BLR-0234", date: "2020-03-15", crime: "Burglary", section: "IPC 454, 380", status: "convicted" },
      { firNumber: "FIR-2021-BLR-0567", date: "2021-07-22", crime: "Theft", section: "IPC 379", status: "acquitted" },
      { firNumber: "FIR-2022-BLR-1105", date: "2022-11-08", crime: "Burglary", section: "IPC 454, 457", status: "convicted" },
      { firNumber: "FIR-2023-BLR-0890", date: "2023-09-14", crime: "Robbery", section: "IPC 392", status: "charge-sheeted" },
      { firNumber: "FIR-2025-BLR-0089", date: "2025-01-10", crime: "Burglary", section: "IPC 454, 380", status: "under-investigation" },
    ],
    victimCount: 9, estimatedLoss: "₹6.8 Lakh",
    frequencyByYear: [
      { year: "2020", count: 1 }, { year: "2021", count: 1 }, { year: "2022", count: 1 },
      { year: "2023", count: 1 }, { year: "2024", count: 0 }, { year: "2025", count: 1 },
    ],
  },
  {
    id: "OFF-005", name: "Prakash Shetty", age: 26,
    photo: "/offenders/off-005.png",
    alias: ["PK"],
    gender: "male", height: "5'8\"", weight: "70 kg",
    scars: ["Tattoo on left wrist — skull"],
    lastKnownAddress: "56, Old Airport Road, KR Puram, Bengaluru - 560036",
    district: "Bengaluru East",
    associates: ["Anil Gowda"],
    paroleOfficer: "ASI Manjunath B.",
    convictions: 1, acquittals: 1, pendingCases: 1,
    fingerprint: "Loop — Right Middle",
    nationalId: "XXXX-XXXX-2290",
    totalFIRs: 4, crimeTypes: ["Assault", "Vandalism"],
    riskScore: 58, isHabitual: false, modusOperandi: ["Street fights", "Property damage", "Road rage"],
    lastOffense: "2024-09-22", status: "on-bail",
    timeline: [
      { date: "2022-04-10", crime: "Assault", location: "KR Puram" },
      { date: "2023-01-18", crime: "Vandalism", location: "Majestic" },
      { date: "2023-08-05", crime: "Road Rage Assault", location: "Hebbal" },
      { date: "2024-09-22", crime: "Assault", location: "KR Puram" },
    ],
    bloodGroup: "O-", languages: ["Kannada", "Tulu"], occupation: "Unemployed", education: "PUC (Dropout)",
    fatherName: "Ganesh Shetty", phoneNumber: "XXXXX-XX445",
    aiBehavioralNote: "Reactive aggression profile — crimes are driven by situational triggers (alcohol, road rage, personal disputes) rather than premeditation. Low criminal sophistication but escalating frequency is concerning. Association with Anil Gowda's network may indicate recruitment into organized crime. Anger management intervention recommended as part of bail conditions.",
    personalityTraits: [
      { trait: "Aggression", score: 75 }, { trait: "Manipulation", score: 20 }, { trait: "Impulsivity", score: 85 },
      { trait: "Social Deviance", score: 52 }, { trait: "Criminal Sophistication", score: 22 },
    ],
    courtDates: [
      { date: "2022-11-14", court: "JMFC, Bengaluru", caseRef: "CC-1890/2022", outcome: "convicted" },
      { date: "2023-06-20", court: "JMFC, Bengaluru", caseRef: "CC-445/2023", outcome: "acquitted" },
      { date: "2025-01-28", court: "JMFC, Bengaluru", caseRef: "CC-112/2025", outcome: "pending" },
    ],
    linkedFIRs: [
      { firNumber: "FIR-2022-BLR-0334", date: "2022-04-10", crime: "Assault", section: "IPC 323, 324", status: "convicted" },
      { firNumber: "FIR-2023-BLR-0078", date: "2023-01-18", crime: "Vandalism", section: "IPC 427", status: "acquitted" },
      { firNumber: "FIR-2023-BLR-0601", date: "2023-08-05", crime: "Road Rage Assault", section: "IPC 323, 341", status: "charge-sheeted" },
      { firNumber: "FIR-2024-BLR-0812", date: "2024-09-22", crime: "Assault", section: "IPC 324, 506", status: "under-investigation" },
    ],
    victimCount: 5, estimatedLoss: "₹1.2 Lakh",
    frequencyByYear: [
      { year: "2022", count: 1 }, { year: "2023", count: 2 }, { year: "2024", count: 1 },
    ],
  },
  {
    id: "OFF-006", name: "Deepak Jain", age: 45,
    photo: "/offenders/off-006.png",
    alias: ["DJ"],
    gender: "male", height: "5'6\"", weight: "82 kg",
    scars: ["No visible scars"],
    lastKnownAddress: "203, Diamond District, Domlur, Bengaluru - 560071",
    district: "Bengaluru Central",
    associates: ["Vikram Singh"],
    paroleOfficer: "SI Priya Sharma",
    convictions: 0, acquittals: 1, pendingCases: 1,
    fingerprint: "Whorl — Right Ring",
    nationalId: "XXXX-XXXX-1178",
    totalFIRs: 2, crimeTypes: ["White Collar Crime", "Fraud"],
    riskScore: 42, isHabitual: false, modusOperandi: ["Document forgery", "Real estate fraud"],
    lastOffense: "2024-06-15", status: "on-bail",
    timeline: [
      { date: "2023-02-28", crime: "Document Forgery", location: "MG Road" },
      { date: "2024-06-15", crime: "Real Estate Fraud", location: "Whitefield" },
    ],
    bloodGroup: "A-", languages: ["Hindi", "English", "Gujarati"], occupation: "Real Estate Developer", education: "MBA (Finance)",
    fatherName: "Ramkishan Jain", phoneNumber: "XXXXX-XX778",
    aiBehavioralNote: "White-collar criminal with high social standing and connections. Uses legitimate business operations to mask fraudulent activities. Articulate and composed — unlikely to exhibit visible stress. Leverages legal expertise to exploit procedural delays. Financial trail analysis suggests significantly larger unreported fraud network. Low physical threat but high economic damage potential.",
    personalityTraits: [
      { trait: "Aggression", score: 10 }, { trait: "Manipulation", score: 82 }, { trait: "Impulsivity", score: 18 },
      { trait: "Social Deviance", score: 45 }, { trait: "Criminal Sophistication", score: 88 },
    ],
    courtDates: [
      { date: "2023-09-15", court: "Sessions Court, Bengaluru", caseRef: "SC-780/2023", outcome: "acquitted" },
      { date: "2025-02-10", court: "Sessions Court, Bengaluru", caseRef: "SC-89/2025", outcome: "pending" },
    ],
    linkedFIRs: [
      { firNumber: "FIR-2023-BLR-0201", date: "2023-02-28", crime: "Document Forgery", section: "IPC 467, 468, 471", status: "acquitted" },
      { firNumber: "FIR-2024-BLR-0512", date: "2024-06-15", crime: "Real Estate Fraud", section: "IPC 420, 467", status: "under-investigation" },
    ],
    victimCount: 3, estimatedLoss: "₹2.4 Crore",
    frequencyByYear: [
      { year: "2023", count: 1 }, { year: "2024", count: 1 },
    ],
  },
  {
    id: "OFF-007", name: "Imran Khan", age: 33,
    photo: "/offenders/off-001.png",
    alias: ["Shera", "IK Highway"],
    gender: "male", height: "5'11\"", weight: "82 kg",
    scars: ["Bullet graze scar on left thigh"],
    lastKnownAddress: "Ward 14, Old Hubli, Hubballi-Dharwad - 580024",
    district: "Hubballi-Dharwad",
    associates: ["Anil Gowda", "Shivaraj K."],
    paroleOfficer: null,
    convictions: 3, acquittals: 1, pendingCases: 2,
    fingerprint: "Whorl — Right Index",
    nationalId: "XXXX-XXXX-9912",
    totalFIRs: 6, crimeTypes: ["Highway Robbery", "Dacoity", "Assault"],
    riskScore: 89, isHabitual: true, modusOperandi: ["Night highway barricading", "Interstate cargo truck hijacking", "Armed intimidation"],
    lastOffense: "2025-02-18", status: "absconding",
    timeline: [
      { date: "2021-04-10", crime: "Highway Robbery", location: "NH-48 Hubballi" },
      { date: "2022-09-15", crime: "Dacoity", location: "Dharwad Bypass" },
      { date: "2023-11-20", crime: "Armed Robbery", location: "Belagavi Highway" },
      { date: "2025-02-18", crime: "Cargo Hijacking", location: "NH-48 Haveri" },
    ],
    bloodGroup: "O+", languages: ["Kannada", "Urdu", "Hindi"], occupation: "Transport Driver (Claimed)", education: "9th Pass",
    fatherName: "Zubair Khan", phoneNumber: "XXXXX-XX891",
    aiBehavioralNote: "High-velocity highway dacoity gang leader operating along the NH-48 Mumbai-Bengaluru corridor. Highly coordinated and mobile; executes robberies between 1:00 AM and 4:00 AM. High flight risk across state borders into Maharashtra.",
    personalityTraits: [
      { trait: "Aggression", score: 86 }, { trait: "Manipulation", score: 65 }, { trait: "Impulsivity", score: 70 },
      { trait: "Social Deviance", score: 88 }, { trait: "Criminal Sophistication", score: 75 },
    ],
    courtDates: [
      { date: "2022-05-14", court: "Sessions Court, Hubballi", caseRef: "SC-412/2022", outcome: "convicted" },
      { date: "2025-06-11", court: "Sessions Court, Dharwad", caseRef: "SC-109/2025", outcome: "pending" },
    ],
    linkedFIRs: [
      { firNumber: "FIR-2021-HBL-0112", date: "2021-04-10", crime: "Highway Robbery", section: "IPC 392, 397", status: "convicted" },
      { firNumber: "FIR-2025-HVR-0044", date: "2025-02-18", crime: "Cargo Hijacking", section: "IPC 395, 397", status: "under-investigation" },
    ],
    victimCount: 11, estimatedLoss: "₹45 Lakh",
    frequencyByYear: [
      { year: "2021", count: 1 }, { year: "2022", count: 2 }, { year: "2023", count: 2 }, { year: "2025", count: 1 },
    ],
  },
  {
    id: "OFF-008", name: "Manjunath K.", age: 48,
    photo: "/offenders/off-006.png",
    alias: ["Mani Chit", "MK"],
    gender: "male", height: "5'7\"", weight: "79 kg",
    scars: ["No visible scars"],
    lastKnownAddress: "12, Saraswathipuram, Mysuru City - 570009",
    district: "Mysuru City",
    associates: ["Deepak Jain"],
    paroleOfficer: "SI Anand Rao",
    convictions: 1, acquittals: 1, pendingCases: 2,
    fingerprint: "Loop — Right Thumb",
    nationalId: "XXXX-XXXX-4431",
    totalFIRs: 4, crimeTypes: ["White Collar Crime", "Fraud", "Chit Fund Scam"],
    riskScore: 64, isHabitual: true, modusOperandi: ["Unregistered chit fund scheme", "Promissory note forgery", "Elderly investor targeting"],
    lastOffense: "2024-11-05", status: "on-bail",
    timeline: [
      { date: "2022-03-12", crime: "Chit Fund Fraud", location: "Mysuru City" },
      { date: "2023-08-19", crime: "Promissory Forgery", location: "Mandya" },
      { date: "2024-11-05", crime: "Investment Fraud", location: "Mysuru City" },
    ],
    bloodGroup: "B+", languages: ["Kannada", "English"], occupation: "Financial Intermediary", education: "B.Com",
    fatherName: "Kempanna K.", phoneNumber: "XXXXX-XX332",
    aiBehavioralNote: "Systematic financial fraudster targeting retired government pensioners in Mysuru. Uses trust networks and community clubs to solicit deposits before defaulting.",
    personalityTraits: [
      { trait: "Aggression", score: 12 }, { trait: "Manipulation", score: 89 }, { trait: "Impulsivity", score: 20 },
      { trait: "Social Deviance", score: 55 }, { trait: "Criminal Sophistication", score: 84 },
    ],
    courtDates: [
      { date: "2023-10-18", court: "District Court, Mysuru", caseRef: "CC-912/2023", outcome: "convicted" },
      { date: "2025-04-20", court: "District Court, Mysuru", caseRef: "CC-114/2025", outcome: "pending" },
    ],
    linkedFIRs: [
      { firNumber: "FIR-2022-MYS-0341", date: "2022-03-12", crime: "Chit Fund Fraud", section: "IPC 420, KPID Act", status: "convicted" },
      { firNumber: "FIR-2024-MYS-0882", date: "2024-11-05", crime: "Investment Fraud", section: "IPC 406, 420", status: "under-investigation" },
    ],
    victimCount: 68, estimatedLoss: "₹3.8 Crore",
    frequencyByYear: [
      { year: "2022", count: 1 }, { year: "2023", count: 2 }, { year: "2024", count: 1 },
    ],
  },
  {
    id: "OFF-009", name: "Sayyed Pasha", age: 39,
    photo: "/offenders/off-004.png",
    alias: ["Pasha Bhai", "SP Coastal"],
    gender: "male", height: "5'9\"", weight: "76 kg",
    scars: ["Surgical scar on right collarbone"],
    lastKnownAddress: "Bunder Port Road, Mangaluru City - 575001",
    district: "Mangaluru City",
    associates: ["Anil Gowda", "Sultan Mir"],
    paroleOfficer: null,
    convictions: 2, acquittals: 2, pendingCases: 3,
    fingerprint: "Whorl — Left Index",
    nationalId: "XXXX-XXXX-7721",
    totalFIRs: 7, crimeTypes: ["Smuggling", "Hawala", "Extortion"],
    riskScore: 86, isHabitual: true, modusOperandi: ["Coastal contraband smuggling", "Hawala money laundering", "Port customs evasion"],
    lastOffense: "2025-01-28", status: "active",
    timeline: [
      { date: "2021-02-14", crime: "Gold Smuggling", location: "Mangaluru Airport" },
      { date: "2022-10-11", crime: "Hawala Operation", location: "Bunder Port" },
      { date: "2024-05-19", crime: "Contraband Smuggling", location: "Udupi Coast" },
      { date: "2025-01-28", crime: "Hawala Transaction", location: "Mangaluru City" },
    ],
    bloodGroup: "A+", languages: ["Byari", "Kannada", "Urdu", "Malayalam"], occupation: "Import-Export Merchant", education: "PUC",
    fatherName: "Ibrahim Pasha", phoneNumber: "XXXXX-XX904",
    aiBehavioralNote: "Key maritime smuggling operative with established routes across coastal Karnataka and Kerala. High financial sophistication with international remittance channels.",
    personalityTraits: [
      { trait: "Aggression", score: 45 }, { trait: "Manipulation", score: 85 }, { trait: "Impulsivity", score: 30 },
      { trait: "Social Deviance", score: 80 }, { trait: "Criminal Sophistication", score: 90 },
    ],
    courtDates: [
      { date: "2023-01-12", court: "Customs Court, Mangaluru", caseRef: "CUS-55/2023", outcome: "convicted" },
      { date: "2025-08-14", court: "Sessions Court, Mangaluru", caseRef: "SC-204/2025", outcome: "pending" },
    ],
    linkedFIRs: [
      { firNumber: "FIR-2022-MNG-0441", date: "2022-10-11", crime: "Hawala Operation", section: "FEMA / IPC 120B", status: "convicted" },
      { firNumber: "FIR-2025-MNG-0091", date: "2025-01-28", crime: "Hawala Transaction", section: "PMLA / IPC 420", status: "under-investigation" },
    ],
    victimCount: 0, estimatedLoss: "₹5.4 Crore (Seized Assets)",
    frequencyByYear: [
      { year: "2021", count: 2 }, { year: "2022", count: 2 }, { year: "2024", count: 2 }, { year: "2025", count: 1 },
    ],
  },
  {
    id: "OFF-010", name: "Venkatesh Naik", age: 44,
    photo: "/offenders/off-003.png",
    alias: ["Naik Don", "VN"],
    gender: "male", height: "5'10\"", weight: "85 kg",
    scars: ["Deep scar across left palm"],
    lastKnownAddress: "Cowl Bazar, Ballari - 583101",
    district: "Ballari",
    associates: ["Anil Gowda", "Yellappa N."],
    paroleOfficer: null,
    convictions: 3, acquittals: 0, pendingCases: 2,
    fingerprint: "Arch — Left Thumb",
    nationalId: "XXXX-XXXX-6119",
    totalFIRs: 6, crimeTypes: ["Extortion", "Illegal Mining", "Armed Assault"],
    riskScore: 83, isHabitual: true, modusOperandi: ["Mining transport toll extortion", "Labor camp intimidation", "Armed gang protection"],
    lastOffense: "2024-10-12", status: "jailed",
    timeline: [
      { date: "2020-07-22", crime: "Extortion", location: "Sandur Mining Belt" },
      { date: "2022-04-18", crime: "Armed Assault", location: "Ballari City" },
      { date: "2023-09-09", crime: "Illegal Mining", location: "Hosapete" },
      { date: "2024-10-12", crime: "Extortion", location: "Ballari Industrial Zone" },
    ],
    bloodGroup: "B-", languages: ["Kannada", "Telugu"], occupation: "Earthmover Contractor", education: "10th Pass",
    fatherName: "Subba Naik", phoneNumber: "XXXXX-XX671",
    aiBehavioralNote: "Industrial extortion specialist controlling labor and transport routes around iron ore processing units in Ballari and Hosapete.",
    personalityTraits: [
      { trait: "Aggression", score: 84 }, { trait: "Manipulation", score: 70 }, { trait: "Impulsivity", score: 55 },
      { trait: "Social Deviance", score: 82 }, { trait: "Criminal Sophistication", score: 68 },
    ],
    courtDates: [
      { date: "2023-02-14", court: "District Court, Ballari", caseRef: "SC-301/2023", outcome: "convicted" },
    ],
    linkedFIRs: [
      { firNumber: "FIR-2024-BLR-0419", date: "2024-10-12", crime: "Extortion", section: "IPC 384, 506", status: "under-investigation" },
    ],
    victimCount: 18, estimatedLoss: "₹92 Lakh",
    frequencyByYear: [
      { year: "2020", count: 1 }, { year: "2022", count: 2 }, { year: "2023", count: 2 }, { year: "2024", count: 1 },
    ],
  },
  {
    id: "OFF-011", name: "Siddaraju M.", age: 36,
    photo: "/offenders/off-005.png",
    alias: ["Siddu"],
    gender: "male", height: "5'8\"", weight: "71 kg",
    scars: ["Forehead stitch scar"],
    lastKnownAddress: "Maddur Town, Mandya District - 571428",
    district: "Mandya",
    associates: ["Prakash Shetty"],
    paroleOfficer: "SI Shivanna",
    convictions: 1, acquittals: 1, pendingCases: 1,
    fingerprint: "Loop — Left Middle",
    nationalId: "XXXX-XXXX-8823",
    totalFIRs: 3, crimeTypes: ["Assault", "Rioting"],
    riskScore: 71, isHabitual: false, modusOperandi: ["Irrigation channel disputes", "Agrarian political rioting", "Group clash leadership"],
    lastOffense: "2024-08-30", status: "on-bail",
    timeline: [
      { date: "2022-06-11", crime: "Rioting", location: "Maddur" },
      { date: "2024-08-30", crime: "Armed Clash", location: "Mandya Rural" },
    ],
    bloodGroup: "O+", languages: ["Kannada"], occupation: "Farmer / Local Politico", education: "PUC",
    fatherName: "Madaiah M.", phoneNumber: "XXXXX-XX512",
    aiBehavioralNote: "Agrarian dispute agitator with strong local mobilization capacity. Crimes trigger primarily during harvest and irrigation water allocation seasons.",
    personalityTraits: [
      { trait: "Aggression", score: 79 }, { trait: "Manipulation", score: 45 }, { trait: "Impulsivity", score: 80 },
      { trait: "Social Deviance", score: 60 }, { trait: "Criminal Sophistication", score: 35 },
    ],
    courtDates: [
      { date: "2025-05-18", court: "JMFC, Mandya", caseRef: "CC-441/2025", outcome: "pending" },
    ],
    linkedFIRs: [
      { firNumber: "FIR-2024-MND-0199", date: "2024-08-30", crime: "Armed Clash", section: "IPC 147, 148, 324", status: "under-investigation" },
    ],
    victimCount: 7, estimatedLoss: "₹2.1 Lakh",
    frequencyByYear: [
      { year: "2022", count: 1 }, { year: "2023", count: 1 }, { year: "2024", count: 1 },
    ],
  },
  {
    id: "OFF-012", name: "Chandan Shetty", age: 28,
    photo: "/offenders/off-002.png",
    alias: ["Acid Chandu", "CS Darknet"],
    gender: "male", height: "5'10\"", weight: "68 kg",
    scars: ["No visible scars"],
    lastKnownAddress: "4th Block, Koramangala, Bengaluru South - 560034",
    district: "Bengaluru South",
    associates: ["Anil Gowda", "Farhan Sheikh"],
    paroleOfficer: null,
    convictions: 2, acquittals: 0, pendingCases: 3,
    fingerprint: "Loop — Right Ring",
    nationalId: "XXXX-XXXX-1904",
    totalFIRs: 7, crimeTypes: ["Narcotics", "Cybercrime"],
    riskScore: 91, isHabitual: true, modusOperandi: ["Darknet cryptocurrency drug orders", "College campus party supply", "Courier drop-box logistics"],
    lastOffense: "2025-03-02", status: "active",
    timeline: [
      { date: "2022-11-14", crime: "Synthetic Narcotics", location: "Indiranagar" },
      { date: "2023-09-21", crime: "MDMA Supply", location: "Koramangala" },
      { date: "2024-07-18", crime: "Darknet Drug Trade", location: "HSR Layout" },
      { date: "2025-03-02", crime: "Synthetic Drug Distribution", location: "Bengaluru South" },
    ],
    bloodGroup: "AB+", languages: ["Kannada", "English", "Hindi"], occupation: "Event DJ / Producer", education: "BCA",
    fatherName: "Sridhar Shetty", phoneNumber: "XXXXX-XX998",
    aiBehavioralNote: "High-level synthetic narcotics broker bridging darknet crypto import channels with urban Bengaluru nightlife and student hubs.",
    personalityTraits: [
      { trait: "Aggression", score: 35 }, { trait: "Manipulation", score: 88 }, { trait: "Impulsivity", score: 40 },
      { trait: "Social Deviance", score: 85 }, { trait: "Criminal Sophistication", score: 94 },
    ],
    courtDates: [
      { date: "2025-07-22", court: "NDPS Court, Bengaluru", caseRef: "NDPS-112/2025", outcome: "pending" },
    ],
    linkedFIRs: [
      { firNumber: "FIR-2025-BLR-0311", date: "2025-03-02", crime: "Synthetic Drug Distribution", section: "NDPS 22(c), 27A", status: "under-investigation" },
    ],
    victimCount: 0, estimatedLoss: "₹1.4 Crore (Street Value Contraband)",
    frequencyByYear: [
      { year: "2022", count: 1 }, { year: "2023", count: 2 }, { year: "2024", count: 2 }, { year: "2025", count: 2 },
    ],
  },
  {
    id: "OFF-013", name: "Abdul Rehman", age: 46,
    photo: "/offenders/off-001.png",
    alias: ["Rehman Currency"],
    gender: "male", height: "5'7\"", weight: "74 kg",
    scars: ["Scar on right neck"],
    lastKnownAddress: "Mominpura, Kalaburagi - 585104",
    district: "Kalaburagi",
    associates: ["Sayyed Pasha"],
    paroleOfficer: null,
    convictions: 3, acquittals: 1, pendingCases: 2,
    fingerprint: "Whorl — Left Ring",
    nationalId: "XXXX-XXXX-5541",
    totalFIRs: 6, crimeTypes: ["Counterfeit Currency", "Smuggling"],
    riskScore: 88, isHabitual: true, modusOperandi: ["FICN border infiltration", "Rural market circulation", "Wholesale counterfeit transport"],
    lastOffense: "2024-12-19", status: "jailed",
    timeline: [
      { date: "2021-08-11", crime: "FICN Circulation", location: "Kalaburagi Market" },
      { date: "2023-04-25", crime: "Counterfeit Notes", location: "Bidar" },
      { date: "2024-12-19", crime: "FICN Transport", location: "Kalaburagi Station" },
    ],
    bloodGroup: "B+", languages: ["Urdu", "Kannada", "Marathi"], occupation: "Wholesale Textile Trader", education: "10th Pass",
    fatherName: "Habib Rehman", phoneNumber: "XXXXX-XX210",
    aiBehavioralNote: "Key operative in counterfeit Indian currency circulation along northern Karnataka border districts.",
    personalityTraits: [
      { trait: "Aggression", score: 25 }, { trait: "Manipulation", score: 86 }, { trait: "Impulsivity", score: 25 },
      { trait: "Social Deviance", score: 84 }, { trait: "Criminal Sophistication", score: 88 },
    ],
    courtDates: [
      { date: "2025-04-10", court: "Sessions Court, Kalaburagi", caseRef: "SC-90/2025", outcome: "pending" },
    ],
    linkedFIRs: [
      { firNumber: "FIR-2024-KLB-0512", date: "2024-12-19", crime: "FICN Transport", section: "IPC 489B, 489C", status: "under-investigation" },
    ],
    victimCount: 24, estimatedLoss: "₹65 Lakh (Fake Notes Circulated)",
    frequencyByYear: [
      { year: "2021", count: 2 }, { year: "2023", count: 2 }, { year: "2024", count: 2 },
    ],
  },
  {
    id: "OFF-014", name: "Kishore Kumar", age: 31,
    photo: "/offenders/off-004.png",
    alias: ["Kishore Auto"],
    gender: "male", height: "5'9\"", weight: "72 kg",
    scars: ["Tattoo on right forearm — wrench"],
    lastKnownAddress: "Shahapur, Belagavi City - 590003",
    district: "Belagavi City",
    associates: ["Suresh Patil"],
    paroleOfficer: null,
    convictions: 2, acquittals: 1, pendingCases: 2,
    fingerprint: "Loop — Right Thumb",
    nationalId: "XXXX-XXXX-3382",
    totalFIRs: 5, crimeTypes: ["Vehicle Theft", "Chop-Shop Operation"],
    riskScore: 76, isHabitual: true, modusOperandi: ["SUV keyless cloning", "Interstate chop-shop stripping", "Forged registration plates"],
    lastOffense: "2025-01-14", status: "active",
    timeline: [
      { date: "2022-05-09", crime: "SUV Theft", location: "Belagavi City" },
      { date: "2023-10-18", crime: "Chop-Shop Ring", location: "Dharwad" },
      { date: "2025-01-14", crime: "Vehicle Theft", location: "Hubballi" },
    ],
    bloodGroup: "A+", languages: ["Kannada", "Marathi"], occupation: "Auto Mechanic", education: "ITI Diploma",
    fatherName: "Vasanth Kumar", phoneNumber: "XXXXX-XX801",
    aiBehavioralNote: "Technical vehicle theft specialist cloning modern electronic key fobs and transporting stolen vehicles across Goa-Maharashtra borders.",
    personalityTraits: [
      { trait: "Aggression", score: 30 }, { trait: "Manipulation", score: 72 }, { trait: "Impulsivity", score: 45 },
      { trait: "Social Deviance", score: 76 }, { trait: "Criminal Sophistication", score: 82 },
    ],
    courtDates: [
      { date: "2025-06-05", court: "JMFC, Belagavi", caseRef: "CC-332/2025", outcome: "pending" },
    ],
    linkedFIRs: [
      { firNumber: "FIR-2025-BGM-0081", date: "2025-01-14", crime: "Vehicle Theft", section: "IPC 379, 413", status: "under-investigation" },
    ],
    victimCount: 19, estimatedLoss: "₹1.8 Crore (Stolen Vehicles)",
    frequencyByYear: [
      { year: "2022", count: 2 }, { year: "2023", count: 2 }, { year: "2025", count: 1 },
    ],
  },
  {
    id: "OFF-015", name: "Ravi Shankar", age: 30,
    photo: "/offenders/off-002.png",
    alias: ["Ravi Loan"],
    gender: "male", height: "5'8\"", weight: "67 kg",
    scars: ["No visible scars"],
    lastKnownAddress: "Sahakar Nagar, Bengaluru North - 560092",
    district: "Bengaluru North",
    associates: ["Farhan Sheikh"],
    paroleOfficer: null,
    convictions: 1, acquittals: 0, pendingCases: 3,
    fingerprint: "Loop — Left Ring",
    nationalId: "XXXX-XXXX-6710",
    totalFIRs: 6, crimeTypes: ["Cybercrime", "Sextortion", "Predatory Loan App"],
    riskScore: 87, isHabitual: true, modusOperandi: ["Instant loan app data harvesting", "Morphing contact images", "High-pressure extortion calls"],
    lastOffense: "2025-02-24", status: "active",
    timeline: [
      { date: "2023-06-14", crime: "Loan App Extortion", location: "Bengaluru North" },
      { date: "2024-04-11", crime: "Cyber Sextortion", location: "Hebbal" },
      { date: "2025-02-24", crime: "Predatory Extortion Ring", location: "Yelahanka" },
    ],
    bloodGroup: "O+", languages: ["Kannada", "English", "Hindi", "Telugu"], occupation: "Call Center Manager", education: "BCA",
    fatherName: "Shankar Narayana", phoneNumber: "XXXXX-XX119",
    aiBehavioralNote: "Mastermind behind predatory instant loan applications operating out of Bengaluru North call centers.",
    personalityTraits: [
      { trait: "Aggression", score: 65 }, { trait: "Manipulation", score: 92 }, { trait: "Impulsivity", score: 35 },
      { trait: "Social Deviance", score: 86 }, { trait: "Criminal Sophistication", score: 89 },
    ],
    courtDates: [
      { date: "2025-08-11", court: "Cyber Crime Court, Bengaluru", caseRef: "CYB-99/2025", outcome: "pending" },
    ],
    linkedFIRs: [
      { firNumber: "FIR-2025-BLR-0241", date: "2025-02-24", crime: "Predatory Extortion Ring", section: "IT Act 67, IPC 384", status: "under-investigation" },
    ],
    victimCount: 140, estimatedLoss: "₹3.1 Crore",
    frequencyByYear: [
      { year: "2023", count: 2 }, { year: "2024", count: 2 }, { year: "2025", count: 2 },
    ],
  },
  {
    id: "OFF-016", name: "Prashant Gowda", age: 38,
    photo: "/offenders/off-004.png",
    alias: ["Prashant Idol"],
    gender: "male", height: "5'10\"", weight: "77 kg",
    scars: ["Scar across chin"],
    lastKnownAddress: "Holenarasipur Road, Hassan - 573201",
    district: "Hassan",
    associates: ["Suresh Patil"],
    paroleOfficer: null,
    convictions: 2, acquittals: 1, pendingCases: 1,
    fingerprint: "Whorl — Right Middle",
    nationalId: "XXXX-XXXX-4019",
    totalFIRs: 4, crimeTypes: ["Heritage Burglary", "Antique Smuggling"],
    riskScore: 79, isHabitual: true, modusOperandi: ["Ancient temple bronze idol theft", "Night lock drilling", "Interstate antiquities fence"],
    lastOffense: "2024-11-20", status: "on-bail",
    timeline: [
      { date: "2021-12-04", crime: "Temple Theft", location: "Belur Rural" },
      { date: "2023-07-15", crime: "Antique Idol Theft", location: "Halebeedu" },
      { date: "2024-11-20", crime: "Heritage Burglary", location: "Hassan" },
    ],
    bloodGroup: "B+", languages: ["Kannada"], occupation: "Antique Dealer", education: "BA (History dropout)",
    fatherName: "Chiranjeevi Gowda", phoneNumber: "XXXXX-XX650",
    aiBehavioralNote: "Specializes in high-value historical idol and sculpture burglaries from rural temples across Hassan and Mysuru belts.",
    personalityTraits: [
      { trait: "Aggression", score: 20 }, { trait: "Manipulation", score: 75 }, { trait: "Impulsivity", score: 30 },
      { trait: "Social Deviance", score: 74 }, { trait: "Criminal Sophistication", score: 85 },
    ],
    courtDates: [
      { date: "2025-05-12", court: "District Court, Hassan", caseRef: "SC-118/2025", outcome: "pending" },
    ],
    linkedFIRs: [
      { firNumber: "FIR-2024-HSN-0331", date: "2024-11-20", crime: "Heritage Burglary", section: "IPC 457, 380, Antiquities Act", status: "under-investigation" },
    ],
    victimCount: 4, estimatedLoss: "₹1.9 Crore (Heritage Valuation)",
    frequencyByYear: [
      { year: "2021", count: 1 }, { year: "2023", count: 2 }, { year: "2024", count: 1 },
    ],
  },
  {
    id: "OFF-017", name: "Basavaraj P.", age: 40,
    photo: "/offenders/off-003.png",
    alias: ["Basu Pistol"],
    gender: "male", height: "6'0\"", weight: "89 kg",
    scars: ["Knife wound scar on chest"],
    lastKnownAddress: "Sindgi Town, Vijayapura - 586128",
    district: "Vijayapura",
    associates: ["Rajesh Kumar", "Imran Khan"],
    paroleOfficer: null,
    convictions: 4, acquittals: 1, pendingCases: 2,
    fingerprint: "Whorl — Left Thumb",
    nationalId: "XXXX-XXXX-9001",
    totalFIRs: 8, crimeTypes: ["Firearms Trafficking", "Contract Assault", "Murder"],
    riskScore: 94, isHabitual: true, modusOperandi: ["Country-made firearm supply", "Contract intimidation", "High-velocity syndicate enforcement"],
    lastOffense: "2025-01-05", status: "jailed",
    timeline: [
      { date: "2020-03-18", crime: "Arms Supply", location: "Vijayapura" },
      { date: "2022-08-11", crime: "Attempted Murder", location: "Kalaburagi" },
      { date: "2023-10-29", crime: "Firearms Trafficking", location: "Hubballi" },
      { date: "2025-01-05", crime: "Arms Supply & Assault", location: "Vijayapura" },
    ],
    bloodGroup: "O+", languages: ["Kannada", "Hindi", "Marathi"], occupation: "Machinery Workshop Owner", education: "10th Pass",
    fatherName: "Pundalik P.", phoneNumber: "XXXXX-XX911",
    aiBehavioralNote: "Primary supplier of country-made firearms (kattas) and ammunition to extortion gangs in Northern Karnataka.",
    personalityTraits: [
      { trait: "Aggression", score: 92 }, { trait: "Manipulation", score: 68 }, { trait: "Impulsivity", score: 60 },
      { trait: "Social Deviance", score: 94 }, { trait: "Criminal Sophistication", score: 80 },
    ],
    courtDates: [
      { date: "2025-04-30", court: "Sessions Court, Vijayapura", caseRef: "SC-88/2025", outcome: "pending" },
    ],
    linkedFIRs: [
      { firNumber: "FIR-2025-VJP-0012", date: "2025-01-05", crime: "Arms Supply & Assault", section: "Arms Act 25 / IPC 307", status: "under-investigation" },
    ],
    victimCount: 12, estimatedLoss: "₹42 Lakh",
    frequencyByYear: [
      { year: "2020", count: 2 }, { year: "2022", count: 2 }, { year: "2023", count: 2 }, { year: "2025", count: 2 },
    ],
  },
  {
    id: "OFF-018", name: "Nitin Rao", age: 35,
    photo: "/offenders/off-006.png",
    alias: ["Crypto Nitin"],
    gender: "male", height: "5'9\"", weight: "74 kg",
    scars: ["No visible scars"],
    lastKnownAddress: "Manipal University Road, Udupi - 576104",
    district: "Udupi",
    associates: ["Farhan Sheikh"],
    paroleOfficer: null,
    convictions: 1, acquittals: 0, pendingCases: 2,
    fingerprint: "Arch — Left Index",
    nationalId: "XXXX-XXXX-3318",
    totalFIRs: 3, crimeTypes: ["Cryptocurrency Fraud", "Ponzi Investment Scam"],
    riskScore: 68, isHabitual: false, modusOperandi: ["Fake crypto staking returns", "Student & NRI investor targeting", "Offshore exchange laundering"],
    lastOffense: "2024-10-28", status: "on-bail",
    timeline: [
      { date: "2023-04-14", crime: "Crypto Scam", location: "Manipal" },
      { date: "2024-10-28", crime: "Ponzi Investment Fraud", location: "Udupi" },
    ],
    bloodGroup: "B+", languages: ["Konkani", "Kannada", "English"], occupation: "Software Engineer", education: "BE (Computer Science)",
    fatherName: "Sadananda Rao", phoneNumber: "XXXXX-XX612",
    aiBehavioralNote: "High-tech investment scam operator leveraging NRI wealth corridors around Udupi and Manipal.",
    personalityTraits: [
      { trait: "Aggression", score: 10 }, { trait: "Manipulation", score: 91 }, { trait: "Impulsivity", score: 25 },
      { trait: "Social Deviance", score: 62 }, { trait: "Criminal Sophistication", score: 90 },
    ],
    courtDates: [
      { date: "2025-06-18", court: "District Court, Udupi", caseRef: "CC-512/2025", outcome: "pending" },
    ],
    linkedFIRs: [
      { firNumber: "FIR-2024-UDP-0442", date: "2024-10-28", crime: "Ponzi Investment Fraud", section: "IPC 420, IT Act 66D", status: "under-investigation" },
    ],
    victimCount: 85, estimatedLoss: "₹4.6 Crore",
    frequencyByYear: [
      { year: "2023", count: 1 }, { year: "2024", count: 2 },
    ],
  },
  {
    id: "OFF-019", name: "Shivaraj K.", age: 42,
    photo: "/offenders/off-003.png",
    alias: ["Shivu Tumkur"],
    gender: "male", height: "5'10\"", weight: "83 kg",
    scars: ["Left ear scar"],
    lastKnownAddress: "Sira Road, Tumakuru - 572106",
    district: "Tumakuru",
    associates: ["Imran Khan"],
    paroleOfficer: null,
    convictions: 2, acquittals: 1, pendingCases: 2,
    fingerprint: "Whorl — Right Thumb",
    nationalId: "XXXX-XXXX-8012",
    totalFIRs: 5, crimeTypes: ["Highway Hijacking", "Cargo Theft"],
    riskScore: 84, isHabitual: true, modusOperandi: ["NH-48 container truck hijacking", "Warehouse cargo fencing", "Driver intimidation"],
    lastOffense: "2025-01-19", status: "active",
    timeline: [
      { date: "2022-07-18", crime: "Cargo Theft", location: "Tumakuru Bypass" },
      { date: "2023-11-09", crime: "Truck Hijacking", location: "Sira Highway" },
      { date: "2025-01-19", crime: "Highway Container Hijack", location: "NH-48 Tumakuru" },
    ],
    bloodGroup: "O+", languages: ["Kannada", "Telugu"], occupation: "Lorry Owner", education: "8th Pass",
    fatherName: "Kariappa K.", phoneNumber: "XXXXX-XX884",
    aiBehavioralNote: "Interstate truck hijacking gang chief operating along the Tumakuru-Chitradurga transport expressway.",
    personalityTraits: [
      { trait: "Aggression", score: 81 }, { trait: "Manipulation", score: 62 }, { trait: "Impulsivity", score: 60 },
      { trait: "Social Deviance", score: 84 }, { trait: "Criminal Sophistication", score: 76 },
    ],
    courtDates: [
      { date: "2025-07-10", court: "Sessions Court, Tumakuru", caseRef: "SC-140/2025", outcome: "pending" },
    ],
    linkedFIRs: [
      { firNumber: "FIR-2025-TMK-0041", date: "2025-01-19", crime: "Highway Container Hijack", section: "IPC 395, 397", status: "under-investigation" },
    ],
    victimCount: 8, estimatedLoss: "₹1.1 Crore",
    frequencyByYear: [
      { year: "2022", count: 2 }, { year: "2023", count: 2 }, { year: "2025", count: 1 },
    ],
  },
  {
    id: "OFF-020", name: "Tarun Verma", age: 32,
    photo: "/offenders/off-002.png",
    alias: ["TV Tech"],
    gender: "male", height: "5'8\"", weight: "69 kg",
    scars: ["No visible scars"],
    lastKnownAddress: "ITPL Road, Whitefield, Bengaluru - 560066",
    district: "Bengaluru East",
    associates: ["Farhan Sheikh"],
    paroleOfficer: null,
    convictions: 1, acquittals: 0, pendingCases: 2,
    fingerprint: "Loop — Right Index",
    nationalId: "XXXX-XXXX-4412",
    totalFIRs: 3, crimeTypes: ["Corporate Data Theft", "Ransomware Extortion"],
    riskScore: 82, isHabitual: false, modusOperandi: ["Insider credential exfiltration", "Ransomware payload injection", "Corporate IP leak extortion"],
    lastOffense: "2024-11-14", status: "on-bail",
    timeline: [
      { date: "2023-09-11", crime: "Data Theft", location: "Whitefield Tech Park" },
      { date: "2024-11-14", crime: "Corporate Ransomware Extortion", location: "Bengaluru East" },
    ],
    bloodGroup: "A+", languages: ["English", "Hindi"], occupation: "Systems Administrator", education: "B.Tech (IT)",
    fatherName: "Ashok Verma", phoneNumber: "XXXXX-XX319",
    aiBehavioralNote: "Corporate cyber operative exfiltrating proprietary database backups from tech firms in Whitefield for ransom.",
    personalityTraits: [
      { trait: "Aggression", score: 18 }, { trait: "Manipulation", score: 88 }, { trait: "Impulsivity", score: 25 },
      { trait: "Social Deviance", score: 72 }, { trait: "Criminal Sophistication", score: 95 },
    ],
    courtDates: [
      { date: "2025-05-24", court: "Cyber Crime Court, Bengaluru", caseRef: "CYB-310/2025", outcome: "pending" },
    ],
    linkedFIRs: [
      { firNumber: "FIR-2024-BLR-0771", date: "2024-11-14", crime: "Corporate Ransomware Extortion", section: "IT Act 43, 66F", status: "under-investigation" },
    ],
    victimCount: 3, estimatedLoss: "₹3.5 Crore (Corporate Damage)",
    frequencyByYear: [
      { year: "2023", count: 1 }, { year: "2024", count: 2 },
    ],
  },
  {
    id: "OFF-021", name: "Dyamappa B.", age: 49,
    photo: "/offenders/off-005.png",
    alias: ["Dyama Excise"],
    gender: "male", height: "5'6\"", weight: "78 kg",
    scars: ["Right cheek scar"],
    lastKnownAddress: "Ilkal Town, Bagalkote - 587125",
    district: "Bagalkote",
    associates: ["Venkatesh Naik"],
    paroleOfficer: null,
    convictions: 3, acquittals: 1, pendingCases: 1,
    fingerprint: "Arch — Right Thumb",
    nationalId: "XXXX-XXXX-6002",
    totalFIRs: 5, crimeTypes: ["Excise Act Violation", "Illicit Liquor Distillation"],
    riskScore: 66, isHabitual: true, modusOperandi: ["Unlicensed Hooch distillation", "Counterfeit excise stamp packaging", "Rural distribution"],
    lastOffense: "2024-10-09", status: "active",
    timeline: [
      { date: "2021-03-19", crime: "Excise Violation", location: "Ilkal" },
      { date: "2023-05-14", crime: "Illicit Hooch Unit", location: "Bagalkote Rural" },
      { date: "2024-10-09", crime: "Excise Smuggling", location: "Badami" },
    ],
    bloodGroup: "O+", languages: ["Kannada"], occupation: "Liquor Vendor", education: "7th Pass",
    fatherName: "Basappa B.", phoneNumber: "XXXXX-XX412",
    aiBehavioralNote: "Habitual illicit liquor distiller along northern river basins posing serious rural public health risks.",
    personalityTraits: [
      { trait: "Aggression", score: 40 }, { trait: "Manipulation", score: 65 }, { trait: "Impulsivity", score: 50 },
      { trait: "Social Deviance", score: 70 }, { trait: "Criminal Sophistication", score: 55 },
    ],
    courtDates: [
      { date: "2025-04-14", court: "JMFC, Bagalkote", caseRef: "CC-108/2025", outcome: "pending" },
    ],
    linkedFIRs: [
      { firNumber: "FIR-2024-BGK-0291", date: "2024-10-09", crime: "Excise Smuggling", section: "Karnataka Excise Act 32, 34", status: "under-investigation" },
    ],
    victimCount: 40, estimatedLoss: "₹38 Lakh",
    frequencyByYear: [
      { year: "2021", count: 2 }, { year: "2023", count: 2 }, { year: "2024", count: 1 },
    ],
  },
  {
    id: "OFF-022", name: "Giridhar Joshi", age: 43,
    photo: "/offenders/off-001.png",
    alias: ["Giri Timber"],
    gender: "male", height: "5'9\"", weight: "80 kg",
    scars: ["Forearm saw cut scar"],
    lastKnownAddress: "Sagar Road, Shivamogga - 577201",
    district: "Shivamogga",
    associates: ["Prashant Gowda"],
    paroleOfficer: null,
    convictions: 2, acquittals: 1, pendingCases: 2,
    fingerprint: "Whorl — Left Index",
    nationalId: "XXXX-XXXX-9110",
    totalFIRs: 5, crimeTypes: ["Forest Act Violation", "Timber Smuggling", "Poaching"],
    riskScore: 73, isHabitual: true, modusOperandi: ["Protected teak/sandalwood felling", "Night forest transport", "Sawmill fence operation"],
    lastOffense: "2024-12-08", status: "on-bail",
    timeline: [
      { date: "2021-11-20", crime: "Timber Smuggling", location: "Sagar Forest" },
      { date: "2023-04-18", crime: "Sandalwood Felling", location: "Thirthahalli" },
      { date: "2024-12-08", crime: "Forest Act Violation", location: "Shivamogga" },
    ],
    bloodGroup: "B+", languages: ["Kannada"], occupation: "Timber Sawmill Contractor", education: "SSLC",
    fatherName: "Narayan Joshi", phoneNumber: "XXXXX-XX811",
    aiBehavioralNote: "Sandalwood and hardwood smuggling syndicate operator exploiting Western Ghats protected forest corridors.",
    personalityTraits: [
      { trait: "Aggression", score: 50 }, { trait: "Manipulation", score: 74 }, { trait: "Impulsivity", score: 40 },
      { trait: "Social Deviance", score: 75 }, { trait: "Criminal Sophistication", score: 72 },
    ],
    courtDates: [
      { date: "2025-06-25", court: "District Court, Shivamogga", caseRef: "CC-810/2025", outcome: "pending" },
    ],
    linkedFIRs: [
      { firNumber: "FIR-2024-SHV-0401", date: "2024-12-08", crime: "Forest Act Violation", section: "Karnataka Forest Act 86, 87", status: "under-investigation" },
    ],
    victimCount: 0, estimatedLoss: "₹1.3 Crore (Seized Timber)",
    frequencyByYear: [
      { year: "2021", count: 2 }, { year: "2023", count: 2 }, { year: "2024", count: 1 },
    ],
  },
  {
    id: "OFF-023", name: "Sultan Mir", age: 37,
    photo: "/offenders/off-006.png",
    alias: ["Sultan Visa"],
    gender: "male", height: "5'8\"", weight: "75 kg",
    scars: ["No visible scars"],
    lastKnownAddress: "Frazer Town, Bengaluru East - 560005",
    district: "Bengaluru East",
    associates: ["Sayyed Pasha", "Farhan Sheikh"],
    paroleOfficer: null,
    convictions: 1, acquittals: 1, pendingCases: 2,
    fingerprint: "Loop — Left Thumb",
    nationalId: "XXXX-XXXX-1120",
    totalFIRs: 4, crimeTypes: ["Passport Forgery", "Immigration Fraud"],
    riskScore: 71, isHabitual: false, modusOperandi: ["High-grade visa stamp forgery", "Fake educational degrees", "Human smuggling consultancy"],
    lastOffense: "2024-09-17", status: "active",
    timeline: [
      { date: "2022-08-14", crime: "Visa Forgery", location: "Frazer Town" },
      { date: "2024-09-17", crime: "Immigration Fraud", location: "Bengaluru East" },
    ],
    bloodGroup: "AB+", languages: ["Urdu", "English", "Hindi"], occupation: "Travel Agent", education: "BA",
    fatherName: "Hussain Mir", phoneNumber: "XXXXX-XX340",
    aiBehavioralNote: "Sophisticated immigration forgery specialist providing fraudulent travel documents and degree credentials.",
    personalityTraits: [
      { trait: "Aggression", score: 15 }, { trait: "Manipulation", score: 88 }, { trait: "Impulsivity", score: 20 },
      { trait: "Social Deviance", score: 68 }, { trait: "Criminal Sophistication", score: 89 },
    ],
    courtDates: [
      { date: "2025-05-30", court: "3rd ACMM, Bengaluru", caseRef: "CC-901/2025", outcome: "pending" },
    ],
    linkedFIRs: [
      { firNumber: "FIR-2024-BLR-0651", date: "2024-09-17", crime: "Immigration Fraud", section: "IPC 468, 471, Passports Act", status: "under-investigation" },
    ],
    victimCount: 32, estimatedLoss: "₹88 Lakh",
    frequencyByYear: [
      { year: "2022", count: 2 }, { year: "2024", count: 2 },
    ],
  },
  {
    id: "OFF-024", name: "Yellappa N.", age: 45,
    photo: "/offenders/off-003.png",
    alias: ["Yellappa Trafficker"],
    gender: "male", height: "5'7\"", weight: "79 kg",
    scars: ["Burn scar on right shoulder"],
    lastKnownAddress: "Sindhanur Town, Raichur - 584128",
    district: "Raichur",
    associates: ["Venkatesh Naik"],
    paroleOfficer: null,
    convictions: 3, acquittals: 0, pendingCases: 2,
    fingerprint: "Whorl — Right Thumb",
    nationalId: "XXXX-XXXX-7109",
    totalFIRs: 6, crimeTypes: ["Human Trafficking", "Bonded Labor Exploitation"],
    riskScore: 90, isHabitual: true, modusOperandi: ["Agrarian debt bondage recruitment", "Interstate labor trafficking", "Coercive containment"],
    lastOffense: "2025-01-22", status: "jailed",
    timeline: [
      { date: "2021-05-11", crime: "Bonded Labor Exploitation", location: "Sindhanur" },
      { date: "2023-02-19", crime: "Human Trafficking", location: "Raichur" },
      { date: "2025-01-22", crime: "Interstate Labor Trafficking", location: "Raichur Border" },
    ],
    bloodGroup: "O-", languages: ["Kannada", "Telugu"], occupation: "Labor Contractor", education: "8th Pass",
    fatherName: "Ningappa N.", phoneNumber: "XXXXX-XX901",
    aiBehavioralNote: "High-severity human trafficking operative exploiting agrarian household debt in Raichur to transport bonded labor to brick kilns.",
    personalityTraits: [
      { trait: "Aggression", score: 85 }, { trait: "Manipulation", score: 84 }, { trait: "Impulsivity", score: 40 },
      { trait: "Social Deviance", score: 92 }, { trait: "Criminal Sophistication", score: 80 },
    ],
    courtDates: [
      { date: "2025-04-18", court: "Sessions Court, Raichur", caseRef: "SC-71/2025", outcome: "pending" },
    ],
    linkedFIRs: [
      { firNumber: "FIR-2025-RCR-0019", date: "2025-01-22", crime: "Interstate Labor Trafficking", section: "IPC 370, Bonded Labour Act", status: "under-investigation" },
    ],
    victimCount: 65, estimatedLoss: "₹1.5 Crore (Unpaid Wages & Bondage)",
    frequencyByYear: [
      { year: "2021", count: 2 }, { year: "2023", count: 2 }, { year: "2025", count: 2 },
    ],
  },
];




// ─── Case Intelligence Data ──────────────────────────────────────────

export interface CaseRecord {
  firNumber: string;
  date: string;
  crimeType: string;
  section: string;
  accused: string[];
  victim: string;
  location: string;
  status: "under-investigation" | "charge-sheeted" | "court-pending" | "convicted" | "closed";
  summary: string;
  timeline: { date: string; event: string }[];
  similarCases: string[];
  leads: string[];
  // Phase 2 Fields
  solvabilityScore: number;
  investigatingOfficer: string;
  witnessCount: number;
  evidence: { type: string; displayTitle?: string; description: string; status: "collected" | "at-forensics" | "processed" }[];
  recoveredAssets: string;
  nextHearingDate: string | null;
  priority: "critical" | "high" | "medium" | "low";
  aiAnalysis: string;
}

export const cases: CaseRecord[] = [
  {
    firNumber: "FIR-2025-BLR-0847",
    date: "2025-03-15",
    crimeType: "Armed Robbery",
    section: "IPC 392, 397",
    accused: ["Rajesh Kumar", "Unknown"],
    victim: "Meera Devi",
    location: "Majestic Area, Bengaluru",
    status: "under-investigation",
    summary: "Armed robbery at a jewelry store in Majestic area at approximately 9:45 PM. Two suspects, one identified as Rajesh Kumar (repeat offender, 7 prior FIRs), entered the store with concealed weapons. Approximately ₹12.5 lakh worth of gold jewelry was stolen. CCTV footage partially captured the incident.",
    timeline: [
      { date: "2025-03-15", event: "FIR Filed at Upparpet PS" },
      { date: "2025-03-16", event: "CCTV footage reviewed — 1 suspect identified" },
      { date: "2025-03-18", event: "Rajesh Kumar identified via facial recognition" },
      { date: "2025-03-20", event: "Arrest warrant issued" },
      { date: "2025-03-25", event: "Rajesh Kumar arrested at Whitefield hideout" },
    ],
    similarCases: ["FIR-2023-BLR-0412", "FIR-2022-BLR-1105", "FIR-2021-BLR-0673"],
    leads: ["Cross-reference HDFC-****4521 for recent large deposits", "Check CCTV at MG Road metro for second suspect", "Interview jewelry store employees for insider information"],
    solvabilityScore: 82,
    investigatingOfficer: "Insp. Vikram Patil",
    witnessCount: 3,
    evidence: [
      { type: "CCTV Footage", description: "Exterior street camera capturing getaway vehicle", status: "processed" },
      { type: "Weapon", description: "Discarded 9mm handgun found 2km from scene", status: "at-forensics" },
      { type: "Fingerprint", displayTitle: "Fingerprint Lift", description: "Partial print from display case glass", status: "processed" }
    ],
    recoveredAssets: "₹4.2 Lakh (Partial)",
    nextHearingDate: null,
    priority: "critical",
    aiAnalysis: "Pattern matches three previous armed robberies in the Majestic area within the last 24 months. High likelihood of insider collusion given the precise targeting of the highest-value display case within a 3-minute window. The second suspect is likely a new recruit, showing signs of hesitation in the CCTV footage."
  },
  {
    firNumber: "FIR-2025-BLR-1234",
    date: "2025-05-20",
    crimeType: "Cybercrime - Wire Fraud",
    section: "IT Act 66C, 66D",
    accused: ["Farhan Sheikh"],
    victim: "Multiple (12 complainants)",
    location: "Whitefield, Bengaluru",
    status: "under-investigation",
    summary: "Sophisticated wire fraud scheme targeting senior citizens through fake bank customer care calls. Victims were tricked into revealing OTPs and transferring funds to mule accounts. Total estimated loss: ₹48.7 lakh across 12 victims. Suspect Farhan Sheikh has 7 prior cybercrime FIRs.",
    timeline: [
      { date: "2025-05-18", event: "First complaint received at Cyber Crime PS" },
      { date: "2025-05-19", event: "4 more victims identified through common phone number" },
      { date: "2025-05-20", event: "FIR registered; bank accounts frozen" },
      { date: "2025-05-22", event: "SIM card traced to Farhan Sheikh" },
      { date: "2025-05-25", event: "Lookout circular issued — suspect absconding" },
    ],
    similarCases: ["FIR-2024-BLR-0891", "FIR-2023-BLR-1567"],
    leads: ["Trace ICICI-****1190 withdrawal locations", "Check mule account KYC documents for accomplices", "Coordinate with Telecom provider for call detail records"],
    solvabilityScore: 65,
    investigatingOfficer: "ACP Neha Sharma",
    witnessCount: 12,
    evidence: [
      { type: "Digital Logs", description: "IP access logs for the mule accounts", status: "processed" },
      { type: "Call Records", description: "CDR of the primary spoofed number", status: "collected" },
      { type: "Financial", description: "Frozen bank statements from 4 mule accounts", status: "processed" }
    ],
    recoveredAssets: "₹18.5 Lakh (Frozen)",
    nextHearingDate: null,
    priority: "high",
    aiAnalysis: "The structured nature of the withdrawals (keeping amounts under ₹50k to avoid automated flagging) indicates a highly organized operation. The suspect is likely part of a larger syndicate operating out of Jamtara or a similar hub, using local operatives for cash withdrawals."
  },
  {
    firNumber: "FIR-2024-BLR-0965",
    date: "2024-12-01",
    crimeType: "Narcotics Possession",
    section: "NDPS Act 21, 22",
    accused: ["Anil Gowda"],
    victim: "State",
    location: "KR Puram, Bengaluru",
    status: "court-pending",
    summary: "Narcotics raid at a warehouse in KR Puram led to the seizure of 2.5 kg of methamphetamine and 500g of MDMA. Accused Anil Gowda was apprehended at the scene. Investigation revealed links to an interstate drug trafficking network operating across Karnataka and Tamil Nadu.",
    timeline: [
      { date: "2024-11-28", event: "Intelligence tip received from informant" },
      { date: "2024-11-30", event: "Surveillance operation initiated" },
      { date: "2024-12-01", event: "Raid conducted; Anil Gowda arrested with contraband" },
      { date: "2024-12-05", event: "Charge sheet filed" },
      { date: "2025-01-15", event: "Case referred to NDPS Court" },
    ],
    similarCases: ["FIR-2023-BLR-0782", "FIR-2022-MNG-0234"],
    leads: ["Investigate supply chain from Tamil Nadu border", "Check SBI-****8832 for hawala transactions", "Interview warehouse owner for rental agreement details"],
    solvabilityScore: 95,
    investigatingOfficer: "DCP Rajesh Menon",
    witnessCount: 4,
    evidence: [
      { type: "Contraband", description: "2.5kg Meth, 500g MDMA seized at scene", status: "processed" },
      { type: "Mobile Device", description: "Burner phone recovered from accused", status: "at-forensics" },
      { type: "Document", description: "Warehouse lease agreement", status: "processed" }
    ],
    recoveredAssets: "₹35 Lakh (Contraband Value)",
    nextHearingDate: "2026-08-14",
    priority: "medium",
    aiAnalysis: "The scale of the seizure suggests this location was a primary distribution node for East Bengaluru. Communication logs from the recovered burner phone, once decrypted, will likely expose the interstate supply chain route originating from Chennai."
  },
];

// ─── Financial Trails Data ───────────────────────────────────────────

export interface SuspiciousTransaction {
  id: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  date: string;
  type: "deposit" | "withdrawal" | "transfer";
  flag: "amount-anomaly" | "frequency-anomaly" | "cross-border" | "structuring";
  severity: "critical" | "high" | "medium";
  linkedFIR: string;
  linkedAccused: string;
  status: "flagged" | "under-review" | "escalated" | "resolved";
}

export const suspiciousTransactions: SuspiciousTransaction[] = [
  { id: "TXN-001", fromAccount: "HDFC-****4521", toAccount: "CASH", amount: 495000, date: "2025-03-16", type: "withdrawal", flag: "structuring", severity: "critical", linkedFIR: "FIR-2025-BLR-0847", linkedAccused: "Rajesh Kumar", status: "under-review" },
  { id: "TXN-002", fromAccount: "HDFC-****4521", toAccount: "SBI-****2211", amount: 250000, date: "2025-03-17", type: "transfer", flag: "amount-anomaly", severity: "high", linkedFIR: "FIR-2025-BLR-0847", linkedAccused: "Rajesh Kumar", status: "flagged" },
  { id: "TXN-003", fromAccount: "ICICI-****1190", toAccount: "CASH", amount: 180000, date: "2025-05-21", type: "withdrawal", flag: "frequency-anomaly", severity: "critical", linkedFIR: "FIR-2025-BLR-1234", linkedAccused: "Farhan Sheikh", status: "escalated" },
  { id: "TXN-004", fromAccount: "Multiple Victims", toAccount: "ICICI-****1190", amount: 487000, date: "2025-05-20", type: "transfer", flag: "amount-anomaly", severity: "critical", linkedFIR: "FIR-2025-BLR-1234", linkedAccused: "Farhan Sheikh", status: "under-review" },
  { id: "TXN-005", fromAccount: "SBI-****8832", toAccount: "UNKNOWN INTL", amount: 750000, date: "2024-11-29", type: "transfer", flag: "cross-border", severity: "critical", linkedFIR: "FIR-2024-BLR-0965", linkedAccused: "Anil Gowda", status: "escalated" },
  { id: "TXN-006", fromAccount: "SBI-****8832", toAccount: "CASH", amount: 49000, date: "2024-11-28", type: "withdrawal", flag: "structuring", severity: "high", linkedFIR: "FIR-2024-BLR-0965", linkedAccused: "Anil Gowda", status: "flagged" },
  { id: "TXN-007", fromAccount: "SBI-****8832", toAccount: "CASH", amount: 48500, date: "2024-11-27", type: "withdrawal", flag: "structuring", severity: "high", linkedFIR: "FIR-2024-BLR-0965", linkedAccused: "Anil Gowda", status: "flagged" },
  { id: "TXN-008", fromAccount: "HDFC-****4521", toAccount: "Axis-****7730", amount: 120000, date: "2025-02-10", type: "transfer", flag: "frequency-anomaly", severity: "medium", linkedFIR: "FIR-2025-BLR-0847", linkedAccused: "Suresh Patil", status: "resolved" },
];

export const flowData = [
  { from: "Victims (12)", to: "ICICI-****1190", amount: 487000 },
  { from: "ICICI-****1190", to: "Cash Withdrawal", amount: 180000 },
  { from: "ICICI-****1190", to: "Mule Account 1", amount: 150000 },
  { from: "ICICI-****1190", to: "Mule Account 2", amount: 157000 },
  { from: "HDFC-****4521", to: "Cash Withdrawal", amount: 495000 },
  { from: "HDFC-****4521", to: "SBI-****2211", amount: 250000 },
  { from: "SBI-****8832", to: "International Transfer", amount: 750000 },
  { from: "SBI-****8832", to: "Cash (Structured)", amount: 97500 },
];
