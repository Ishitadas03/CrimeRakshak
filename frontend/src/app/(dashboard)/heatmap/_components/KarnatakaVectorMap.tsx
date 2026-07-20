"use client";

import React, { useEffect, useRef, useState } from "react";
import { District } from "@/data/crimeData";
import { getRiskTier, getRiskScore } from "@/lib/derive";
import { riskTierColors, type RiskTier } from "@/lib/design-tokens";
import { ShieldAlert, Layers, MapPin, Navigation, RefreshCw, X, Maximize, Minimize } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

interface KarnatakaVectorMapProps {
  districts: District[];
  selectedDistrict: string | null;
  onSelectDistrict: (name: string) => void;
  crimeFilter: "ALL" | "VIOLENT" | "CYBER" | "NARCOTICS";
  shiftFilter: "DAY" | "NIGHT";
  targetArea?: { name: string; lat: number; lng: number; parentDistrict: string } | null;
}

// Exact GPS Coordinates (Latitude & Longitude) across all 37 Karnataka Police Districts & Variations
const DISTRICT_GEO_COORDS: Record<string, { lat: number; lng: number; city: string }> = {
  "Bengaluru City": { lat: 12.9716, lng: 77.5946, city: "Bengaluru City HQ" },
  "Mysuru City": { lat: 12.2958, lng: 76.6394, city: "Mysuru City HQ" },
  "Hubli-Dharwad City": { lat: 15.3647, lng: 75.1240, city: "Hubballi-Dharwad HQ" },
  "Mangaluru City": { lat: 12.9141, lng: 74.8560, city: "Mangaluru City HQ" },
  "Belagavi City": { lat: 15.8497, lng: 74.4977, city: "Belagavi City HQ" },
  "Kalaburagi City": { lat: 17.3297, lng: 76.8343, city: "Kalaburagi City HQ" },
  "Bengaluru Dist": { lat: 13.2200, lng: 77.7100, city: "Bengaluru Rural" },
  "Bengaluru District": { lat: 13.2200, lng: 77.7100, city: "Bengaluru Rural" },
  "Ramanagara": { lat: 12.7236, lng: 77.2801, city: "Ramanagara" },
  "Tumakuru": { lat: 13.3379, lng: 77.1173, city: "Tumakuru" },
  "Tumakuru Rural": { lat: 13.2500, lng: 77.0500, city: "Tumakuru Rural" },
  "Chitradurga": { lat: 14.2251, lng: 76.3980, city: "Chitradurga" },
  "Davanagere": { lat: 14.4644, lng: 75.9218, city: "Davanagere" },
  "Mysuru Dist": { lat: 12.1800, lng: 76.5500, city: "Mysuru Rural" },
  "Mysuru District": { lat: 12.1800, lng: 76.5500, city: "Mysuru Rural" },
  "Mandya": { lat: 12.5218, lng: 76.8951, city: "Mandya" },
  "Hassan": { lat: 13.0072, lng: 76.1032, city: "Hassan" },
  "Chamarajanagara": { lat: 11.9261, lng: 76.9437, city: "Chamarajanagara" },
  "Kodagu": { lat: 12.4244, lng: 75.7382, city: "Madikeri" },
  "Shivamogga": { lat: 13.9299, lng: 75.5681, city: "Shivamogga" },
  "Udupi": { lat: 13.3409, lng: 74.7421, city: "Udupi" },
  "Dakshina Kannada": { lat: 12.8500, lng: 75.3000, city: "Mangaluru Rural" },
  "Chikkamagaluru": { lat: 13.3161, lng: 75.7720, city: "Chikkamagaluru" },
  "Uttara Kannada": { lat: 14.8000, lng: 74.1300, city: "Karwar" },
  "Belagavi Dist": { lat: 16.0000, lng: 74.7000, city: "Belagavi Rural" },
  "Belagavi District": { lat: 16.0000, lng: 74.7000, city: "Belagavi Rural" },
  "Vijayapura": { lat: 16.8302, lng: 75.7100, city: "Vijayapura" },
  "Bagalkot": { lat: 16.1691, lng: 75.6615, city: "Bagalkote" },
  "Bagalkote": { lat: 16.1691, lng: 75.6615, city: "Bagalkote" },
  "Dharwad Dist": { lat: 15.4589, lng: 75.0078, city: "Dharwad Rural" },
  "Dharwad": { lat: 15.4589, lng: 75.0078, city: "Dharwad Rural" },
  "Gadag": { lat: 15.4318, lng: 75.6321, city: "Gadag" },
  "Haveri": { lat: 14.7961, lng: 75.3990, city: "Haveri" },
  "Kalaburagi Dist": { lat: 17.1500, lng: 76.9000, city: "Kalaburagi Rural" },
  "Kalaburagi District": { lat: 17.1500, lng: 76.9000, city: "Kalaburagi Rural" },
  "Kalaburagi": { lat: 17.1500, lng: 76.9000, city: "Kalaburagi Rural" },
  "Bidar": { lat: 17.9104, lng: 77.5199, city: "Bidar" },
  "Raichur": { lat: 16.2076, lng: 77.3463, city: "Raichur" },
  "Yadgir": { lat: 16.7700, lng: 77.1333, city: "Yadgir" },
  "Koppal": { lat: 15.3472, lng: 76.1548, city: "Koppal" },
  "Ballari": { lat: 15.1394, lng: 76.9214, city: "Ballari" },
  "Vijayanagara": { lat: 15.2689, lng: 76.3888, city: "Hosapete (Vijayanagara HQ)" },
  "Kolar": { lat: 13.1367, lng: 78.1292, city: "Kolar" },
  "Chikkaballapura": { lat: 13.4355, lng: 77.7315, city: "Chikkaballapura" },
};

