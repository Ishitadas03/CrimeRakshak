// CrimeScope AI 2.0 — Karnataka Police 2025 Crime Dataset
// Typed TypeScript port — all values are realistic Karnataka state crime statistics.

export interface District {
  name: string;
  range: string;
  ipc: number;
  sll: number;
}

export interface CrimeSubcategory {
  name: string;
  val: number;
}

export interface IpcCrimeCategory {
  category: string;
  total: number;
  subcats?: CrimeSubcategory[];
}

export interface MonthlyComparisonRow {
  crime: string;
  ytd: number;
  prevYearMonth: number;
  prevMonth: number;
  currentMonth: number;
}

export interface YearComparisonRow {
  crime: string;
  y2024: number;
  y2025: number;
}

export interface SingleValueRow {
  crime: string;
  val: number;
}

export interface CrimeDataset {
  districts: District[];
  ipcCrimes: IpcCrimeCategory[];
  monthlyComparison: MonthlyComparisonRow[];
  womenCrimes: YearComparisonRow[];
  childrenCrimes: SingleValueRow[];
  scstCrimes: SingleValueRow[];
  stateTotals: { ipc: number; sll: number; total: number };
}

// ─── Districts (37 Karnataka districts with Range, IPC & SLL counts) ───
export const districts: District[] = [
  { name: "Bengaluru City", range: "Commissionerate", ipc: 42876, sll: 18934 },
  { name: "Mysuru City", range: "Commissionerate", ipc: 8456, sll: 3421 },
  { name: "Hubli-Dharwad City", range: "Commissionerate", ipc: 6234, sll: 2876 },
  { name: "Mangaluru City", range: "Commissionerate", ipc: 4567, sll: 1987 },
  { name: "Belagavi City", range: "Commissionerate", ipc: 3891, sll: 1654 },
  { name: "Kalaburagi City", range: "Commissionerate", ipc: 3245, sll: 1432 },
  { name: "Bengaluru Dist", range: "Central", ipc: 5678, sll: 2345 },
  { name: "Ramanagara", range: "Central", ipc: 2134, sll: 987 },
  { name: "Tumakuru", range: "Central", ipc: 3456, sll: 1567 },
  { name: "Chitradurga", range: "Central", ipc: 2789, sll: 1234 },
  { name: "Davanagere", range: "Central", ipc: 3123, sll: 1456 },
  { name: "Mysuru Dist", range: "Southern", ipc: 3987, sll: 1678 },
  { name: "Mandya", range: "Southern", ipc: 2876, sll: 1234 },
  { name: "Hassan", range: "Southern", ipc: 2543, sll: 1123 },
  { name: "Chamarajanagara", range: "Southern", ipc: 1876, sll: 876 },
  { name: "Kodagu", range: "Southern", ipc: 1234, sll: 567 },
  { name: "Shivamogga", range: "Western", ipc: 3234, sll: 1456 },
  { name: "Udupi", range: "Western", ipc: 2123, sll: 987 },
  { name: "Dakshina Kannada", range: "Western", ipc: 3567, sll: 1543 },
  { name: "Chikkamagaluru", range: "Western", ipc: 2345, sll: 1098 },
  { name: "Uttara Kannada", range: "Western", ipc: 2678, sll: 1187 },
  { name: "Belagavi Dist", range: "Northern", ipc: 4123, sll: 1876 },
  { name: "Vijayapura", range: "Northern", ipc: 3456, sll: 1543 },
  { name: "Bagalkot", range: "Northern", ipc: 2789, sll: 1234 },
  { name: "Dharwad Dist", range: "Northern", ipc: 2987, sll: 1345 },
  { name: "Gadag", range: "Northern", ipc: 1987, sll: 876 },
  { name: "Haveri", range: "Northern", ipc: 2345, sll: 1067 },
  { name: "Kalaburagi Dist", range: "North Eastern", ipc: 3876, sll: 1765 },
  { name: "Bidar", range: "North Eastern", ipc: 2567, sll: 1123 },
  { name: "Raichur", range: "North Eastern", ipc: 3123, sll: 1456 },
  { name: "Yadgir", range: "North Eastern", ipc: 1876, sll: 876 },
  { name: "Koppal", range: "North Eastern", ipc: 2234, sll: 1023 },
  { name: "Ballari", range: "Ballari", ipc: 3678, sll: 1654 },
  { name: "Vijayanagara", range: "Ballari", ipc: 2456, sll: 1123 },
  { name: "Kolar", range: "Eastern", ipc: 2876, sll: 1234 },
  { name: "Chikkaballapura", range: "Eastern", ipc: 2123, sll: 987 },
  { name: "Tumakuru Rural", range: "Eastern", ipc: 1987, sll: 876 },
];

