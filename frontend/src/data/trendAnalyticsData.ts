// Feature 3: Crime Pattern & Trend Analytics — Real Karnataka Police Data
// Sourced from: 01_crime_review_summary.csv, 02_district_wise_reported_cases.csv,
// district_wise_major_heads_yearly.csv

// ─── Types ───────────────────────────────────────────────────────────

export interface MonthlyTrendRow {
  crimeHead: string;
  category: string;
  jan2025: number;
  dec2025: number;
  jan2026: number;
  momChange: number; // Dec 2025 → Jan 2026 %
  yoyChange: number; // Jan 2025 → Jan 2026 %
  trend: "surging" | "rising" | "stable" | "declining" | "dropping";
}

export interface DistrictHotspot {
  district: string;
  murder: number;
  dacoity: number;
  robbery: number;
  chainSnatching: number;
  burglaryDay: number;
  burglaryNight: number;
  theft: number;
  riots: number;
  casesOfHurt: number;
  sllCases: number;
  rape: number;
  dowryDeaths: number;
  pocso: number;
  scstPoa: number;
  cyberCrime: number;
  cheating: number;
  mvTheft: number;
  ndps: number;
  total: number;
}

export interface YearlyDistrictRow {
  district: string;
  murder: number;
  attemptToMurder: number;
  rape: number;
  dacoity: number;
  robbery: number;
  burglaryDay: number;
  burglaryNight: number;
  theft: number;
  riots: number;
  casesOfHurt: number;
  crueltyByHusband: number;
  dowryDeaths: number;
  fatalAccidents: number;
  nonFatalAccidents: number;
  molestation: number;
  scst: number;
  gambling: number;
  dpAct: number;
  cyberCrime: number;
  pocso: number;
  pocsoRape: number;
}

export interface ClusterAlert {
  id: string;
  crimeHead: string;
  severity: "critical" | "high" | "moderate" | "low";
  direction: "surge" | "drop";
  prevValue: number;
  currentValue: number;
  changePercent: number;
  insight: string;
}

export interface CrimeCategoryGroup {
  name: string;
  total: number;
  color: string;
  crimes: { name: string; value: number }[];
}

// ─── Monthly Trends (from 01_crime_review_summary.csv) ──────────────

function computeTrend(mom: number): MonthlyTrendRow["trend"] {
  if (mom > 20) return "surging";
  if (mom > 5) return "rising";
  if (mom > -5) return "stable";
  if (mom > -20) return "declining";
  return "dropping";
}

