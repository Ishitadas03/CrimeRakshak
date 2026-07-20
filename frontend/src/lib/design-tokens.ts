// CrimeScope AI 2.0 — Design Tokens
// Single source of truth for all brand colors, risk tiers, chart palettes.

export const brandColors = {
  purple: "#8b5cf6",  /* Soft Indigo */
  blue: "#3b82f6",    /* Ocean Blue */
  green: "#10b981",   /* Mint Green */
  amber: "#f59e0b",   /* Warm Amber */
  red: "#f43f5e",     /* Soft Rose/Coral */
  cyan: "#0ea5e9",    /* Sky Blue */
  violet: "#c084fc",  /* Light Violet */
  orange: "#fb923c",  /* Peach/Orange */
  teal: "#2dd4bf",    /* Soft Teal */
  lime: "#a3e635",    /* Soft Lime */
  rose: "#fb7185",    /* Light Rose */
  pink: "#f472b6",    /* Soft Pink */
  customRed: "#fb7185",
  customYellow: "#fcd34d",
} as const;

export const lightBrandColors = {
  purple: "#7c3aed",
  blue: "#2563eb",
} as const;

export const darkSurfaces = {
  bg: "#080b14",
  bgPanel: "#0d1117",
  bgCard: "#111827",
  bgCardHover: "#161f2e",
  bgSide: "#0a0e1a",
} as const;

export const lightSurfaces = {
  bg: "#f0f4f8",
  bgPanel: "#e8edf5",
  bgCard: "#ffffff",
  bgCardHover: "#f8fafc",
  bgSide: "#1e293b",
} as const;

export type RiskTier = "Safe" | "Moderate" | "High" | "Critical";

export const riskTierColors: Record<RiskTier, string> = {
  Safe: brandColors.green,
  Moderate: brandColors.amber,
  High: brandColors.orange,
  Critical: brandColors.red,
};

export const riskTierBg: Record<RiskTier, string> = {
  Safe: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Moderate: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  High: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  Critical: "bg-red-500/10 text-red-500 border-red-500/20",
};

export const chartPalette = [
  brandColors.teal,
  brandColors.cyan,
  brandColors.green,
  brandColors.blue,
  brandColors.lime,
  brandColors.amber,
  brandColors.purple,
  brandColors.violet,
  brandColors.orange,
  brandColors.rose,
  brandColors.pink,
  brandColors.red,
];

export const gradients = {
  primary: "linear-gradient(135deg, #a855f7, #3b82f6)",
  primaryLight: "linear-gradient(135deg, #7c3aed, #2563eb)",
  hero: "linear-gradient(135deg, #080b14 0%, #0f172a 50%, #1e1b4b 100%)",
} as const;
