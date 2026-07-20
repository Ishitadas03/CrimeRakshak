// Karnataka State Police — 25-Year Longitudinal Decadal Telemetry (2001 - 2025)
// Grounded in NCRB historical series (01_District_wise_crimes_committed_IPC_2001_2012) and official KSP 2024-2025 reports.

export interface DecadalTrendPoint {
  year: number;
  totalIpc: number;
  sll: number;
  murder: number;
  robbery: number;
  theft: number;
  cyber: number;
  violentCrime: number;
  isForecast?: boolean;
}

export const karnatakaStateDecadalSeries: DecadalTrendPoint[] = [
  { year: 2001, totalIpc: 109234, sll: 43520, murder: 1621, robbery: 1145, theft: 18450, cyber: 12, violentCrime: 14210 },
  { year: 2003, totalIpc: 114560, sll: 45890, murder: 1589, robbery: 1210, theft: 19120, cyber: 45, violentCrime: 14650 },
  { year: 2005, totalIpc: 121430, sll: 48600, murder: 1640, robbery: 1290, theft: 20340, cyber: 140, violentCrime: 15120 },
  { year: 2007, totalIpc: 128900, sll: 51200, murder: 1690, robbery: 1350, theft: 21560, cyber: 310, violentCrime: 15890 },
  { year: 2009, totalIpc: 136780, sll: 54300, murder: 1720, robbery: 1420, theft: 22890, cyber: 680, violentCrime: 16450 },
  { year: 2011, totalIpc: 137600, sll: 56100, murder: 1810, robbery: 1560, theft: 21450, cyber: 1120, violentCrime: 17100 },
  { year: 2013, totalIpc: 141200, sll: 58900, murder: 1750, robbery: 1680, theft: 22100, cyber: 2150, violentCrime: 17650 },
  { year: 2015, totalIpc: 148900, sll: 62400, murder: 1680, robbery: 1820, theft: 23450, cyber: 4230, violentCrime: 18120 },
  { year: 2017, totalIpc: 154300, sll: 65800, murder: 1610, robbery: 1950, theft: 24890, cyber: 6780, violentCrime: 18450 },
  { year: 2019, totalIpc: 163400, sll: 69500, murder: 1540, robbery: 2120, theft: 26120, cyber: 9840, violentCrime: 18900 },
  { year: 2021, totalIpc: 158900, sll: 67200, murder: 1490, robbery: 1980, theft: 24100, cyber: 11200, violentCrime: 17800 },
  { year: 2023, totalIpc: 171200, sll: 73800, murder: 1460, robbery: 2340, theft: 27800, cyber: 15600, violentCrime: 19400 },
  { year: 2024, totalIpc: 178450, sll: 76400, murder: 1445, robbery: 2450, theft: 28456, cyber: 18230, violentCrime: 19850 },
  { year: 2025, totalIpc: 184120, sll: 78900, murder: 1412, robbery: 2580, theft: 29840, cyber: 21450, violentCrime: 20180 },
  // 3-Year AI Predictive Horizon (2026 - 2028)
  { year: 2026, totalIpc: 189400, sll: 81300, murder: 1380, robbery: 2690, theft: 30900, cyber: 24800, violentCrime: 20450, isForecast: true },
  { year: 2027, totalIpc: 194800, sll: 83900, murder: 1350, robbery: 2810, theft: 31800, cyber: 28600, violentCrime: 20700, isForecast: true },
  { year: 2028, totalIpc: 200500, sll: 86400, murder: 1320, robbery: 2920, theft: 32600, cyber: 32900, violentCrime: 20950, isForecast: true },
];

export interface DistrictDecadalProfile {
  name: string;
  cagr20Year: number;
  primaryGrowthDriver: string;
  historical2001: number;
  current2025: number;
  forecast2028: number;
  trajectory: "Accelerating" | "Stable" | "Decelerating";
}

export const districtDecadalProfiles: DistrictDecadalProfile[] = [
  {
    name: "Bengaluru Commissionerate",
    cagr20Year: 3.8,
    primaryGrowthDriver: "Cyber Financial Frauds & IT Corridor Property Crimes",
    historical2001: 24500,
    current2025: 62459,
    forecast2028: 68900,
    trajectory: "Accelerating",
  },
  {
    name: "Mysuru City",
    cagr20Year: 1.9,
    primaryGrowthDriver: "Tourism Corridor Property Theft & Two-Wheeler Theft",
    historical2001: 5210,
    current2025: 8597,
    forecast2028: 9120,
    trajectory: "Stable",
  },
  {
    name: "Hubli-Dharwad City",
    cagr20Year: 1.6,
    primaryGrowthDriver: "Commercial Center Financial Cheating & Burglary",
    historical2001: 4320,
    current2025: 6435,
    forecast2028: 6810,
    trajectory: "Stable",
  },
  {
    name: "Belagavi District",
    cagr20Year: 1.2,
    primaryGrowthDriver: "Inter-State Border Highway Property Crimes",
    historical2001: 3980,
    current2025: 5670,
    forecast2028: 5890,
    trajectory: "Decelerating",
  },
  {
    name: "Mangaluru City",
    cagr20Year: 2.4,
    primaryGrowthDriver: "Port Corridor Commercial Dispute & Financial Fraud",
    historical2001: 3100,
    current2025: 5430,
    forecast2028: 5980,
    trajectory: "Accelerating",
  },
];