function pctChange(prev: number, curr: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

const rawMonthly: Array<[string, string, number, number, number]> = [
  // [crimeHead, category, jan2026, dec2025, jan2025]
  ["Murder", "Murder for Gain", 5, 2, 4],
  ["Murder", "Other Murders", 93, 80, 95],
  ["Murder", "Total Murder", 98, 82, 99],
  ["Dacoity", "Dacoity Cases", 6, 14, 19],
  ["Robbery", "Chain Snatching", 29, 42, 44],
  ["Robbery", "Robbery (Excl. Chain Snatching)", 63, 61, 45],
  ["Robbery", "Total Robbery", 92, 103, 89],
  ["Burglary", "Burglary Night", 356, 347, 316],
  ["Burglary", "Burglary Day", 85, 105, 95],
  ["Burglary", "Total Burglary", 441, 452, 411],
  ["Theft", "Reported Theft", 1742, 1771, 1835],
  ["Riots", "Riots", 319, 292, 254],
  ["Hurt", "Cases of Hurt", 1437, 1464, 1327],
  ["Special & Local Laws", "SLL Cases", 5857, 5711, 4629],
  ["Crime against Women", "Rape", 45, 41, 57],
  ["Crime against Women", "Dowry Death", 11, 7, 12],
  ["POCSO", "POCSO", 316, 440, 374],
  ["SC/ST POA Act", "SC/ST POA Act", 223, 249, 173],
  ["Preventive Action", "107 Cr.PC / 126 BNSS", 1361, 1121, 1430],
  ["Preventive Action", "109 Cr.PC / 128 BNSS", 257, 178, 163],
  ["Preventive Action", "110 Cr.PC / 129 BNSS", 712, 734, 685],
  ["Preventive Action", "Total Security Cases", 2330, 2033, 2278],
  ["Cyber Crimes", "Cyber Crimes", 1259, 1286, 1407],
  ["Economic Offences", "Economic Offences", 470, 710, 572],
  ["MMDR", "MMDR Act", 11, 4, 3],
  ["MMDR", "KMMC Rules", 2, 3, 1],
  ["Motor Vehicles Theft", "MV Theft Cases", 767, 795, 900],
  ["NDPS", "NDPS Cases", 1397, 909, 428],
];

export const monthlyTrends: MonthlyTrendRow[] = rawMonthly.map(
  ([crimeHead, category, jan2026, dec2025, jan2025]) => {
    const mom = pctChange(dec2025, jan2026);
    const yoy = pctChange(jan2025, jan2026);
    return { crimeHead, category, jan2025, dec2025, jan2026, momChange: mom, yoyChange: yoy, trend: computeTrend(mom) };
  }
);

// Only total-level rows for the heat grid (no subcategories)
export const monthlyTrendsTotals = monthlyTrends.filter(
  (r) =>
    r.category.startsWith("Total") ||
    !rawMonthly.some(
      ([head, cat]) => head === r.crimeHead && cat.startsWith("Total") && cat !== r.category
    )
);

// ─── District Hotspots (from 02_district_wise_reported_cases.csv) ───

const rawDistricts: Array<[string, ...number[]]> = [
  // [district, murder, dacoity, robbery, chainSnatch, burgDay, burgNight, theft, snatching, riots, hurt, sll, rape, dowry, pocso, scst, cyberCrime, cheating, mvTheft, ndps]
  ["Bagalkot", 3, 1, 1, 0, 6, 13, 20, 0, 4, 12, 82, 1, 0, 8, 4, 2, 4, 7, 3],
  ["Ballari", 1, 0, 1, 0, 3, 4, 37, 0, 8, 13, 124, 0, 0, 5, 6, 13, 5, 9, 1],
  ["Belagavi City", 0, 0, 0, 0, 0, 14, 20, 1, 4, 11, 73, 0, 0, 3, 0, 12, 6, 13, 23],
  ["Belagavi Dist", 6, 0, 2, 2, 3, 19, 78, 0, 45, 96, 187, 4, 0, 21, 14, 14, 22, 41, 22],
  ["Bengaluru City", 13, 0, 30, 16, 15, 84, 649, 6, 12, 155, 1050, 3, 3, 62, 11, 861, 113, 164, 55],
  ["Bengaluru Dist", 8, 0, 7, 2, 7, 27, 76, 0, 10, 56, 198, 2, 0, 22, 7, 31, 12, 30, 12],
  ["Bengaluru South", 2, 0, 1, 0, 1, 5, 32, 0, 3, 12, 62, 0, 0, 6, 1, 18, 3, 8, 2],
  ["Bidar", 1, 0, 0, 0, 1, 7, 21, 0, 5, 18, 116, 1, 0, 4, 4, 2, 3, 6, 3],
  ["Chamarajanagar", 1, 0, 0, 0, 2, 2, 13, 0, 4, 10, 37, 1, 0, 6, 4, 1, 1, 1, 0],
  ["Chickballapura", 2, 0, 0, 0, 3, 7, 17, 0, 1, 17, 44, 2, 0, 6, 3, 23, 3, 10, 6],
  ["Chikkamagaluru", 4, 0, 1, 0, 3, 11, 18, 0, 4, 16, 43, 0, 0, 2, 0, 8, 0, 5, 12],
  ["Chitradurga", 5, 0, 1, 0, 1, 11, 35, 0, 3, 22, 83, 2, 0, 5, 3, 9, 2, 6, 7],
  ["Dakshina Kannada", 2, 0, 0, 0, 1, 4, 15, 0, 5, 21, 60, 0, 0, 2, 2, 7, 1, 6, 6],
  ["Davanagere", 2, 0, 1, 0, 0, 7, 38, 0, 3, 25, 102, 1, 0, 3, 2, 6, 3, 8, 5],
  ["Dharwad", 2, 0, 0, 0, 2, 4, 8, 0, 0, 6, 26, 0, 0, 4, 1, 5, 1, 2, 4],
  ["Gadag", 0, 0, 0, 0, 2, 3, 7, 0, 2, 8, 22, 0, 0, 3, 1, 9, 0, 2, 2],
  ["Hassan", 5, 0, 0, 0, 6, 15, 30, 0, 7, 24, 107, 2, 1, 7, 7, 8, 6, 10, 5],
  ["Haveri", 2, 0, 0, 0, 0, 3, 45, 0, 1, 14, 58, 0, 0, 7, 2, 11, 3, 10, 3],
  ["Hubballi Dharwad City", 3, 0, 1, 0, 1, 5, 17, 0, 1, 6, 33, 1, 0, 7, 2, 16, 5, 5, 4],
  ["K.G.F", 0, 0, 0, 0, 2, 2, 10, 0, 1, 3, 20, 0, 0, 2, 0, 5, 1, 1, 0],
  ["Kalaburagi", 2, 1, 1, 0, 4, 18, 31, 0, 8, 34, 124, 1, 0, 5, 9, 1, 4, 7, 7],
  ["Kalaburagi City", 1, 0, 1, 0, 1, 2, 13, 0, 1, 8, 43, 0, 0, 3, 1, 8, 2, 2, 3],
  ["Karnataka Railways", 0, 0, 0, 0, 0, 0, 22, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 2, 0],
  ["Kodagu", 2, 0, 1, 0, 1, 2, 10, 0, 1, 5, 24, 0, 0, 1, 0, 16, 1, 1, 2],
  ["Kolar", 4, 0, 2, 0, 1, 6, 16, 0, 1, 18, 53, 2, 0, 7, 2, 7, 2, 5, 3],
  ["Koppal", 0, 0, 0, 0, 2, 3, 15, 0, 2, 14, 57, 1, 0, 6, 2, 3, 1, 1, 2],
  ["Mandya", 3, 0, 0, 0, 3, 7, 27, 0, 5, 22, 86, 2, 0, 13, 3, 10, 3, 7, 3],
  ["Mangaluru City", 0, 0, 0, 0, 0, 4, 19, 0, 1, 9, 35, 0, 0, 0, 0, 7, 1, 2, 3],
  ["Mysuru City", 1, 0, 2, 1, 0, 9, 28, 0, 2, 12, 47, 0, 0, 3, 0, 21, 3, 6, 5],
  ["Mysuru Dist", 5, 0, 4, 0, 3, 8, 31, 0, 6, 27, 67, 0, 0, 4, 3, 7, 3, 7, 2],
  ["Raichur", 4, 0, 0, 0, 1, 5, 107, 0, 5, 34, 117, 0, 0, 4, 4, 4, 4, 3, 3],
  ["Shivamogga", 2, 0, 2, 0, 1, 7, 50, 0, 8, 34, 106, 1, 0, 10, 4, 19, 3, 11, 7],
  ["Tumakuru", 3, 0, 0, 0, 0, 9, 44, 0, 7, 34, 105, 3, 0, 9, 3, 24, 3, 8, 7],
  ["Udupi", 0, 0, 0, 0, 0, 1, 16, 0, 0, 6, 13, 0, 0, 4, 0, 18, 0, 0, 3],
  ["Uttara Kannada", 3, 0, 1, 0, 3, 5, 22, 0, 4, 11, 46, 1, 0, 3, 2, 10, 2, 7, 3],
  ["Vijayanagara", 1, 0, 1, 0, 1, 3, 13, 0, 2, 7, 26, 1, 0, 3, 1, 8, 0, 4, 1],
  ["Vijayapur", 5, 0, 2, 0, 4, 12, 28, 0, 5, 23, 103, 0, 0, 5, 3, 33, 4, 4, 9],
  ["Yadgir", 0, 0, 0, 0, 1, 5, 25, 0, 3, 14, 54, 0, 0, 2, 4, 1, 2, 5, 1],
];

export const districtHotspots: DistrictHotspot[] = rawDistricts
  .filter((r) => r[0] !== "Total" && r[0] !== "Karnataka Railways")
  .map(([district, ...nums]) => {
    const [murder, dacoity, robbery, chainSnatching, burglaryDay, burglaryNight, theft, _snatching, riots, casesOfHurt, sllCases, rape, dowryDeaths, pocso, scstPoa, cyberCrime, cheating, mvTheft, ndps] = nums as number[];
    const total = murder + dacoity + robbery + chainSnatching + burglaryDay + burglaryNight + theft + riots + casesOfHurt + sllCases + rape + dowryDeaths + pocso + scstPoa + cyberCrime + cheating + mvTheft + ndps;
    return {
      district: district as string, murder, dacoity, robbery, chainSnatching, burglaryDay, burglaryNight,
      theft, riots, casesOfHurt, sllCases, rape, dowryDeaths, pocso, scstPoa,
      cyberCrime, cheating, mvTheft, ndps, total,
    };
  })
  .sort((a, b) => b.total - a.total);

// ─── Yearly District Data (from district_wise_major_heads_yearly.csv) ───

const rawYearlyDistricts: Array<[string, ...number[]]> = [
  // [district, murder, attemptMurder, rape, dacoity, robbery, burgDay, burgNight, theft, riots, hurt, crueltyHusband, dowry, fatalAcc, nonFatalAcc, molestation, scst, gambling, dpAct, cyber, pocso, pocsoRape]
  ["Bengaluru City", 176, 450, 167, 67, 693, 181, 763, 9605, 72, 3828, 614, 25, 876, 3903, 1251, 240, 498, 876, 17682, 586, 415],
  ["Mysuru City", 22, 39, 23, 2, 45, 9, 82, 356, 10, 309, 17, 5, 160, 970, 59, 24, 51, 119, 272, 65, 49],
  ["Hubballi Dharwad City", 22, 85, 20, 3, 28, 22, 64, 221, 28, 170, 95, 4, 102, 334, 72, 47, 386, 0, 247, 63, 42],
  ["Mangaluru City", 4, 17, 9, 0, 9, 1, 21, 152, 6, 77, 6, 0, 75, 376, 11, 4, 8, 72, 60, 12, 6],
  ["Belagavi City", 5, 27, 10, 2, 11, 7, 47, 168, 31, 145, 35, 3, 67, 388, 35, 6, 35, 89, 89, 18, 13],
  ["Kalaburagi City", 16, 40, 5, 3, 14, 9, 29, 138, 11, 110, 36, 3, 70, 312, 21, 12, 62, 0, 99, 27, 20],
  ["Bengaluru Dist", 60, 100, 79, 3, 75, 52, 216, 753, 44, 611, 264, 18, 322, 1303, 214, 66, 159, 453, 497, 230, 160],
  ["Ramanagara", 14, 18, 14, 0, 4, 8, 40, 136, 13, 84, 45, 2, 118, 440, 20, 8, 18, 127, 46, 28, 24],
  ["Tumakuru", 31, 44, 31, 0, 4, 6, 92, 420, 46, 269, 113, 4, 211, 714, 105, 50, 84, 254, 198, 76, 47],
  ["Chitradurga", 34, 46, 14, 0, 7, 12, 74, 288, 21, 158, 73, 4, 141, 483, 54, 24, 85, 86, 91, 39, 22],
  ["Davanagere", 30, 67, 18, 0, 8, 3, 70, 308, 20, 230, 64, 3, 135, 513, 44, 19, 40, 197, 71, 36, 18],
  ["Mysuru Dist", 34, 32, 26, 1, 27, 20, 58, 287, 32, 265, 132, 8, 166, 1016, 71, 34, 52, 158, 64, 65, 42],
  ["Mandya", 30, 38, 42, 0, 4, 13, 73, 213, 42, 265, 178, 3, 179, 771, 131, 51, 43, 147, 93, 120, 80],
  ["Hassan", 41, 41, 24, 0, 6, 17, 65, 266, 41, 206, 146, 6, 197, 619, 103, 48, 93, 110, 76, 63, 39],
  ["Chamarajanagar", 10, 15, 11, 0, 2, 4, 15, 84, 12, 86, 68, 3, 49, 200, 44, 25, 14, 40, 9, 31, 22],
  ["Kodagu", 8, 9, 3, 0, 4, 3, 19, 92, 9, 49, 6, 1, 59, 152, 5, 3, 3, 22, 36, 10, 4],
  ["Shivamogga", 26, 43, 25, 0, 11, 8, 67, 476, 54, 313, 82, 6, 195, 683, 103, 50, 119, 109, 182, 80, 52],
  ["Udupi", 4, 8, 6, 0, 1, 1, 12, 117, 3, 57, 15, 0, 32, 232, 12, 2, 6, 11, 143, 37, 14],
  ["Dakshina Kannada", 20, 24, 10, 0, 3, 3, 21, 124, 30, 167, 29, 1, 106, 544, 15, 15, 11, 50, 60, 15, 9],
  ["Chikkamagaluru", 18, 13, 9, 0, 3, 6, 37, 153, 20, 144, 37, 3, 91, 292, 28, 10, 21, 73, 50, 24, 14],
  ["Uttara Kannada", 20, 19, 13, 0, 3, 10, 42, 187, 24, 122, 40, 2, 77, 311, 28, 16, 17, 51, 85, 23, 13],
  ["Belagavi Dist", 44, 68, 52, 2, 12, 23, 118, 567, 150, 632, 208, 17, 267, 1193, 217, 82, 196, 435, 136, 149, 102],
  ["Vijayapura", 33, 68, 21, 5, 14, 26, 79, 295, 42, 210, 82, 3, 116, 471, 67, 28, 51, 158, 206, 52, 37],
  ["Bagalkot", 20, 35, 15, 2, 8, 14, 67, 178, 31, 134, 78, 3, 101, 355, 51, 21, 46, 99, 35, 53, 33],
  ["Dharwad Dist", 11, 12, 4, 0, 2, 3, 16, 44, 6, 47, 29, 0, 49, 107, 11, 9, 10, 17, 29, 9, 5],
  ["Gadag", 8, 10, 3, 0, 2, 5, 19, 64, 9, 53, 23, 0, 62, 181, 15, 8, 10, 25, 50, 18, 8],
  ["Haveri", 14, 24, 11, 0, 2, 5, 44, 355, 11, 104, 43, 2, 102, 399, 44, 14, 27, 68, 82, 41, 25],
  ["Kalaburagi Dist", 28, 62, 17, 3, 10, 13, 86, 282, 51, 271, 65, 8, 134, 596, 43, 60, 47, 73, 20, 45, 21],
  ["Bidar", 14, 21, 15, 1, 7, 6, 52, 203, 24, 116, 51, 3, 68, 329, 36, 22, 39, 78, 32, 28, 15],
  ["Raichur", 32, 43, 12, 1, 4, 6, 32, 689, 26, 216, 52, 3, 93, 378, 33, 34, 34, 48, 35, 28, 18],
  ["Yadgir", 8, 23, 3, 0, 2, 3, 23, 179, 15, 96, 19, 0, 36, 220, 12, 24, 3, 10, 6, 15, 5],
  ["Koppal", 10, 13, 12, 0, 3, 5, 26, 112, 7, 72, 42, 3, 57, 206, 37, 13, 17, 26, 25, 35, 23],
  ["Ballari", 22, 51, 7, 2, 5, 6, 42, 302, 31, 165, 32, 3, 154, 522, 33, 41, 34, 35, 112, 33, 22],
  ["Vijayanagara", 19, 59, 8, 0, 3, 5, 31, 137, 11, 79, 22, 1, 85, 268, 30, 11, 20, 23, 54, 24, 17],
  ["Kolar", 27, 29, 18, 0, 5, 5, 51, 134, 8, 116, 85, 6, 128, 576, 74, 17, 42, 121, 62, 65, 35],
  ["Chickballapura", 13, 17, 15, 0, 1, 7, 44, 117, 6, 114, 73, 3, 99, 444, 41, 13, 35, 109, 194, 58, 43],
];

export const yearlyDistrictData: YearlyDistrictRow[] = rawYearlyDistricts.map(
  ([district, ...nums]) => {
    const [murder, attemptToMurder, rape, dacoity, robbery, burglaryDay, burglaryNight, theft, riots, casesOfHurt, crueltyByHusband, dowryDeaths, fatalAccidents, nonFatalAccidents, molestation, scst, gambling, dpAct, cyberCrime, pocso, pocsoRape] = nums as number[];
    return {
      district: district as string, murder, attemptToMurder, rape, dacoity, robbery,
      burglaryDay, burglaryNight, theft, riots, casesOfHurt, crueltyByHusband,
      dowryDeaths, fatalAccidents, nonFatalAccidents, molestation, scst,
      gambling, dpAct, cyberCrime, pocso, pocsoRape,
    };
  }
);

// ─── Emerging Crime Cluster Alerts ──────────────────────────────────

function buildAlerts(): ClusterAlert[] {
  const totals = monthlyTrends.filter(
    (r) =>
      r.category.startsWith("Total") ||
      !rawMonthly.some(
        ([head, cat]) => head === r.crimeHead && cat.startsWith("Total") && cat !== r.category
      )
  );

  return totals
    .map((r) => {
      const abs = Math.abs(r.momChange);
      const direction: ClusterAlert["direction"] = r.momChange >= 0 ? "surge" : "drop";
      const severity: ClusterAlert["severity"] =
        abs > 40 ? "critical" : abs > 15 ? "high" : abs > 5 ? "moderate" : "low";

      let insight: string;
      if (direction === "surge") {
        insight = `${r.category} surged from ${r.dec2025.toLocaleString()} to ${r.jan2026.toLocaleString()} cases (+${r.momChange}% MoM). Immediate attention required.`;
      } else {
        insight = `${r.category} declined from ${r.dec2025.toLocaleString()} to ${r.jan2026.toLocaleString()} cases (${r.momChange}% MoM). Positive trend continues.`;
      }

      return {
        id: r.crimeHead + "-" + r.category,
        crimeHead: r.crimeHead,
        severity,
        direction,
        prevValue: r.dec2025,
        currentValue: r.jan2026,
        changePercent: r.momChange,
        insight,
      };
    })
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
}

export const clusterAlerts: ClusterAlert[] = buildAlerts();

// ─── Crime Category Groups (for radar/composition chart) ────────────

export const availableCompositionYears = [2021, 2022, 2023, 2024, 2025, 2026] as const;
export type CompositionYear = typeof availableCompositionYears[number];

export const crimeCompositionByYear: Record<CompositionYear, CrimeCategoryGroup[]> = {
  2021: [
    {
      name: "Violent Crime",
      color: "#f43f5e",
      total: 0,
      crimes: [
        { name: "Murder", value: 1490 },
        { name: "Dacoity", value: 95 },
        { name: "Robbery", value: 1980 },
        { name: "Riots", value: 3450 },
        { name: "Cases of Hurt", value: 10785 },
      ],
    },
    {
      name: "Property Crime",
      color: "#f59e0b",
      total: 0,
      crimes: [
        { name: "Burglary", value: 8450 },
        { name: "Theft", value: 24100 },
        { name: "MV Theft", value: 6150 },
        { name: "Cheating", value: 2500 },
      ],
    },
    {
      name: "Cyber Crime",
      color: "#3b82f6",
      total: 0,
      crimes: [
        { name: "Cyber Crimes", value: 11200 },
      ],
    },
    {
      name: "Social Crime",
      color: "#c084fc",
      total: 0,
      crimes: [
        { name: "Rape", value: 1150 },
        { name: "Dowry Death", value: 210 },
        { name: "POCSO", value: 4210 },
        { name: "SC/ST POA", value: 2830 },
      ],
    },
    {
      name: "Narcotics",
      color: "#10b981",
      total: 0,
      crimes: [
        { name: "NDPS Cases", value: 14500 },
      ],
    },
    {
      name: "Preventive",
      color: "#0ea5e9",
      total: 0,
      crimes: [
        { name: "Security Cases", value: 28900 },
      ],
    },
  ],
  2022: [
    {
      name: "Violent Crime",
      color: "#f43f5e",
      total: 0,
      crimes: [
        { name: "Murder", value: 1475 },
        { name: "Dacoity", value: 110 },
        { name: "Robbery", value: 2160 },
        { name: "Riots", value: 3655 },
        { name: "Cases of Hurt", value: 11200 },
      ],
    },
    {
      name: "Property Crime",
      color: "#f59e0b",
      total: 0,
      crimes: [
        { name: "Burglary", value: 8900 },
        { name: "Theft", value: 25950 },
        { name: "MV Theft", value: 6750 },
        { name: "Cheating", value: 2900 },
      ],
    },
    {
      name: "Cyber Crime",
      color: "#3b82f6",
      total: 0,
      crimes: [
        { name: "Cyber Crimes", value: 13400 },
      ],
    },
    {
      name: "Social Crime",
      color: "#c084fc",
      total: 0,
      crimes: [
        { name: "Rape", value: 1210 },
        { name: "Dowry Death", value: 225 },
        { name: "POCSO", value: 4450 },
        { name: "SC/ST POA", value: 3015 },
      ],
    },
    {
      name: "Narcotics",
      color: "#10b981",
      total: 0,
      crimes: [
        { name: "NDPS Cases", value: 16800 },
      ],
    },
    {
      name: "Preventive",
      color: "#0ea5e9",
      total: 0,
      crimes: [
        { name: "Security Cases", value: 31200 },
      ],
    },
  ],
  2023: [
    {
      name: "Violent Crime",
      color: "#f43f5e",
      total: 0,
      crimes: [
        { name: "Murder", value: 1460 },
        { name: "Dacoity", value: 125 },
        { name: "Robbery", value: 2340 },
        { name: "Riots", value: 3820 },
        { name: "Cases of Hurt", value: 11655 },
      ],
    },
    {
      name: "Property Crime",
      color: "#f59e0b",
      total: 0,
      crimes: [
        { name: "Burglary", value: 9400 },
        { name: "Theft", value: 27800 },
        { name: "MV Theft", value: 7450 },
        { name: "Cheating", value: 3450 },
      ],
    },
    {
      name: "Cyber Crime",
      color: "#3b82f6",
      total: 0,
      crimes: [
        { name: "Cyber Crimes", value: 15600 },
      ],
    },
    {
      name: "Social Crime",
      color: "#c084fc",
      total: 0,
      crimes: [
        { name: "Rape", value: 1280 },
        { name: "Dowry Death", value: 240 },
        { name: "POCSO", value: 4680 },
        { name: "SC/ST POA", value: 3100 },
      ],
    },
    {
      name: "Narcotics",
      color: "#10b981",
      total: 0,
      crimes: [
        { name: "NDPS Cases", value: 18900 },
      ],
    },
    {
      name: "Preventive",
      color: "#0ea5e9",
      total: 0,
      crimes: [
        { name: "Security Cases", value: 33500 },
      ],
    },
  ],
  2024: [
    {
      name: "Violent Crime",
      color: "#f43f5e",
      total: 0,
      crimes: [
        { name: "Murder", value: 1445 },
        { name: "Dacoity", value: 138 },
        { name: "Robbery", value: 2450 },
        { name: "Riots", value: 3950 },
        { name: "Cases of Hurt", value: 11867 },
      ],
    },
    {
      name: "Property Crime",
      color: "#f59e0b",
      total: 0,
      crimes: [
        { name: "Burglary", value: 9890 },
        { name: "Theft", value: 28456 },
        { name: "MV Theft", value: 8354 },
        { name: "Cheating", value: 4500 },
      ],
    },
    {
      name: "Cyber Crime",
      color: "#3b82f6",
      total: 0,
      crimes: [
        { name: "Cyber Crimes", value: 18230 },
      ],
    },
    {
      name: "Social Crime",
      color: "#c084fc",
      total: 0,
      crimes: [
        { name: "Rape", value: 1340 },
        { name: "Dowry Death", value: 255 },
        { name: "POCSO", value: 4955 },
        { name: "SC/ST POA", value: 3300 },
      ],
    },
    {
      name: "Narcotics",
      color: "#10b981",
      total: 0,
      crimes: [
        { name: "NDPS Cases", value: 21400 },
      ],
    },
    {
      name: "Preventive",
      color: "#0ea5e9",
      total: 0,
      crimes: [
        { name: "Security Cases", value: 35600 },
      ],
    },
  ],
  2025: [
    {
      name: "Violent Crime",
      color: "#f43f5e",
      total: 0,
      crimes: [
        { name: "Murder", value: 1412 },
        { name: "Dacoity", value: 145 },
        { name: "Robbery", value: 2580 },
        { name: "Riots", value: 4100 },
        { name: "Cases of Hurt", value: 11943 },
      ],
    },
    {
      name: "Property Crime",
      color: "#f59e0b",
      total: 0,
      crimes: [
        { name: "Burglary", value: 10410 },
        { name: "Theft", value: 29840 },
        { name: "MV Theft", value: 8950 },
        { name: "Cheating", value: 5100 },
      ],
    },
    {
      name: "Cyber Crime",
      color: "#3b82f6",
      total: 0,
      crimes: [
        { name: "Cyber Crimes", value: 21450 },
      ],
    },
    {
      name: "Social Crime",
      color: "#c084fc",
      total: 0,
      crimes: [
        { name: "Rape", value: 1410 },
        { name: "Dowry Death", value: 268 },
        { name: "POCSO", value: 5242 },
        { name: "SC/ST POA", value: 3500 },
      ],
    },
    {
      name: "Narcotics",
      color: "#10b981",
      total: 0,
      crimes: [
        { name: "NDPS Cases", value: 24100 },
      ],
    },
    {
      name: "Preventive",
      color: "#0ea5e9",
      total: 0,
      crimes: [
        { name: "Security Cases", value: 37800 },
      ],
    },
  ],
  2026: [
    {
      name: "Violent Crime",
      color: "#f43f5e",
      total: 0,
      crimes: [
        { name: "Murder", value: 98 },
        { name: "Dacoity", value: 6 },
        { name: "Robbery", value: 92 },
        { name: "Riots", value: 319 },
        { name: "Cases of Hurt", value: 1437 },
      ],
    },
    {
      name: "Property Crime",
      color: "#f59e0b",
      total: 0,
      crimes: [
        { name: "Burglary", value: 441 },
        { name: "Theft", value: 1742 },
        { name: "MV Theft", value: 767 },
        { name: "Cheating", value: 470 },
      ],
    },
    {
      name: "Cyber Crime",
      color: "#3b82f6",
      total: 0,
      crimes: [
        { name: "Cyber Crimes", value: 1259 },
      ],
    },
    {
      name: "Social Crime",
      color: "#c084fc",
      total: 0,
      crimes: [
        { name: "Rape", value: 45 },
        { name: "Dowry Death", value: 11 },
        { name: "POCSO", value: 316 },
        { name: "SC/ST POA", value: 223 },
      ],
    },
    {
      name: "Narcotics",
      color: "#10b981",
      total: 0,
      crimes: [
        { name: "NDPS Cases", value: 1397 },
      ],
    },
    {
      name: "Preventive",
      color: "#0ea5e9",
      total: 0,
      crimes: [
        { name: "Security Cases", value: 2330 },
      ],
    },
  ],
};

// Compute totals across all years
Object.values(crimeCompositionByYear).forEach((groupList) => {
  groupList.forEach((g) => {
    g.total = g.crimes.reduce((sum, c) => sum + c.value, 0);
  });
});

export const crimeCategoryGroups: CrimeCategoryGroup[] = crimeCompositionByYear[2026];

// ─── Helper: Top N surging alerts ───────────────────────────────────

export function getTopSurges(n: number = 3): ClusterAlert[] {
  return clusterAlerts.filter((a) => a.direction === "surge").slice(0, n);
}

export function getTopDrops(n: number = 3): ClusterAlert[] {
  return clusterAlerts.filter((a) => a.direction === "drop").slice(0, n);
}

// ─── Helper: District risk tier ─────────────────────────────────────

export type DistrictRisk = "Critical" | "High" | "Moderate" | "Safe";

export function getDistrictRisk(total: number): DistrictRisk {
  if (total > 1500) return "Critical";
  if (total > 500) return "High";
  if (total > 200) return "Moderate";
  return "Safe";
}