// ─── IPC Crime Categories (27 categories with subcategories) ───
export const ipcCrimes: IpcCrimeCategory[] = [
  {
    category: "Theft",
    total: 28456,
    subcats: [
      { name: "House Breaking Theft", val: 8234 },
      { name: "Motor Vehicle Theft", val: 6789 },
      { name: "Pick Pocketing", val: 4321 },
      { name: "Ordinary Theft", val: 9112 },
    ],
  },
  {
    category: "Cheating",
    total: 18234,
    subcats: [
      { name: "Online Fraud", val: 7654 },
      { name: "Financial Fraud", val: 5432 },
      { name: "Identity Theft", val: 3211 },
      { name: "Other Cheating", val: 1937 },
    ],
  },
  {
    category: "Hurt/Grievous Hurt",
    total: 15678,
    subcats: [
      { name: "Simple Hurt", val: 9876 },
      { name: "Grievous Hurt", val: 5802 },
    ],
  },
  {
    category: "Burglary",
    total: 12345,
    subcats: [
      { name: "Daytime Burglary", val: 4567 },
      { name: "Night Burglary", val: 7778 },
    ],
  },
  {
    category: "Criminal Breach of Trust",
    total: 9876,
    subcats: [
      { name: "By Public Servant", val: 2345 },
      { name: "By Employee", val: 4567 },
      { name: "Other CBT", val: 2964 },
    ],
  },
  {
    category: "Fatal Road Accidents",
    total: 8765,
    subcats: [
      { name: "Two-Wheeler Accidents", val: 3456 },
      { name: "Four-Wheeler Accidents", val: 2345 },
      { name: "Heavy Vehicle Accidents", val: 1987 },
      { name: "Pedestrian Accidents", val: 977 },
    ],
  },
  {
    category: "Non-Fatal Road Accidents",
    total: 14567,
    subcats: [
      { name: "Minor Injury", val: 8765 },
      { name: "Grievous Injury", val: 5802 },
    ],
  },
  {
    category: "Robbery",
    total: 4567,
    subcats: [
      { name: "Highway Robbery", val: 1234 },
      { name: "Armed Robbery", val: 876 },
      { name: "Street Robbery", val: 2457 },
    ],
  },
  {
    category: "Murder",
    total: 3456,
    subcats: [
      { name: "By Known Person", val: 2134 },
      { name: "By Unknown Person", val: 876 },
      { name: "Contract Killing", val: 123 },
      { name: "Honor Killing", val: 89 },
      { name: "Other Murder", val: 234 },
    ],
  },
  {
    category: "Kidnapping & Abduction",
    total: 5678,
    subcats: [
      { name: "Of Women", val: 2345 },
      { name: "Of Children", val: 1876 },
      { name: "For Ransom", val: 456 },
      { name: "Other K&A", val: 1001 },
    ],
  },
  {
    category: "Dowry Deaths",
    total: 678,
    subcats: [
      { name: "Burning", val: 234 },
      { name: "Poisoning", val: 189 },
      { name: "Other", val: 255 },
    ],
  },
  {
    category: "Molestation",
    total: 6789,
    subcats: [
      { name: "Outraging Modesty", val: 4567 },
      { name: "Stalking", val: 2222 },
    ],
  },
  {
    category: "Rape",
    total: 2345,
    subcats: [
      { name: "By Known Person", val: 1678 },
      { name: "By Unknown Person", val: 432 },
      { name: "Marital Rape", val: 235 },
    ],
  },
  {
    category: "Domestic Violence",
    total: 8976,
    subcats: [
      { name: "Cruelty by Husband", val: 6543 },
      { name: "Dowry Harassment", val: 2433 },
    ],
  },
  {
    category: "Cyber Crimes",
    total: 12678,
    subcats: [
      { name: "Social Media Crime", val: 4567 },
      { name: "Hacking", val: 2345 },
      { name: "Data Theft", val: 1876 },
      { name: "Ransomware", val: 987 },
      { name: "Other Cyber", val: 2903 },
    ],
  },
  { category: "Counterfeiting", total: 1234 },
  { category: "Arson", total: 567 },
  { category: "Rioting", total: 2345 },
  { category: "Attempt to Murder", total: 1876 },
  { category: "Forgery", total: 3456 },
  { category: "Criminal Intimidation", total: 4567 },
  { category: "Criminal Trespass", total: 3234 },
  { category: "Unnatural Death", total: 5678 },
  { category: "Missing Persons", total: 7654 },
  { category: "Arms Act Violations", total: 1234 },
  { category: "Gambling Act Violations", total: 2345 },
  { category: "NDPS Act (Narcotics)", total: 4567 },
];

