"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, MapPin, X, Crosshair, AlertTriangle, ShieldCheck, ChevronRight, Globe, Loader2 } from "lucide-react";
import { districts } from "@/data/crimeData";
import { getRiskTier } from "@/lib/derive";
import { useLanguage } from "@/components/LanguageContext";

export interface GeoLocationTarget {
  name: string;
  lat: number;
  lng: number;
  parentDistrict: string;
  type: "DISTRICT" | "AREA" | "VILLAGE";
}

// Offline Karnataka Gazetteer of Sub-Areas, Highways, Roads, Towns, Villages & IT Corridors
const KARNATAKA_SUB_AREAS: GeoLocationTarget[] = [
  { name: "Hesaraghatta / Hessarghatta (North Bengaluru)", lat: 13.1381, lng: 77.4789, parentDistrict: "Bengaluru City", type: "AREA" },
  { name: "Bengaluru - Honnavara Road (NH 206 / NH 69 Highway Corridor)", lat: 13.3392, lng: 77.1017, parentDistrict: "Tumakuru", type: "AREA" },
  { name: "Honnavara Road Corridor (Tiptur - Huliyar Sector)", lat: 13.2580, lng: 76.4750, parentDistrict: "Tumakuru", type: "AREA" },
  { name: "Honnavar Coastal Town & Port (NH 66)", lat: 14.2811, lng: 74.4443, parentDistrict: "Uttara Kannada", type: "VILLAGE" },
  { name: "Bengaluru - Mysuru Expressway (NH 275 Corridor)", lat: 12.5218, lng: 76.8951, parentDistrict: "Mandya", type: "AREA" },
  { name: "Hosur Road / Electronic City Highway (NH 44)", lat: 12.8452, lng: 77.6602, parentDistrict: "Bengaluru City", type: "AREA" },
  { name: "Tumakuru Road / Pune Highway (NH 48)", lat: 13.0450, lng: 77.5250, parentDistrict: "Bengaluru Dist", type: "AREA" },
  { name: "Old Madras Road (NH 75 Expressway)", lat: 13.0125, lng: 77.6780, parentDistrict: "Bengaluru City", type: "AREA" },
  { name: "Bellary Road / Airport Highway (NH 44)", lat: 13.1500, lng: 77.5950, parentDistrict: "Bengaluru City", type: "AREA" },
  { name: "Magadi Road Highway Corridor (SH 85)", lat: 12.9780, lng: 77.5500, parentDistrict: "Ramanagara", type: "AREA" },
  { name: "Sarjapur Road IT Corridor", lat: 12.9100, lng: 77.6850, parentDistrict: "Bengaluru City", type: "AREA" },
  { name: "Bannerghatta Road Corridor", lat: 12.8900, lng: 77.5980, parentDistrict: "Bengaluru City", type: "AREA" },
  { name: "Kanakapura Road Highway (NH 948)", lat: 12.8300, lng: 77.5400, parentDistrict: "Ramanagara", type: "AREA" },
  { name: "Mangaluru - Udupi Coastal Highway (NH 66)", lat: 13.3409, lng: 74.7421, parentDistrict: "Udupi", type: "AREA" },
  { name: "Boppalapura Village", lat: 13.2540, lng: 76.4210, parentDistrict: "Tumakuru", type: "VILLAGE" },
  { name: "Whitefield IT Corridor", lat: 12.9698, lng: 77.7500, parentDistrict: "Bengaluru City", type: "AREA" },
  { name: "Koramangala Police Station", lat: 12.9352, lng: 77.6245, parentDistrict: "Bengaluru City", type: "AREA" },
  { name: "Indiranagar 100ft Road", lat: 12.9784, lng: 77.6408, parentDistrict: "Bengaluru City", type: "AREA" },
  { name: "Jayanagar 4th Block", lat: 12.9250, lng: 77.5838, parentDistrict: "Bengaluru City", type: "AREA" },
  { name: "Electronic City Phase 1", lat: 12.8452, lng: 77.6602, parentDistrict: "Bengaluru City", type: "AREA" },
  { name: "Majestic / Kempegowda Bus Station", lat: 12.9767, lng: 77.5713, parentDistrict: "Bengaluru City", type: "AREA" },
  { name: "Marathahalli Bridge", lat: 12.9592, lng: 77.6974, parentDistrict: "Bengaluru City", type: "AREA" },
  { name: "Hebbal Flyover Junction", lat: 13.0358, lng: 77.5970, parentDistrict: "Bengaluru City", type: "AREA" },
  { name: "Peenya Industrial Area", lat: 13.0285, lng: 77.5197, parentDistrict: "Bengaluru City", type: "AREA" },
  { name: "Yelahanka New Town", lat: 13.1007, lng: 77.5963, parentDistrict: "Bengaluru City", type: "AREA" },
  { name: "KR Puram Railway Station", lat: 13.0012, lng: 77.6835, parentDistrict: "Bengaluru City", type: "AREA" },
  { name: "Banashankari Temple Area", lat: 12.9255, lng: 77.5667, parentDistrict: "Bengaluru City", type: "AREA" },
  { name: "Basavanagudi Police Station", lat: 12.9421, lng: 77.5755, parentDistrict: "Bengaluru City", type: "AREA" },
  { name: "Rajajinagar 1st Block", lat: 12.9901, lng: 77.5525, parentDistrict: "Bengaluru City", type: "AREA" },
  { name: "BTM Layout 2nd Stage", lat: 12.9166, lng: 77.6101, parentDistrict: "Bengaluru City", type: "AREA" },
  { name: "Bellandur Outer Ring Road", lat: 12.9279, lng: 77.6749, parentDistrict: "Bengaluru City", type: "AREA" },
  { name: "HSR Layout Sector 1", lat: 12.9121, lng: 77.6446, parentDistrict: "Bengaluru City", type: "AREA" },
  { name: "Malleshwaram 18th Cross", lat: 13.0031, lng: 77.5701, parentDistrict: "Bengaluru City", type: "AREA" },
  { name: "Frazer Town Police Jurisdiction", lat: 12.9972, lng: 77.6141, parentDistrict: "Bengaluru City", type: "AREA" },
  { name: "Shivajinagar Bus Terminus", lat: 12.9857, lng: 77.6058, parentDistrict: "Bengaluru City", type: "AREA" },
  { name: "Ulsoor / Halasuru Lake", lat: 12.9822, lng: 77.6212, parentDistrict: "Bengaluru City", type: "AREA" },
  { name: "Yeshwanthpur Junction", lat: 13.0238, lng: 77.5529, parentDistrict: "Bengaluru City", type: "AREA" },
  { name: "Hosakote Town", lat: 13.0694, lng: 77.7981, parentDistrict: "Bengaluru Dist", type: "VILLAGE" },
  { name: "Doddaballapura Industrial Town", lat: 13.2924, lng: 77.5385, parentDistrict: "Bengaluru Dist", type: "VILLAGE" },
  { name: "Devanahalli / Kempegowda Airport Area", lat: 13.2458, lng: 77.7121, parentDistrict: "Bengaluru Dist", type: "VILLAGE" },
  { name: "Channapatna Toy Town", lat: 12.6518, lng: 77.2089, parentDistrict: "Ramanagara", type: "VILLAGE" },
  { name: "Ramanagara Silk Town", lat: 12.7214, lng: 77.2816, parentDistrict: "Ramanagara", type: "VILLAGE" },
  { name: "Kanakapura Town", lat: 12.5463, lng: 77.4200, parentDistrict: "Ramanagara", type: "VILLAGE" },
  { name: "Tumakuru City Centre", lat: 13.3392, lng: 77.1017, parentDistrict: "Tumakuru", type: "VILLAGE" },
  { name: "Tiptur Coconut Market Area", lat: 13.2580, lng: 76.4750, parentDistrict: "Tumakuru", type: "VILLAGE" },
  { name: "Sira Highway Town", lat: 13.7448, lng: 76.9092, parentDistrict: "Tumakuru", type: "VILLAGE" },
  { name: "Gubbi Town", lat: 13.3138, lng: 76.9388, parentDistrict: "Tumakuru", type: "VILLAGE" },
  { name: "Kunigal Stud Farm Area", lat: 13.0259, lng: 77.0282, parentDistrict: "Tumakuru", type: "VILLAGE" },
  { name: "Pavagada Solar Park & Town", lat: 14.1018, lng: 77.2764, parentDistrict: "Tumakuru", type: "VILLAGE" },
  { name: "Chitradurga Fort & City", lat: 14.2251, lng: 76.3980, parentDistrict: "Chitradurga", type: "VILLAGE" },
  { name: "Hiriyur Town", lat: 13.9482, lng: 76.6186, parentDistrict: "Chitradurga", type: "VILLAGE" },
  { name: "Challakere Oil City", lat: 14.3138, lng: 76.6514, parentDistrict: "Chitradurga", type: "VILLAGE" },
  { name: "Davangere City Commercial Centre", lat: 14.4644, lng: 75.9218, parentDistrict: "Davangere", type: "VILLAGE" },
  { name: "Harihara Industrial Town", lat: 14.5161, lng: 75.8066, parentDistrict: "Davangere", type: "VILLAGE" },
  { name: "Hubli City / Chennamma Circle", lat: 15.3647, lng: 75.1240, parentDistrict: "Hubli-Dharwad City", type: "AREA" },
  { name: "Dharwad Vidyagiri Area", lat: 15.4589, lng: 75.0078, parentDistrict: "Hubli-Dharwad City", type: "AREA" },
  { name: "Belagavi City / Tilakwadi", lat: 15.8497, lng: 74.4977, parentDistrict: "Belagavi City", type: "AREA" },
  { name: "Chikkodi Town", lat: 16.4344, lng: 74.5975, parentDistrict: "Belagavi District", type: "VILLAGE" },
  { name: "Athani Town", lat: 16.7303, lng: 75.0621, parentDistrict: "Belagavi District", type: "VILLAGE" },
  { name: "Kalaburagi City / Super Market", lat: 17.3297, lng: 76.8343, parentDistrict: "Kalaburagi City", type: "AREA" },
  { name: "Bidar Fort & City", lat: 17.9104, lng: 77.5199, parentDistrict: "Bidar", type: "VILLAGE" },
  { name: "Basavakalyan Historic Town", lat: 17.8680, lng: 76.9515, parentDistrict: "Bidar", type: "VILLAGE" },
  { name: "Raichur City Centre", lat: 16.2076, lng: 77.3563, parentDistrict: "Raichur", type: "VILLAGE" },
  { name: "Sindhanur Agricultural Town", lat: 15.7770, lng: 76.7607, parentDistrict: "Raichur", type: "VILLAGE" },
  { name: "Koppal City", lat: 15.3524, lng: 76.1541, parentDistrict: "Koppal", type: "VILLAGE" },
  { name: "Gangavathi Rice Bowl Town", lat: 15.4319, lng: 76.5315, parentDistrict: "Koppal", type: "VILLAGE" },
  { name: "Ballari City Centre", lat: 15.1394, lng: 76.9214, parentDistrict: "Ballari", type: "VILLAGE" },
  { name: "Hospet / Hosapete Town", lat: 15.2689, lng: 76.3909, parentDistrict: "Ballari", type: "VILLAGE" },
  { name: "Siruguppa Town", lat: 15.6288, lng: 76.8974, parentDistrict: "Ballari", type: "VILLAGE" },
  { name: "Vijayapura Gol Gumbaz Area", lat: 16.8302, lng: 75.7100, parentDistrict: "Vijayapura", type: "VILLAGE" },
  { name: "Indi Town", lat: 17.1687, lng: 75.9619, parentDistrict: "Vijayapura", type: "VILLAGE" },
  { name: "Bagalkot City", lat: 16.1691, lng: 75.6615, parentDistrict: "Bagalkot", type: "VILLAGE" },
  { name: "Jamkhandi Town", lat: 16.5090, lng: 75.2929, parentDistrict: "Bagalkot", type: "VILLAGE" },
  { name: "Gadag City", lat: 15.4323, lng: 75.6358, parentDistrict: "Gadag", type: "VILLAGE" },
  { name: "Haveri City", lat: 14.7953, lng: 75.3991, parentDistrict: "Haveri", type: "VILLAGE" },
  { name: "Ranebennur Commercial Area", lat: 14.6238, lng: 75.6218, parentDistrict: "Haveri", type: "VILLAGE" },
  { name: "Karwar Port & Beach Town", lat: 14.8054, lng: 74.1296, parentDistrict: "Uttara Kannada", type: "VILLAGE" },
  { name: "Sirsi Forest Town", lat: 14.6195, lng: 74.8354, parentDistrict: "Uttara Kannada", type: "VILLAGE" },
  { name: "Bhatkal Coastal Town", lat: 13.9856, lng: 74.5562, parentDistrict: "Uttara Kannada", type: "VILLAGE" },
  { name: "Dandeli Paper & Wildlife Area", lat: 15.2477, lng: 74.6287, parentDistrict: "Uttara Kannada", type: "VILLAGE" },
  { name: "Kumta Coastal Town", lat: 14.4239, lng: 74.4172, parentDistrict: "Uttara Kannada", type: "VILLAGE" },
  { name: "Shivamogga City / B.H. Road", lat: 13.9299, lng: 75.5681, parentDistrict: "Shivamogga", type: "VILLAGE" },
  { name: "Sagar Town", lat: 14.1673, lng: 75.0317, parentDistrict: "Shivamogga", type: "VILLAGE" },
  { name: "Shikaripura Town", lat: 14.2662, lng: 75.3516, parentDistrict: "Shivamogga", type: "VILLAGE" },
  { name: "Chikkamagaluru Coffee Town", lat: 13.3161, lng: 75.7720, parentDistrict: "Chikkamagaluru", type: "VILLAGE" },
  { name: "Kadur Railway Junction", lat: 13.5516, lng: 76.0125, parentDistrict: "Chikkamagaluru", type: "VILLAGE" },
  { name: "Tarikere Town", lat: 13.7082, lng: 75.8209, parentDistrict: "Chikkamagaluru", type: "VILLAGE" },
  { name: "Hassan City Centre", lat: 13.0033, lng: 76.1004, parentDistrict: "Hassan", type: "VILLAGE" },
  { name: "Arsikere Junction", lat: 13.3142, lng: 76.2572, parentDistrict: "Hassan", type: "VILLAGE" },
  { name: "Channarayapatna Highway Town", lat: 12.9038, lng: 76.3906, parentDistrict: "Hassan", type: "VILLAGE" },
  { name: "Sakleshpur Ghat Area", lat: 12.9442, lng: 75.7856, parentDistrict: "Hassan", type: "VILLAGE" },
  { name: "Madikeri / Kodagu Headquarters", lat: 12.4244, lng: 75.7382, parentDistrict: "Kodagu", type: "VILLAGE" },
  { name: "Somwarpet Town", lat: 12.5985, lng: 75.8569, parentDistrict: "Kodagu", type: "VILLAGE" },
  { name: "Virajpet Town", lat: 12.1983, lng: 75.8037, parentDistrict: "Kodagu", type: "VILLAGE" },
  { name: "Mysuru City / Palace Area", lat: 12.2958, lng: 76.6394, parentDistrict: "Mysuru City", type: "AREA" },
  { name: "Hunsur Town", lat: 12.3082, lng: 76.2905, parentDistrict: "Mysuru Dist", type: "VILLAGE" },
  { name: "KR Nagar Town", lat: 12.4431, lng: 76.3816, parentDistrict: "Mysuru Dist", type: "VILLAGE" },
  { name: "Mandya City Highway Corridor", lat: 12.5218, lng: 76.8951, parentDistrict: "Mandya", type: "VILLAGE" },
  { name: "Maddur Highway Town", lat: 12.5857, lng: 77.0450, parentDistrict: "Mandya", type: "VILLAGE" },
  { name: "Malavalli Town", lat: 12.3857, lng: 77.0592, parentDistrict: "Mandya", type: "VILLAGE" },
  { name: "Srirangapatna Heritage Town", lat: 12.4208, lng: 76.6857, parentDistrict: "Mandya", type: "VILLAGE" },
  { name: "Chamarajanagar City", lat: 11.9261, lng: 76.9437, parentDistrict: "Chamarajanagar", type: "VILLAGE" },
  { name: "Gundlupet Border Town", lat: 11.8078, lng: 76.6881, parentDistrict: "Chamarajanagar", type: "VILLAGE" },
  { name: "Kollegal Silk Town", lat: 12.1524, lng: 77.1147, parentDistrict: "Chamarajanagar", type: "VILLAGE" },
  { name: "Kolar City Gold Corridor", lat: 13.1367, lng: 78.1292, parentDistrict: "Kolar", type: "VILLAGE" },
  { name: "Bangarapet Railway Town", lat: 12.9926, lng: 78.1993, parentDistrict: "Kolar", type: "VILLAGE" },
  { name: "Mulbagal Town", lat: 13.1667, lng: 78.3999, parentDistrict: "Kolar", type: "VILLAGE" },
  { name: "KGF / Kolar Gold Fields Area", lat: 12.9610, lng: 78.2710, parentDistrict: "KGF", type: "VILLAGE" },
  { name: "Chikkaballapura City", lat: 13.4355, lng: 77.7315, parentDistrict: "Chikkaballapura", type: "VILLAGE" },
  { name: "Chintamani Town", lat: 13.4005, lng: 78.0583, parentDistrict: "Chikkaballapura", type: "VILLAGE" },
  { name: "Gauribidanur Town", lat: 13.6120, lng: 77.5186, parentDistrict: "Chikkaballapura", type: "VILLAGE" },
  { name: "Mangaluru City / Hampankatta", lat: 12.8698, lng: 74.8430, parentDistrict: "Mangaluru City", type: "AREA" },
  { name: "Udupi City / Krishna Temple Area", lat: 13.3409, lng: 74.7421, parentDistrict: "Udupi", type: "VILLAGE" },
  { name: "Manipal University Town", lat: 13.3525, lng: 74.7928, parentDistrict: "Udupi", type: "VILLAGE" },
  { name: "Kundapura Town", lat: 13.6269, lng: 74.6908, parentDistrict: "Udupi", type: "VILLAGE" },
  { name: "Karkala Town", lat: 13.2088, lng: 74.9961, parentDistrict: "Udupi", type: "VILLAGE" },
  { name: "Sullia Town", lat: 12.5594, lng: 75.3888, parentDistrict: "Dakshina Kannada", type: "VILLAGE" },
  { name: "Belthangady Town", lat: 12.9892, lng: 75.2906, parentDistrict: "Dakshina Kannada", type: "VILLAGE" },
  { name: "Surathkal NITK & Port Area", lat: 13.0033, lng: 74.7958, parentDistrict: "Mangaluru City", type: "AREA" },
  { name: "Ullal Coastal Area", lat: 12.8058, lng: 74.8564, parentDistrict: "Mangaluru City", type: "AREA" },
  { name: "Mudigere Hill Town", lat: 13.1388, lng: 75.6425, parentDistrict: "Chikkamagaluru", type: "VILLAGE" },
  { name: "Bantwal Town", lat: 12.8946, lng: 75.0347, parentDistrict: "Dakshina Kannada", type: "VILLAGE" },
  { name: "Puttur Town", lat: 12.7684, lng: 75.2016, parentDistrict: "Dakshina Kannada", type: "VILLAGE" },
  { name: "Gokarna Coastal Police", lat: 14.5479, lng: 74.3188, parentDistrict: "Uttara Kannada", type: "VILLAGE" },
  { name: "Hampi Archaeological Zone", lat: 15.3350, lng: 76.4600, parentDistrict: "Ballari", type: "VILLAGE" },
  { name: "Bhadravati Industrial Town", lat: 13.8400, lng: 75.7020, parentDistrict: "Shivamogga", type: "AREA" },
  { name: "Gokak Town", lat: 16.1667, lng: 74.8333, parentDistrict: "Belagavi District", type: "VILLAGE" },
  { name: "Nanjangud Temple Town", lat: 12.1200, lng: 76.6800, parentDistrict: "Mysuru Dist", type: "VILLAGE" },
];

