export interface DistrictSocioProfile {
  name: string;
  category: "Urban Tech Hub" | "Industrial Belt" | "Rural / Agrarian" | "Coastal / Tourism";
  urbanizationRate: number; // percentage 0-100
  populationDensity: number; // per sq km
  womenCrimeRate: number; // per 100k
  childCrimeRate: number; // per 100k
  scstCrimeRate: number; // per 100k
  cotpaEnforcementIndex: number; // public health regulatory enforcement 0-100
  dominantSocialFactor: string;
  riskScore: number; // 0-100
}

export interface SocioCategoryDetail {
  category: "Women" | "Children" | "SC / ST Protection" | "Public Health & Road Safety";
  totalCases: number;
  yoyChangePct: number;
  keyDrivers: string[];
  hotspotDistricts: string[];
  subCategories: {
    name: string;
    cases: number;
    sharePct: number;
    sociologicalContext: string;
  }[];
}

export interface SocialIndicatorCorrelation {
  indicator: string;
  correlationCoefficient: number; // -1 to 1
  impactLevel: "High Positive" | "Moderate Positive" | "Inverse / Protective";
  description: string;
}

// District Socio-Geographic Comparison
export const districtSocioProfiles: DistrictSocioProfile[] = [
  {
    name: "Bengaluru City",
    category: "Urban Tech Hub",
    urbanizationRate: 94,
    populationDensity: 4381,
    womenCrimeRate: 84.2,
    childCrimeRate: 42.1,
    scstCrimeRate: 18.5,
    cotpaEnforcementIndex: 88,
    dominantSocialFactor: "High migration stress, digital anonymity, night-time work economy",
    riskScore: 78,
  },
  {
    name: "Mysuru City",
    category: "Urban Tech Hub",
    urbanizationRate: 72,
    populationDensity: 1240,
    womenCrimeRate: 52.4,
    childCrimeRate: 28.3,
    scstCrimeRate: 24.1,
    cotpaEnforcementIndex: 76,
    dominantSocialFactor: "Expanding educational & hospitality corridors",
    riskScore: 54,
  },
  {
    name: "Mangaluru City",
    category: "Coastal / Tourism",
    urbanizationRate: 68,
    populationDensity: 1120,
    womenCrimeRate: 48.1,
    childCrimeRate: 22.8,
    scstCrimeRate: 19.3,
    cotpaEnforcementIndex: 82,
    dominantSocialFactor: "Port commerce, tourism footfall, youth student centers",
    riskScore: 49,
  },
  {
    name: "Ballari",
    category: "Industrial Belt",
    urbanizationRate: 45,
    populationDensity: 368,
    womenCrimeRate: 64.8,
    childCrimeRate: 36.5,
    scstCrimeRate: 58.2,
    cotpaEnforcementIndex: 54,
    dominantSocialFactor: "Industrial labor concentration, seasonal migrant labor camps",
    riskScore: 72,
  },
  {
    name: "Belagavi City",
    category: "Industrial Belt",
    urbanizationRate: 52,
    populationDensity: 614,
    womenCrimeRate: 58.2,
    childCrimeRate: 31.4,
    scstCrimeRate: 42.0,
    cotpaEnforcementIndex: 61,
    dominantSocialFactor: "Border trade hub, industrial manufacturing zones",
    riskScore: 63,
  },
  {
    name: "Mandya",
    category: "Rural / Agrarian",
    urbanizationRate: 22,
    populationDensity: 385,
    womenCrimeRate: 41.5,
    childCrimeRate: 19.2,
    scstCrimeRate: 48.7,
    cotpaEnforcementIndex: 46,
    dominantSocialFactor: "Agrarian land ownership disputes, traditional rural demographics",
    riskScore: 51,
  },
  {
    name: "Raichur",
    category: "Rural / Agrarian",
    urbanizationRate: 26,
    populationDensity: 232,
    womenCrimeRate: 44.9,
    childCrimeRate: 34.8,
    scstCrimeRate: 62.4,
    cotpaEnforcementIndex: 42,
    dominantSocialFactor: "Socio-economic vulnerability, seasonal agricultural out-migration",
    riskScore: 68,
  },
];

