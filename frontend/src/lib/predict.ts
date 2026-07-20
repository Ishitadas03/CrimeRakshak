// CrimeScope AI 2.0 — Simulated Prediction Engine
// Weighted historical average + seasonal multiplier + district factor.
// Clearly labeled as simulation — swap for real API later.

import { districts, ipcCrimes, monthlyComparison } from "@/data/crimeData";
import { getRiskScore } from "@/lib/derive";

export interface PredictionInput {
  district: string;
  crimeType: string;
  months: number;
  modelType: "LSTM" | "XGBoost" | "Prophet";
  includeEnvironmental?: boolean;
  includeEvents?: boolean;
}

export interface PredictionResult {
  riskScore: number;
  predictedCount: number;
  confidence: number;
  factors: {
    historical: number;
    environmental: number;
    district: number;
    trend: number;
    eventAnomaly?: number;
  };
  tier: "Low" | "Medium" | "High" | "Critical";
  forecastData: Array<{
    month: string;
    historical: number | null;
    predicted: number | null;
    lowerBound: number | null;
    upperBound: number | null;
  }>;
  resourceRecommendations: string[];
  hotspots: string[];
}

export function runPrediction(input: PredictionInput): PredictionResult {
  const district = districts.find((d) => d.name === input.district);
  const category = ipcCrimes.find((c) => c.category === input.crimeType);
  const monthly = monthlyComparison.find((m) => m.crime === input.crimeType);

  // Base count from category or fallback
  const baseCount = category ? category.total / 12 : 500;

  // District factor: risk score / 100
  const districtFactor = district ? getRiskScore(district) / 100 : 0.5;

  // Model-specific variance
  let modelConfidenceBase = 85;
  let modelSpread = 0.1;
  if (input.modelType === "LSTM") {
    modelConfidenceBase = 90;
    modelSpread = 0.08; // Tighter bounds
  } else if (input.modelType === "Prophet") {
    modelConfidenceBase = 82;
    modelSpread = 0.15; // Wider bounds
  }

  // Environmental multiplier (seasonal)
  const envMul = input.includeEnvironmental ? 1.0 + (Math.random() * 0.2 - 0.05) : 1.0;
  
  // Event Anomaly multiplier
  const anomalyMul = input.includeEvents ? 1.0 + (Math.random() * 0.3) : 1.0;

  // Trend factor from month-over-month
  const trendFactor = monthly
    ? monthly.currentMonth / Math.max(monthly.prevMonth, 1)
    : 1.0;

  // Predicted count (total for requested months)
  const predicted = Math.round(
    baseCount * districtFactor * envMul * trendFactor * anomalyMul * input.months
  );

  // Risk score (0-100)
  let riskBase = districtFactor * 40 + (trendFactor - 0.8) * 30 + envMul * 20;
  if (input.includeEvents) riskBase += 15;
  const riskScore = Math.min(100, Math.round(riskBase));

  // Confidence (simulated)
  let confidence = Math.round(modelConfidenceBase + Math.random() * 10 - 5);
  if (input.months > 3) confidence -= (input.months * 2); // drops with longer horizon
  if (input.includeEvents) confidence -= 5; // drops with anomalies

  const tier =
    riskScore > 75 ? "Critical" : riskScore > 50 ? "High" : riskScore > 25 ? "Medium" : "Low";
    
  // Generate historical data (last 6 months)
  const forecastData: PredictionResult["forecastData"] = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonthIdx = new Date().getMonth(); // 0-11
  
  // Last 6 months historical
  let lastHistValue = baseCount * districtFactor;
  for (let i = -5; i <= 0; i++) {
    const mIdx = (currentMonthIdx + i + 12) % 12;
    const noise = 1.0 + (Math.random() * 0.2 - 0.1);
    const val = Math.round(baseCount * districtFactor * noise);
    if (i === 0) lastHistValue = val;
    forecastData.push({ 
      month: monthNames[mIdx], 
      historical: val, 
      predicted: i === 0 ? val : null,
      lowerBound: i === 0 ? val : null,
      upperBound: i === 0 ? val : null
    });
  }
  
  // Future N months predicted
  let prevPred = lastHistValue;
  for (let i = 1; i <= input.months; i++) {
    const mIdx = (currentMonthIdx + i) % 12;
    const trendNoise = 1.0 + (Math.random() * 0.1 - 0.02); // slightly upward bias
    const sMul = input.includeEnvironmental ? 1.0 + (Math.sin(mIdx) * 0.1) : 1.0;
    const aMul = (input.includeEvents && Math.random() > 0.7) ? 1.4 : 1.0;
    
    const val = Math.round(prevPred * trendNoise * sMul * aMul);
    prevPred = val; // compound
    
    // Calculate confidence intervals based on horizon and model spread
    const uncertainty = (1 + (i * modelSpread)) * (100 - confidence) / 100;
    const lower = Math.max(0, Math.round(val * (1 - uncertainty)));
    const upper = Math.round(val * (1 + uncertainty));
    
    forecastData.push({ 
      month: monthNames[mIdx], 
      historical: null, 
      predicted: val,
      lowerBound: lower,
      upperBound: upper
    });
  }

  // Generate dynamic resource recommendations
  const resources = [];
  if (tier === "Critical" || tier === "High") {
    if (input.crimeType.toLowerCase().includes("cyber") || input.crimeType.toLowerCase().includes("fraud")) {
      resources.push("Deploy specialized cyber-crime rapid response unit");
      resources.push("Alert local bank nodal officers of impending volume spike");
      resources.push("Initiate public awareness SMS blast in targeted zip codes");
    } else if (input.crimeType.toLowerCase().includes("robbery") || input.crimeType.toLowerCase().includes("theft")) {
      resources.push("Increase night patrol frequency by +25% in predicted hotspots");
      resources.push("Deploy 4 additional Hoysala interceptor vehicles");
      resources.push("Activate community policing volunteer network (Neighborhood Watch)");
    } else {
      resources.push("Reallocate +15% reserve personnel to active duty");
      resources.push("Establish temporary tactical checkpoints");
      resources.push("Increase surveillance presence in designated high-risk zones");
    }
  } else {
    resources.push("Maintain standard patrol operating procedures");
    resources.push("Monitor daily variance logs for sudden escalations");
  }

  // Generate mock hotspots
  const potentialHotspots = [
    ["MG Road Commercial Zone", "Brigade Road Intersection", "Indiranagar 100ft Road"],
    ["KR Puram Railway Station", "Whitefield Tech Park Exit", "Marathahalli Bridge"],
    ["Jayanagar 4th Block", "JP Nagar Ring Road", "BTM Layout Stage 2"],
    ["Majestic Bus Stand Area", "Chickpet Market", "City Market Junction"],
    ["Electronic City Phase 1", "Silk Board Junction", "HSR Layout Sector 2"]
  ];
  // Pick one randomly for simulation
  const hotspots = potentialHotspots[Math.floor(Math.random() * potentialHotspots.length)];

  return {
    riskScore,
    predictedCount: predicted,
    confidence,
    factors: {
      historical: Math.round(baseCount),
      environmental: Math.round(envMul * 100) / 100,
      district: Math.round(districtFactor * 100) / 100,
      trend: Math.round(trendFactor * 100) / 100,
      ...(input.includeEvents ? { eventAnomaly: Math.round(anomalyMul * 100) / 100 } : {})
    },
    tier,
    forecastData,
    resourceRecommendations: resources,
    hotspots
  };
}
