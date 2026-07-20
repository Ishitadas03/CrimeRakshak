"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, MapPin, Navigation, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

interface HighwayCorridorRecord {
  corridor: string;
  districtsCovered: string;
  fatalAccidents: number;
  nonFatalAccidents: number;
  blackspotCount: number;
  primaryCause: string;
  recommendedIntervention: string;
  severity: "High Blackspot Risk" | "Moderate Risk" | "Controlled Corridor";
}

const highwayCorridors: HighwayCorridorRecord[] = [
  {
    corridor: "NH-275 (Bengaluru – Mysuru Expressway)",
    districtsCovered: "Bengaluru South, Ramanagara, Mandya, Mysuru",
    fatalAccidents: 312,
    nonFatalAccidents: 890,
    blackspotCount: 14,
    primaryCause: "High-speed lane changes & median collision",
    recommendedIntervention: "Automated ANPR Speed Cameras + 4x Highway Interceptors",
    severity: "High Blackspot Risk",
  },
  {
    corridor: "NH-48 (Bengaluru – Pune Corridor)",
    districtsCovered: "Bengaluru North, Tumakuru, Chitradurga, Davanagere, Dharwad, Belagavi",
    fatalAccidents: 445,
    nonFatalAccidents: 1210,
    blackspotCount: 22,
    primaryCause: "Heavy vehicle rear-end impact & illegal parking",
    recommendedIntervention: "Dedicated Heavy Commercial Truck Bays + Patrol Beats",
    severity: "High Blackspot Risk",
  },
  {
    corridor: "NH-66 (Mangaluru Coastal Highway)",
    districtsCovered: "Dakshina Kannada, Udupi, Uttara Kannada",
    fatalAccidents: 198,
    nonFatalAccidents: 540,
    blackspotCount: 9,
    primaryCause: "Monsoon hydroplaning & sharp blind curves",
    recommendedIntervention: "High-friction road surfacing + LED warning beacons",
    severity: "Moderate Risk",
  },
  {
    corridor: "SH-17 / SH-19 (Southern State Highways)",
    districtsCovered: "Hassan, Kodagu, Chikkamagaluru",
    fatalAccidents: 124,
    nonFatalAccidents: 410,
    blackspotCount: 6,
    primaryCause: "Ghat section overtaking & fog visibility",
    recommendedIntervention: "Reflective cat-eye delineation & speed calming tables",
    severity: "Controlled Corridor",
  },
];

export function AccidentClusterOverlay() {
  const { t } = useLanguage();
  const [activeCorridor, setActiveCorridor] = useState<HighwayCorridorRecord>(highwayCorridors[0]);

  return (
    <Card className="glass-card overflow-hidden border-border/50 shadow-lg">
      <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-brand-red/15 text-brand-red border border-brand-red/30">
                {t("SPATIAL ROAD SAFETY OVERLAY")}
              </span>
              <span className="text-xs text-muted-foreground">
                Grounded in KSP Highway Accident Telemetry (05_road_accidents_jan2026)
              </span>
            </div>
            <CardTitle className="text-lg font-heading mt-1 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-brand-red" />
                {t("Highway Corridor & Accident Blackspot Spatial Cluster Matrix")}
              </div>
              <span className="text-xs font-semibold text-brand-red bg-brand-red/10 px-2.5 py-1 rounded-full border border-brand-red/20 ml-auto">Jan 2026 Telemetry</span>
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 grid gap-6 lg:grid-cols-12 items-start">
        {/* Left: Corridor Selector List */}
        <div className="lg:col-span-7 space-y-3">
          {highwayCorridors.map((c) => {
            const isSelected = activeCorridor.corridor === c.corridor;
            return (
              <div
                key={c.corridor}
                onClick={() => setActiveCorridor(c)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-brand-red/10 border-brand-red/40 shadow-md"
                    : "bg-card/60 border-border/50 hover:bg-muted/20"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-heading font-bold text-sm text-foreground">
                        {t(c.corridor)}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          c.severity === "High Blackspot Risk"
                            ? "bg-brand-red/15 text-brand-red border border-brand-red/30"
                            : c.severity === "Moderate Risk"
                            ? "bg-brand-amber/15 text-brand-amber border border-brand-amber/30"
                            : "bg-brand-green/15 text-brand-green border border-brand-green/30"
                        }`}
                      >
                        {t(c.severity)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 inline mr-1 text-brand-red" />
                      {t(c.districtsCovered)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono font-bold text-foreground">
                      {c.blackspotCount} {t("Blackspots")}
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      {c.fatalAccidents} {t("Fatalities")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Active Corridor Intervention Profile */}
        <div className="lg:col-span-5 p-5 rounded-xl border border-brand-red/30 bg-brand-red/5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("Corridor Deployment Blueprint")}
            </h4>
            <span className="text-xs font-mono font-bold text-brand-red">
              {activeCorridor.blackspotCount} {t("Identified Blackspots")}
            </span>
          </div>

          <div>
            <span className="text-sm font-bold text-foreground block">
              {t(activeCorridor.corridor)}
            </span>
            <span className="text-xs text-muted-foreground block mt-0.5">
              {t(activeCorridor.districtsCovered)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-background/60 border border-border/40">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                {t("Fatal Accidents (2025 Annual)")}
              </span>
              <span className="text-xl font-mono font-bold text-brand-red mt-1 block">
                {activeCorridor.fatalAccidents}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-background/60 border border-border/40">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                {t("Non-Fatal Collisions (2025 Annual)")}
              </span>
              <span className="text-xl font-mono font-bold text-foreground mt-1 block">
                {activeCorridor.nonFatalAccidents}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg bg-background/60 border border-border/40">
              <span className="font-bold text-foreground block mb-0.5">
                {t("Primary Accident Root Cause:")}
              </span>
              <span className="text-muted-foreground">
                {t(activeCorridor.primaryCause)}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-brand-purple/10 border border-brand-purple/30">
              <span className="font-bold text-brand-purple block mb-0.5 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                {t("Recommended Traffic Engineering & Patrol Action:")}
              </span>
              <span className="text-foreground font-medium">
                {t(activeCorridor.recommendedIntervention)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