interface LocationSearchBoxProps {
  selectedDistrict: string | null;
  onSelectDistrict: (districtName: string) => void;
  onSelectAreaTarget?: (target: GeoLocationTarget) => void;
}

export function LocationSearchBox({
  selectedDistrict,
  onSelectDistrict,
  onSelectAreaTarget,
}: LocationSearchBoxProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [liveGeoResults, setLiveGeoResults] = useState<GeoLocationTarget[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Intelligent multi-token offline fuzzy matcher
  const offlineResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const tokens = q.split(/\s+/).filter((word) => word.length >= 3);

    const matchedDistricts: GeoLocationTarget[] = districts
      .filter((d) => {
        const nameNorm = d.name.toLowerCase();
        const rangeNorm = d.range.toLowerCase();
        return nameNorm.includes(q) || rangeNorm.includes(q) || tokens.some((w) => nameNorm.includes(w));
      })
      .map((d) => ({
        name: d.name,
        lat: d.name === "Bengaluru City" ? 12.9716 : d.name === "Mysuru City" ? 12.2958 : 14.5,
        lng: d.name === "Bengaluru City" ? 77.5946 : d.name === "Mysuru City" ? 76.6394 : 75.8,
        parentDistrict: d.name,
        type: "DISTRICT" as const,
      }));

    const matchedSubAreas = KARNATAKA_SUB_AREAS.filter((a) => {
      const norm = a.name.toLowerCase();
      return norm.includes(q) || tokens.some((word) => norm.includes(word));
    });

    return [...matchedDistricts, ...matchedSubAreas];
  }, [query]);

  // Query live OpenStreetMap Nominatim API if query length >= 3
  useEffect(() => {
    if (!query.trim() || query.trim().length < 3) {
      setLiveGeoResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsGeocoding(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            query + ", Karnataka, India"
          )}&format=json&limit=5`,
          { headers: { "Accept-Language": "en" } }
        );
        if (res.ok) {
          const data = await res.json();
          const mapped: GeoLocationTarget[] = data.map((item: any) => ({
            name: item.display_name.split(",")[0] || query,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            parentDistrict: "Karnataka Jurisdiction",
            type: "VILLAGE" as const,
          }));
          setLiveGeoResults(mapped);
        }
      } catch (err) {
        console.warn("Nominatim search failed, using offline gazetteer");
      } finally {
        setIsGeocoding(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const allResults = useMemo(() => {
    const combined = [...offlineResults];
    const seenNames = new Set(combined.map((c) => c.name.toLowerCase().trim()));

    liveGeoResults.forEach((liveItem) => {
      const norm = liveItem.name.toLowerCase().trim();
      if (!seenNames.has(norm) && !combined.some((c) => Math.abs(c.lat - liveItem.lat) < 0.01)) {
        seenNames.add(norm);
        combined.push(liveItem);
      }
    });

    return combined;
  }, [offlineResults, liveGeoResults]);

  const handleSelect = (target: GeoLocationTarget) => {
    if (target.type === "DISTRICT") {
      onSelectDistrict(target.name);
    } else {
      // It's a specific area or village!
      onSelectDistrict(target.parentDistrict !== "Karnataka Jurisdiction" ? target.parentDistrict : "Bengaluru City");
      if (onSelectAreaTarget) {
        onSelectAreaTarget(target);
      }
    }
    setQuery(target.name);
    setIsOpen(false);
  };

  const quickJumpHotspots = [
    "Bengaluru City",
    "Mysuru City",
    "Mangaluru City",
    "Hubli-Dharwad City",
    "Belagavi District",
    "Kalaburagi City",
  ];

  return (
    <div ref={containerRef} className="relative w-full z-50">
      <div className="p-3 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 relative z-50">
        {/* Search Input Area */}
        <div className="relative flex-1">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-brand-purple pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={t("Search ANY area, village, police station, or district in Karnataka (e.g. Boppalapura, Whitefield, Mysuru)...")}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-muted/50 border border-border text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-brand-purple transition-all"
            />
            {isGeocoding && (
              <Loader2 className="absolute right-9 h-4 w-4 animate-spin text-brand-purple" />
            )}
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setIsOpen(false);
                  if (onSelectAreaTarget) {
                    onSelectAreaTarget(null as any);
                  }
                }}
                className="absolute right-3.5 p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Results Dropdown */}
          {isOpen && query.trim().length > 0 && (
            <div className="absolute z-[99999] left-0 right-0 mt-2 p-2 rounded-2xl bg-background dark:bg-slate-950 border-2 border-brand-purple/60 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] max-h-80 overflow-y-auto divide-y divide-border/40">
              {allResults.length === 0 && !isGeocoding ? (
                <div className="p-4 text-center text-xs font-semibold text-muted-foreground">
                  {t("No Karnataka jurisdiction found matching")} &quot;{query}&quot;
                </div>
              ) : (
                allResults.map((target, idx) => {
                  const matchedDistrict = districts.find((d) => d.name === target.parentDistrict);
                  const riskTier = matchedDistrict ? getRiskTier(matchedDistrict) : "Moderate";
                  return (
                    <div
                      key={`${target.name}-${idx}`}
                      onClick={() => handleSelect(target)}
                      className="p-3 rounded-xl hover:bg-brand-purple/15 dark:hover:bg-brand-purple/20 cursor-pointer flex items-center justify-between transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-muted group-hover:bg-brand-purple/20 transition-colors">
                          {target.type === "DISTRICT" ? (
                            <MapPin className="h-4 w-4 text-brand-purple" />
                          ) : (
                            <Globe className="h-4 w-4 text-brand-red" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-sm text-foreground group-hover:text-brand-purple block transition-colors">
                            {t(target.name)}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">
                            {target.type === "DISTRICT"
                              ? `${t("Official KSP Police District HQ")}`
                              : `📍 ${t("Area / Village")} (${t("Jurisdiction")}: ${t(target.parentDistrict)})`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase inline-block ${
                              riskTier === "Critical" || riskTier === "High"
                                ? "bg-brand-red/15 text-brand-red"
                                : riskTier === "Moderate"
                                ? "bg-brand-amber/15 text-brand-amber"
                                : "bg-brand-green/15 text-brand-green"
                            }`}
                          >
                            {t(target.type)}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Quick Jump Hotspot Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1 flex items-center gap-1">
            <Crosshair className="h-3.5 w-3.5 text-brand-purple" />
            {t("Quick Jump")}:
          </span>
          {quickJumpHotspots.map((name) => {
            const isSelected = selectedDistrict === name;
            return (
              <button
                key={name}
                onClick={() => onSelectDistrict(name)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-brand-purple text-white shadow-md ring-2 ring-brand-purple/40"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-border/40"
                }`}
              >
                {t(name)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