// Demographic Group Analysis with Granular Sociological Context
export const sociologicalDetails: SocioCategoryDetail[] = [
  {
    category: "Women",
    totalCases: 29883,
    yoyChangePct: +8.4,
    keyDrivers: [
      "Domestic financial stress & dowry demands",
      "Workplace commute exposure in expanding peri-urban zones",
      "Digital harassment & cyber stalking",
    ],
    hotspotDistricts: ["Bengaluru City", "Ballari", "Belagavi City"],
    subCategories: [
      {
        name: "Cruelty by Husband / Relatives (IPC 498A)",
        cases: 6543,
        sharePct: 21.9,
        sociologicalContext: "Linked to familial financial disputes and joint-family household strain",
      },
      {
        name: "Molestation / Outraging Modesty",
        cases: 6789,
        sharePct: 22.7,
        sociologicalContext: "Concentrated in public transit corridors & urban commercial hubs",
      },
      {
        name: "Kidnapping & Abduction of Women",
        cases: 2345,
        sharePct: 7.8,
        sociologicalContext: "Often linked to inter-caste elopement disputes and coercion",
      },
      {
        name: "Stalking & Cyber Harassment",
        cases: 2222,
        sharePct: 7.4,
        sociologicalContext: "Rapidly rising due to smartphone penetration and social media platforms",
      },
    ],
  },
  {
    category: "Children",
    totalCases: 9354,
    yoyChangePct: -12.1,
    keyDrivers: [
      "Unsupervised digital exposure",
      "Child labor in unorganized retail/industrial workshops",
      "Adolescent peer group vulnerability",
    ],
    hotspotDistricts: ["Bengaluru City", "Ballari", "Raichur"],
    subCategories: [
      {
        name: "POCSO Act Violations",
        cases: 3456,
        sharePct: 36.9,
        sociologicalContext: "Over 78% perpetrated by known acquaintances or family neighbors",
      },
      {
        name: "Juvenile Offences & Delinquency",
        cases: 2345,
        sharePct: 25.1,
        sociologicalContext: "Highly correlated with urban school dropouts and substance exposure",
      },
      {
        name: "Kidnapping & Missing Children",
        cases: 1876,
        sharePct: 20.1,
        sociologicalContext: "Higher incidence in migrant worker camps and crowded transit nodes",
      },
      {
        name: "Child Labour & Exploitation",
        cases: 876,
        sharePct: 9.4,
        sociologicalContext: "Prevalent in informal hospitality, brick kilns, and auto-repair hubs",
      },
    ],
  },
  {
    category: "SC / ST Protection",
    totalCases: 12478,
    yoyChangePct: +3.2,
    keyDrivers: [
      "Agricultural land border & easement right disputes",
      "Civic amenity access friction in developing villages",
      "Economic mobility tensions",
    ],
    hotspotDistricts: ["Raichur", "Ballari", "Mandya"],
    subCategories: [
      {
        name: "Atrocities on SC (PoA Act)",
        cases: 4567,
        sharePct: 36.6,
        sociologicalContext: "Predominantly rural land cultivation and tenancy conflicts",
      },
      {
        name: "Prevention of Atrocities Act Enforcement",
        cases: 3456,
        sharePct: 27.7,
        sociologicalContext: "Special cell intervention and statutory relief processing",
      },
      {
        name: "Atrocities on ST",
        cases: 2345,
        sharePct: 18.8,
        sociologicalContext: "Concentrated in forest belt fringe districts and mining zones",
      },
      {
        name: "Land & Civil Dispute Related Offences",
        cases: 876,
        sharePct: 7.0,
        sociologicalContext: "Arises from rapid conversion of agricultural lands near industrial belts",
      },
    ],
  },
];

// Social Indicators Correlation with Crime Rates
export const socialIndicatorCorrelations: SocialIndicatorCorrelation[] = [
  {
    indicator: "Urbanization & Population Density",
    correlationCoefficient: 0.82,
    impactLevel: "High Positive",
    description: "Strongly correlates with Property Crimes, Cyber Fraud, and Traffic Mortality.",
  },
  {
    indicator: "Industrial Migrant Labor Density",
    correlationCoefficient: 0.67,
    impactLevel: "Moderate Positive",
    description: "Correlates with NDPS illicit drug flow, public order offenses, and seasonal thefts.",
  },
  {
    indicator: "COTPA / Regulatory Enforcement Index",
    correlationCoefficient: -0.58,
    impactLevel: "Inverse / Protective",
    description: "Districts with rigorous public health & COTPA checks show lower street disturbance & petty assaults.",
  },
  {
    indicator: "Female Literacy & Employment Participation",
    correlationCoefficient: -0.64,
    impactLevel: "Inverse / Protective",
    description: "Higher literacy correlates with higher initial reporting rates but significantly lower long-term repeat victimization.",
  },
];
