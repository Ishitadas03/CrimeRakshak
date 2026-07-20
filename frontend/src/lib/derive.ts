// CrimeScope AI 2.0 — Derived Value Helpers
// Aggregation and analysis functions over the crime dataset.
// Components never import crimeData directly — they go through these helpers.

import {
  districts,
  ipcCrimes,
  monthlyComparison,
  stateTotals,
  type District,
  type IpcCrimeCategory,
} from "@/data/crimeData";
import type { RiskTier } from "@/lib/design-tokens";

/**
 * Get risk tier for a district based on total crime count.
 */
export function getRiskTier(district: District): RiskTier {
  const total = district.ipc + district.sll;
  if (total >= 9000) return "Critical";
  if (total >= 5200) return "High";
  if (total >= 3800) return "Moderate";
  return "Safe";
}

/**
 * Get risk score (0-100) for a district.
 */
export function getRiskScore(district: District, sourceList: District[] = districts): number {
  const total = district.ipc + district.sll;
  const maxTotal = Math.max(...sourceList.map((d) => d.ipc + d.sll));
  return Math.round((total / (maxTotal || 1)) * 100);
}

/**
 * Get top N districts sorted by a key (ipc, sll, or total).
 */
export function getTopDistricts(
  n: number,
  key: "ipc" | "sll" | "total" = "total",
  sourceList: District[] = districts
): District[] {
  return [...sourceList]
    .sort((a, b) => {
      const aVal = key === "total" ? a.ipc + a.sll : a[key];
      const bVal = key === "total" ? b.ipc + b.sll : b[key];
      return bVal - aVal;
    })
    .slice(0, n);
}

/**
 * Get safest N districts.
 */
export function getSafestDistricts(n: number, sourceList: District[] = districts): District[] {
  return [...sourceList]
    .sort((a, b) => a.ipc + a.sll - (b.ipc + b.sll))
    .slice(0, n);
}

/**
 * Get districts filtered by police range.
 */
export function getDistrictsByRange(range: string): District[] {
  return districts.filter((d) => d.range === range);
}

/**
 * Get all unique police ranges.
 */
export function getRanges(): string[] {
  return [...new Set(districts.map((d) => d.range))];
}

/**
 * Get category's share of total IPC crime.
 */
export function getCategoryShare(category: IpcCrimeCategory): number {
  const totalIpc = ipcCrimes.reduce((sum, c) => sum + c.total, 0);
  return Math.round((category.total / totalIpc) * 10000) / 100;
}

/**
 * Get month-over-month change percentage for a crime category.
 */
export function getMonthOverMonthChange(crime: string): number {
  const row = monthlyComparison.find((r) => r.crime === crime);
  if (!row || row.prevMonth === 0) return 0;
  return Math.round(((row.currentMonth - row.prevMonth) / row.prevMonth) * 10000) / 100;
}

/**
 * Get year-over-year change for a crime (current month vs same month prev year).
 */
export function getYearOverYearChange(crime: string): number {
  const row = monthlyComparison.find((r) => r.crime === crime);
  if (!row || row.prevYearMonth === 0) return 0;
  return Math.round(((row.currentMonth - row.prevYearMonth) / row.prevYearMonth) * 10000) / 100;
}

/**
 * Derive resolution rate (simulated).
 */
export function getResolutionRate(): number {
  return 68.4; // Statewide resolution rate %
}

/**
 * Get range crime totals for pie chart.
 */
export function getRangeTotals(): { range: string; total: number }[] {
  const rangeTotals: Record<string, number> = {};
  for (const d of districts) {
    rangeTotals[d.range] = (rangeTotals[d.range] || 0) + d.ipc + d.sll;
  }
  return Object.entries(rangeTotals)
    .map(([range, total]) => ({ range, total }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Get top surge alerts (highest month-over-month jumps).
 */
export function getSurgeAlerts(n: number = 5) {
  return monthlyComparison
    .map((row) => ({
      crime: row.crime,
      change: getMonthOverMonthChange(row.crime),
      currentMonth: row.currentMonth,
      prevMonth: row.prevMonth,
    }))
    .filter((a) => a.change > 0)
    .sort((a, b) => b.change - a.change)
    .slice(0, n);
}

/**
 * Computed KPI values for overview.
 */
export function getOverviewKPIs() {
  const totalCrimes = stateTotals.total;
  const ipcCount = stateTotals.ipc;
  const sllCount = stateTotals.sll;
  const resolutionRate = getResolutionRate();
  const ipcShare = Math.round((ipcCount / totalCrimes) * 100);
  const sllShare = 100 - ipcShare;

  return {
    totalCrimes,
    ipcCount,
    sllCount,
    resolutionRate,
    ipcShare,
    sllShare,
    districtCount: districts.length,
    yoyChange: -3.2, // Simulated year-over-year reduction
  };
}