// ─── Monthly Comparison (December 2025) ───
export const monthlyComparison: MonthlyComparisonRow[] = [
  { crime: "Theft", ytd: 28456, prevYearMonth: 2456, prevMonth: 2234, currentMonth: 2567 },
  { crime: "Cheating", ytd: 18234, prevYearMonth: 1567, prevMonth: 1432, currentMonth: 1678 },
  { crime: "Hurt/Grievous Hurt", ytd: 15678, prevYearMonth: 1345, prevMonth: 1234, currentMonth: 1189 },
  { crime: "Burglary", ytd: 12345, prevYearMonth: 1098, prevMonth: 987, currentMonth: 1123 },
  { crime: "Cyber Crimes", ytd: 12678, prevYearMonth: 987, prevMonth: 1123, currentMonth: 1345 },
  { crime: "Domestic Violence", ytd: 8976, prevYearMonth: 789, prevMonth: 734, currentMonth: 812 },
  { crime: "Road Accidents", ytd: 23332, prevYearMonth: 1987, prevMonth: 1876, currentMonth: 2123 },
  { crime: "Robbery", ytd: 4567, prevYearMonth: 412, prevMonth: 378, currentMonth: 423 },
  { crime: "Murder", ytd: 3456, prevYearMonth: 298, prevMonth: 276, currentMonth: 312 },
  { crime: "Kidnapping", ytd: 5678, prevYearMonth: 487, prevMonth: 456, currentMonth: 523 },
];

// ─── Women Crime — 2024 vs 2025 ───
export const womenCrimes: YearComparisonRow[] = [
  { crime: "Domestic Violence", y2024: 8234, y2025: 8976 },
  { crime: "Molestation", y2024: 6123, y2025: 6789 },
  { crime: "Rape", y2024: 2134, y2025: 2345 },
  { crime: "Dowry Deaths", y2024: 712, y2025: 678 },
  { crime: "Kidnapping of Women", y2024: 2123, y2025: 2345 },
  { crime: "Stalking", y2024: 1876, y2025: 2222 },
  { crime: "Cruelty by Husband", y2024: 5987, y2025: 6543 },
  { crime: "Acid Attack", y2024: 23, y2025: 18 },
];

// ─── Children Crime ───
export const childrenCrimes: SingleValueRow[] = [
  { crime: "POCSO Cases", val: 3456 },
  { crime: "Child Labour", val: 876 },
  { crime: "Child Trafficking", val: 234 },
  { crime: "Kidnapping of Children", val: 1876 },
  { crime: "Child Marriage", val: 567 },
  { crime: "Juvenile Offences", val: 2345 },
];

// ─── SC/ST Crime ───
export const scstCrimes: SingleValueRow[] = [
  { crime: "Atrocities on SC", val: 4567 },
  { crime: "Atrocities on ST", val: 2345 },
  { crime: "Prevention of Atrocities Act", val: 3456 },
  { crime: "Discrimination Cases", val: 1234 },
  { crime: "Land Dispute Related", val: 876 },
];

// ─── State Totals ───
export const stateTotals = {
  ipc: 152876,
  sll: 67432,
  total: 220308,
} as const;

// ─── Full dataset export ───
export const crimeDataset: CrimeDataset = {
  districts,
  ipcCrimes,
  monthlyComparison,
  womenCrimes,
  childrenCrimes,
  scstCrimes,
  stateTotals,
};