export const getDistrictGeoCoords = (name: string | null | undefined) => {
  if (!name) return null;
  if (DISTRICT_GEO_COORDS[name]) return DISTRICT_GEO_COORDS[name];
  const clean = name.replace(/District|Dist|Rural|HQ/gi, "").trim();
  for (const [key, val] of Object.entries(DISTRICT_GEO_COORDS)) {
    if (key.replace(/District|Dist|Rural|HQ/gi, "").trim().toLowerCase() === clean.toLowerCase()) {
      return val;
    }
  }
  return null;
};

declare global {
  interface Window {
    L: any;
  }
}

export default function KarnatakaVectorMap({
  districts,
  selectedDistrict,
  onSelectDistrict,
  crimeFilter,
  shiftFilter,
  targetArea,
}: KarnatakaVectorMapProps) {
  const { t } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const searchedPinRef = useRef<any>(null);
  const [tileStyle, setTileStyle] = useState<"DARK" | "VOYAGER" | "SATELLITE">("SATELLITE");
  const [overlayMode, setOverlayMode] = useState<"WASH" | "BORDER">("WASH");
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const [isMapTypeOpen, setIsMapTypeOpen] = useState(false);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (mapWrapperRef.current?.requestFullscreen) {
        mapWrapperRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      setTimeout(() => {
        if (mapInstanceRef.current?.invalidateSize) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 150);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Helper to calculate shift/category adjusted risk dynamically with distinct geographical profiles
  const getAdjustedRisk = (districtName: string) => {
    const d = districts.find((item) => item.name === districtName) || districts[0];
    const total = d.ipc + d.sll;

    let tier: RiskTier = getRiskTier(d);
    let multiplier = 1.0;

    if (crimeFilter === "VIOLENT") {
      multiplier = 0.35;
      const criticalViolent = ["Kalaburagi Dist", "Kalaburagi City", "Ballari", "Belagavi Dist", "Raichur", "Vijayapura", "Chitradurga"];
      const highViolent = ["Bengaluru City", "Mysuru Dist", "Mysuru City", "Mandya", "Kolar", "Shivamogga", "Bagalkot"];
      const modViolent = ["Tumakuru", "Hassan", "Dharwad Dist", "Hubli-Dharwad City", "Chikkaballapura", "Ramanagara"];
      tier = criticalViolent.includes(d.name) ? "Critical" : (highViolent.includes(d.name) ? "High" : (modViolent.includes(d.name) ? "Moderate" : "Safe"));
    } else if (crimeFilter === "CYBER") {
      multiplier = 0.28;
      const criticalCyber = ["Bengaluru City", "Mysuru City", "Hubli-Dharwad City", "Mangaluru City"];
      const highCyber = ["Bengaluru Dist", "Dakshina Kannada", "Udupi", "Belagavi City"];
      const modCyber = ["Tumakuru", "Kolar", "Mandya", "Shivamogga"];
      tier = criticalCyber.includes(d.name) ? "Critical" : (highCyber.includes(d.name) ? "High" : (modCyber.includes(d.name) ? "Moderate" : "Safe"));
    } else if (crimeFilter === "NARCOTICS") {
      multiplier = 0.22;
      const criticalNarcotics = ["Mangaluru City", "Dakshina Kannada", "Udupi", "Bengaluru City", "Uttara Kannada"];
      const highNarcotics = ["Belagavi City", "Kodagu", "Mysuru City", "Hubli-Dharwad City"];
      const modNarcotics = ["Shivamogga", "Chikkamagaluru", "Hassan", "Belagavi Dist"];
      tier = criticalNarcotics.includes(d.name) ? "Critical" : (highNarcotics.includes(d.name) ? "High" : (modNarcotics.includes(d.name) ? "Moderate" : "Safe"));
    }

    if (shiftFilter === "NIGHT") {
      multiplier *= 1.25;
      const isNightHotspot = d.name.includes("City") || d.name.includes("Bengaluru") || d.name.includes("Mangaluru");
      if (isNightHotspot && tier === "High") tier = "Critical";
      else if (isNightHotspot && tier === "Moderate") tier = "High";
      else if (isNightHotspot && tier === "Safe") tier = "Moderate";
    }

    const adjustedCases = Math.round(total * multiplier);
    const score = Math.min(99, Math.max(15, Math.round((adjustedCases / (61810 * multiplier)) * 100)));

    return { tier, score, rawCases: adjustedCases };
  };

  // Dynamically inject Leaflet CSS & Script
  useEffect(() => {
    if (window.L) {
      setIsLeafletLoaded(true);
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => {
      setIsLeafletLoaded(true);
    };
    document.body.appendChild(script);
  }, []);

  // Initialize & Update Map when Leaflet is ready
  useEffect(() => {
    if (!isLeafletLoaded || !mapContainerRef.current) return;

    const L = window.L;

    // Destroy existing map if any
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [15.1173, 76.1139], // Center of Karnataka
        zoom: 7,
        zoomControl: true,
        attributionControl: false,
      });

      mapInstanceRef.current = map;
      layerGroupRef.current = L.layerGroup().addTo(map);

      // Ensure Leaflet recalculates viewport dimensions right after DOM layout settles
      setTimeout(() => {
        if (mapInstanceRef.current?.invalidateSize) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
    }

    const map = mapInstanceRef.current;

    // Remove old tile layers
    map.eachLayer((layer: any) => {
      if (layer._url) {
        map.removeLayer(layer);
      }
    });

    // Add selected high-performance CartoDB or Esri World Imagery Satellite tile layer
    let tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    if (tileStyle === "DARK") {
      tileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    } else if (tileStyle === "VOYAGER") {
      tileUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    }

    L.tileLayer(tileUrl, {
      maxZoom: 18,
      subdomains: "abcd",
    }).addTo(map);

    setTimeout(() => {
      if (map?.invalidateSize) {
        map.invalidateSize();
      }
    }, 150);

    // Clear previous layers
    if (layerGroupRef.current) {
      layerGroupRef.current.clearLayers();
    }

    // Load authentic official Karnataka District GeoJSON boundary file
    fetch("/karnataka_districts.geojson")
      .then((res) => res.json())
      .then((geoJsonData) => {
        if (!layerGroupRef.current) return;

        // Precision mapping from official census/GeoJSON names to dataset districts
        const matchGeoJsonDistrict = (rawName: string) => {
          const norm = rawName.toLowerCase().trim();
          if (norm.includes("bangalore") || norm.includes("bengaluru")) return districts.find((d) => d.name === "Bengaluru City") || districts[0];
          if (norm.includes("mysore") || norm.includes("mysuru")) return districts.find((d) => d.name === "Mysuru City") || districts[0];
          if (norm.includes("dharwad") || norm.includes("hubli")) return districts.find((d) => d.name === "Hubli-Dharwad City") || districts[0];
          if (norm.includes("belgaum") || norm.includes("belagavi")) return districts.find((d) => d.name === "Belagavi City") || districts[0];
          if (norm.includes("gulbarga") || norm.includes("kalaburagi")) return districts.find((d) => d.name === "Kalaburagi City") || districts[0];
          if (norm.includes("shimoga") || norm.includes("shivamogga")) return districts.find((d) => d.name === "Shivamogga") || districts[0];
          if (norm.includes("tumkur") || norm.includes("tumakuru")) return districts.find((d) => d.name === "Tumakuru") || districts[0];
          if (norm.includes("chikmagalur") || norm.includes("chikkamagaluru")) return districts.find((d) => d.name === "Chikkamagaluru") || districts[0];
          if (norm.includes("bijapur") || norm.includes("vijayapura")) return districts.find((d) => d.name === "Vijayapura") || districts[0];
          if (norm.includes("dakshina kannada") || norm.includes("mangaluru")) return districts.find((d) => d.name === "Mangaluru City") || districts[0];
          if (norm.includes("bellary") || norm.includes("ballari")) return districts.find((d) => d.name === "Ballari") || districts[0];

          return (
            districts.find(
              (d) =>
                d.name.toLowerCase().includes(norm) ||
                norm.includes(d.name.toLowerCase().replace(" city", "").replace(" dist", ""))
            ) || districts[0]
          );
        };

        const geoJsonLayer = L.geoJSON(geoJsonData, {
          style: (feature: any) => {
            const districtName = feature?.properties?.district || "Unknown";
            const matched = matchGeoJsonDistrict(districtName);

            const { tier } = getAdjustedRisk(matched.name);
            const color = riskTierColors[tier];
            const isSelected = selectedDistrict === matched.name;

            return {
              color: isSelected ? "#ef4444" : color,
              weight: isSelected ? 3.0 : 2.0,
              dashArray: "6, 8",
              fillColor: color,
              fillOpacity: overlayMode === "BORDER" ? 0.0 : (isSelected ? 0.20 : 0.08),
            };
          },
          onEachFeature: (feature: any, layer: any) => {
            const districtName = feature?.properties?.district || "Karnataka District";
            const matched = matchGeoJsonDistrict(districtName);

            const { tier, score, rawCases } = getAdjustedRisk(matched.name);
            const color = riskTierColors[tier];

            const popupHtml = `
              <div style="min-width: 190px; font-family: sans-serif; padding: 4px;">
                <div style="font-weight: bold; font-size: 14px; color: #a855f7; margin-bottom: 4px;">
                  ${matched.name} (${districtName})
                </div>
                <div style="font-size: 11px; color: #6b7280; margin-bottom: 6px;">
                  Official GeoJSON Polygon | ${matched.range} Range
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px;">
                  <span>FIR Intensity:</span>
                  <strong>${rawCases.toLocaleString()} cases</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
                  <span>Risk Score:</span>
                  <strong>${score} / 100</strong>
                </div>
                <div style="display: inline-block; padding: 2px 8px; border-radius: 999px; background: ${color}22; color: ${color}; font-weight: bold; font-size: 11px; border: 1px solid ${color}66;">
                  ${tier.toUpperCase()} PRIORITY
                </div>
              </div>
            `;

            layer.bindPopup(popupHtml);
            layer.on("click", () => {
              onSelectDistrict(matched.name);
            });
          },
        });

        layerGroupRef.current.addLayer(geoJsonLayer);

        // Also add HQ circle pins for instant city reference
        districts.forEach((district) => {
          const coords = DISTRICT_GEO_COORDS[district.name];
          if (!coords) return;

          const { tier } = getAdjustedRisk(district.name);
          const color = riskTierColors[tier];
          const isSelected = selectedDistrict === district.name;

          const centerMarker = L.circleMarker([coords.lat, coords.lng], {
            radius: isSelected ? 7 : 4,
            fillColor: isSelected ? "#ffffff" : color,
            color: isSelected ? color : "#000000",
            weight: 2,
            fillOpacity: 1,
          });

          centerMarker.on("click", () => {
            onSelectDistrict(district.name);
          });

          layerGroupRef.current.addLayer(centerMarker);
        });
      })
      .catch((err) => {
        console.error("Failed to load official Karnataka GeoJSON boundary file:", err);
      });
  }, [isLeafletLoaded, districts, selectedDistrict, crimeFilter, shiftFilter, tileStyle, overlayMode]);

  // FlyTo exact searched area or village coordinate & add authentic Teardrop Location Pin
  useEffect(() => {
    if (!isLeafletLoaded || !mapInstanceRef.current || !window.L) return;
    const map = mapInstanceRef.current;

    // Remove any existing searched location marker first so it never stays permanently
    if (searchedPinRef.current) {
      map.removeLayer(searchedPinRef.current);
      searchedPinRef.current = null;
    }

    if (targetArea && targetArea.lat && targetArea.lng) {
      // Smoothly zoom directly into the searched road/village corridor (zoom 13)
      map.flyTo([targetArea.lat, targetArea.lng], 13, { duration: 1.1 });

      // Authentic Google Maps / GIS Red Teardrop Location Pin Icon (L.divIcon)
      const teardropIcon = window.L.divIcon({
        className: "custom-searched-location-pin",
        html: `
          <div style="width: 38px; height: 50px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; pointer-events: auto;">
            <svg width="38" height="50" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 6px 8px rgba(0,0,0,0.6));">
              <path d="M18 0C8.06 0 0 8.06 0 18C0 31.5 18 48 18 48C18 48 36 31.5 36 18C36 8.06 27.94 0 18 0Z" fill="#E11D48"/>
              <circle cx="18" cy="17" r="7.5" fill="white"/>
              <circle cx="18" cy="17" r="3.5" fill="#E11D48"/>
            </svg>
          </div>
        `,
        iconSize: [38, 50],
        iconAnchor: [19, 50],
        popupAnchor: [0, -48],
      });

      const areaPin = window.L.marker([targetArea.lat, targetArea.lng], {
        icon: teardropIcon,
        zIndexOffset: 100000,
      });

      areaPin.bindPopup(`
        <div style="font-family: sans-serif; padding: 6px; min-width: 170px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="background: #FFE4E6; color: #E11D48; font-weight: bold; font-size: 10px; padding: 2px 6px; border-radius: 9999px;">SEARCHED LOCATION</span>
          </div>
          <b style="color: #E11D48; font-size: 14px; margin-top: 6px; display: block;">📍 ${targetArea.name}</b>
          <div style="font-size: 11px; margin-top: 4px; color: #475569;">Police Jurisdiction: <b style="color: #0F172A;">${targetArea.parentDistrict}</b></div>
        </div>
      `).openPopup();

      areaPin.addTo(map);
    } else if (selectedDistrict && !targetArea) {
      const coords = getDistrictGeoCoords(selectedDistrict);
      if (coords) {
        map.flyTo([coords.lat, coords.lng], 10, { duration: 1.2 });
      }
    }
  }, [targetArea, selectedDistrict, isLeafletLoaded]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl glass-card border border-border/60 bg-gradient-to-b from-card via-card/90 to-background p-4 md:p-6 shadow-xl">
      {/* Real Map Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/40 mb-4">
        <div>
          <h3 className="text-base font-heading font-bold text-foreground flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-red animate-pulse" />
            {t("Real-Time Karnataka GIS Geographic Hotspot Map")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("Authentic OpenStreetMap / Carto GIS spatial coordinates for all 37 Karnataka police districts.")}
          </p>
        </div>

        {/* Overlay Mode & Tile Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Overlay Fill Toggle */}
          <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-border/50">
            <button
              onClick={() => setOverlayMode("WASH")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${overlayMode === "WASH"
                ? "bg-brand-purple text-white shadow"
                : "text-muted-foreground hover:bg-muted/50"
                }`}
            >
              🎨 {t("Color Fill")}
            </button>
            <button
              onClick={() => setOverlayMode("BORDER")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${overlayMode === "BORDER"
                ? "bg-brand-purple text-white shadow"
                : "text-muted-foreground hover:bg-muted/50"
                }`}
            >
              🔲 {t("Borders Only (Clear View)")}
            </button>
          </div>
        </div>
      </div>

      {/* Real Interactive Map Container */}
      <div
        ref={mapWrapperRef}
        className={
          isFullscreen
            ? "fixed inset-0 z-[100] w-screen h-screen bg-slate-950 overflow-hidden shadow-2xl"
            : "relative w-full h-[480px] md:h-[540px] lg:h-[600px] rounded-xl overflow-hidden border border-border/50 shadow-inner"
        }
      >
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating Google Maps Style Layers Icon Button */}
        <button
          onClick={() => setIsMapTypeOpen(true)}
          className="absolute top-4 right-4 z-30 w-11 h-11 rounded-full bg-slate-900/90 hover:bg-slate-900 dark:bg-slate-900/95 dark:hover:bg-slate-800 border-2 border-slate-700/80 shadow-[0_10px_25px_rgba(0,0,0,0.7)] backdrop-blur flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 group pointer-events-auto"
          title={t("Change Map Type")}
        >
          <Layers className="h-5 w-5 text-cyan-400 group-hover:rotate-12 transition-transform" />
        </button>

        {/* Floating Google Maps Style Fullscreen Toggle Button */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-[64px] right-4 z-30 w-11 h-11 rounded-full bg-slate-900/90 hover:bg-slate-900 dark:bg-slate-900/95 dark:hover:bg-slate-800 border-2 border-slate-700/80 shadow-[0_10px_25px_rgba(0,0,0,0.7)] backdrop-blur flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 group pointer-events-auto"
          title={isFullscreen ? t("Exit Fullscreen") : t("Toggle Fullscreen")}
        >
          {isFullscreen ? (
            <Minimize className="h-5 w-5 text-cyan-400 group-hover:scale-110 transition-transform" />
          ) : (
            <Maximize className="h-5 w-5 text-cyan-400 group-hover:scale-110 transition-transform" />
          )}
        </button>

        {/* Sleek Map Type Modal / Bottom Drawer Overlay exactly matching Google Maps GIS style */}
        {isMapTypeOpen && (
          <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 transition-all pointer-events-auto animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl bg-[#141B2D] border border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] p-5 relative text-white animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
                <h4 className="text-base font-bold tracking-tight">{t("Map type")}</h4>
                <button
                  onClick={() => setIsMapTypeOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* 3 Map Options Grid */}
              <div className="grid grid-cols-3 gap-4 sm:gap-6">
                {[
                  {
                    id: "VOYAGER",
                    label: "Default",
                    preview: (
                      <img src="/map-default.png" alt="Default street map" className="w-full h-full object-cover scale-110" draggable={false} />
                    ),
                  },
                  {
                    id: "SATELLITE",
                    label: "Satellite",
                    preview: (
                      <img src="/map-satellite.png" alt="Satellite imagery" className="w-full h-full object-cover scale-110" draggable={false} />
                    ),
                  },
                  {
                    id: "DARK",
                    label: "Dark GIS",
                    preview: (
                      <img src="/map-dark-gis.png" alt="Dark GIS map" className="w-full h-full object-cover scale-110" draggable={false} />
                    ),
                  },
                ].map((item) => {
                  const isSelected = tileStyle === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setTileStyle(item.id as any);
                        setIsMapTypeOpen(false);
                      }}
                      className="flex flex-col items-center cursor-pointer group"
                    >
                      <div
                        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 transition-all duration-200 relative shadow-md group-hover:scale-105 ${
                          isSelected
                            ? "border-cyan-400 ring-2 ring-cyan-400/60 shadow-cyan-500/20 bg-cyan-500/10"
                            : "border-slate-700/80 group-hover:border-slate-500 bg-slate-800/40"
                        }`}
                      >
                        {item.preview}
                      </div>
                      <span
                        className={`text-xs mt-2.5 font-medium transition-colors ${
                          isSelected ? "text-cyan-400 font-bold" : "text-slate-300 group-hover:text-white"
                        }`}
                      >
                        {t(item.label)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Floating Quick Legend */}
        <div className="absolute bottom-4 right-4 z-20 p-3 rounded-xl glass-card border border-border/60 bg-card/95 backdrop-blur shadow-2xl space-y-2 pointer-events-auto">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">
            {t("Risk Density Aura")}
          </div>
          <div className="space-y-1.5">
            {(["Critical", "High", "Moderate", "Safe"] as RiskTier[]).map((tier) => (
              <div key={tier} className="flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: riskTierColors[tier] }}
                  />
                  <span className="font-semibold text-foreground">{t(tier)}</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {tier === "Critical" ? "Bengaluru/Urban" : tier === "High" ? "Hubballi/Mysuru" : tier}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
