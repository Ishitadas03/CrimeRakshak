"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { Network, Users, MapPin, CreditCard, AlertTriangle, Search, X, ChevronRight, Shield, Eye, Loader2 } from "lucide-react";
import { brandColors } from "@/lib/design-tokens";
import { fetchAPI } from "@/lib/apiClient";
import { useLanguage } from "@/components/LanguageContext";
import NetworkGraph from "@/components/NetworkGraph";

export interface NetworkNode {
  id: string;
  name: string;
  type: "accused" | "victim" | "location" | "account";
  group: number;
  risk: "high" | "medium" | "low";
  firCount: number;
}

export interface NetworkEdge {
  source: string;
  target: string;
  type: "co-accused" | "shared-location" | "transaction" | "victim-link";
}

const typeConfig: Record<string, { color: string; icon: any; label: string }> = {
  accused: { color: brandColors.customRed, icon: Users, label: "Accused" },
  victim: { color: brandColors.teal, icon: Shield, label: "Victim" },
  location: { color: brandColors.blue, icon: MapPin, label: "Location" },
  account: { color: brandColors.purple, icon: CreditCard, label: "Financial Acc." },
};

const riskColors: Record<string, string> = {
  high: "text-brand-red bg-brand-red/10 border-brand-red/30",
  medium: "text-brand-amber bg-brand-amber/10 border-brand-amber/30",
  low: "text-brand-teal bg-brand-teal/10 border-brand-teal/30",
};

const edgeTypeLabels: Record<string, string> = {
  "co-accused": "Co-Accused",
  "shared-location": "Shared Location",
  "transaction": "Financial Link",
  "victim-link": "Victim Link",
};

export default function NetworkPage() {
  const { t } = useLanguage();
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [networkNodes, setNetworkNodes] = useState<NetworkNode[]>([]);
  const [networkEdges, setNetworkEdges] = useState<NetworkEdge[]>([]);

  useEffect(() => {
    const loadGraph = async () => {
      try {
        setLoading(true);
        const data = await fetchAPI("/network/full?node_limit=150&edge_limit=400");
        
        const mappedNodes: NetworkNode[] = (data.nodes || []).map((n: any) => {
          let type: "accused" | "victim" | "location" | "account" = "location";
          if (n.label === "Person") {
            type = n.properties?.role === "victim" ? "victim" : "accused";
          } else if (n.label === "Account" || n.label === "BankAccount") {
            type = "account";
          } else if (n.label === "Location" || n.label === "FIR") {
            type = "location";
          }

          let risk: "high" | "medium" | "low" = "low";
          const riskScore = n.properties?.risk_score || 0;
          if (riskScore > 70) risk = "high";
          else if (riskScore > 40) risk = "medium";

          return {
            id: n.id,
            name: n.properties?.name || n.id,
            type,
            group: 0, // assigned below from real graph connectivity
            risk,
            firCount: n.properties?.fir_count || 1
          };
        });

        const mappedEdges: NetworkEdge[] = (data.edges || []).map((e: any) => {
          let type: "co-accused" | "shared-location" | "transaction" | "victim-link" = "co-accused";
          if (e.type === "CO_ACCUSED") {
            type = "co-accused";
          } else if (e.type === "IN_DISTRICT" || e.type === "SHARED_LOCATION" || e.type === "INVOLVED_IN") {
            type = "shared-location";
          } else if (e.type === "HOLDS" || e.type === "TRANSFERRED_TO") {
            type = "transaction";
          } else {
            type = "victim-link";
          }

          return {
            source: e.source,
            target: e.target,
            type
          };
        });

        // Assign groups from real graph connectivity (connected components),
        // so "Detected Clusters" reflects actual linked subnetworks.
        const parent: Record<string, string> = {};
        const find = (x: string): string => {
          parent[x] ??= x;
          while (parent[x] !== x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
          }
          return x;
        };
        mappedNodes.forEach((n) => find(n.id));
        mappedEdges.forEach((e) => {
          const ra = find(e.source);
          const rb = find(e.target);
          if (ra !== rb) parent[ra] = rb;
        });
        const rootToGroup: Record<string, number> = {};
        const componentSizes: Record<string, number> = {};
        mappedNodes.forEach((n) => {
          const root = find(n.id);
          componentSizes[root] = (componentSizes[root] || 0) + 1;
        });
        // Number groups largest-first: G1 = biggest cluster.
        Object.keys(componentSizes)
          .sort((a, b) => componentSizes[b] - componentSizes[a])
          .forEach((root, i) => {
            rootToGroup[root] = i + 1;
          });
        mappedNodes.forEach((n) => {
          n.group = rootToGroup[find(n.id)];
        });

        setNetworkNodes(mappedNodes);
        setNetworkEdges(mappedEdges);
      } catch (err: any) {
        console.error("Failed to load network graph:", err);
        setError(err.message || "Failed to query Neo4j graph data.");
      } finally {
        setLoading(false);
      }
    };
    loadGraph();
  }, []);

  const filteredNodes = useMemo(() => {
    return networkNodes.filter((n) => {
      const matchesSearch = !searchQuery || n.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = !filterType || n.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [searchQuery, filterType, networkNodes]);

  const connectedEdges = useMemo(() => {
    if (!selectedNode) return [];
    return networkEdges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id);
  }, [selectedNode, networkEdges]);

  const connectedNodes = useMemo(() => {
    if (!selectedNode) return [];
    const connectedIds = new Set<string>();
    connectedEdges.forEach((e) => {
      connectedIds.add(e.source === selectedNode.id ? e.target : e.source);
    });
    return networkNodes.filter((n) => connectedIds.has(n.id));
  }, [selectedNode, connectedEdges, networkNodes]);

  // Cluster stats — real connected components, largest first.
  const clusters = useMemo(() => {
    const groups: Record<number, NetworkNode[]> = {};
    networkNodes.forEach((n) => {
      if (!groups[n.group]) groups[n.group] = [];
      groups[n.group].push(n);
    });
    return Object.entries(groups)
      .map(([id, nodes]) => ({
        id: Number(id),
        count: nodes.length,
        accusedCount: nodes.filter((n) => n.type === "accused").length,
        highRiskCount: nodes.filter((n) => n.risk === "high").length,
      }))
      .filter((c) => c.count >= 3)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [networkNodes]);

  const totalAccused = useMemo(() => networkNodes.filter((n) => n.type === "accused").length, [networkNodes]);
  const highRiskCount = useMemo(() => networkNodes.filter((n) => n.risk === "high").length, [networkNodes]);

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 h-full flex flex-col items-center justify-center min-h-[600px]">
        <Loader2 className="h-10 w-10 text-brand-red animate-spin mb-4" />
        <h2 className="text-xl font-heading font-bold text-foreground">{t("Analyzing Criminal Networks...")}</h2>
        <p className="text-muted-foreground text-sm mt-2">{t("Fetching co-offending ties and location hubs from Neo4j")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8 h-full flex flex-col items-center justify-center min-h-[600px]">
        <AlertTriangle className="h-10 w-10 text-brand-red mb-4" />
        <h2 className="text-xl font-heading font-bold text-foreground">{t("Network Intel Unavailable")}</h2>
        <p className="text-muted-foreground text-sm mt-2 max-w-md text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-3 text-foreground tracking-tight">
          <div className="p-2 bg-brand-red/10 rounded-lg">
            <Network className="h-6 w-6 text-brand-red" />
          </div>
          {t("Criminal Network Analysis")}
        </h1>
        <p className="text-muted-foreground mt-3 text-base">{t("Visualize relationships between accused, victims, locations, and financial accounts.")}</p>
      </motion.div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total Nodes", value: networkNodes.length, icon: Network, color: "brand-blue" },
          { label: "Accused Tracked", value: totalAccused, icon: Users, color: "brand-red" },
          { label: "Clusters Detected", value: clusters.length, icon: Eye, color: "brand-purple" },
          { label: "High Risk", value: highRiskCount, icon: AlertTriangle, color: "brand-amber" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 * (i + 1) }}>
            <Card className="glass-card hover:!transform-none border-l-4" style={{ borderLeftColor: (brandColors as any)[kpi.color.replace('brand-', '')] || 'var(--border)' }}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-${kpi.color}/10 text-${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mb-1">{t(kpi.label)}</p>
                  <p className="text-3xl font-sans font-bold text-foreground">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left: Network Graph */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="lg:col-span-8">
          <Card className="glass-card hover:!transform-none overflow-hidden">
            <CardHeader className="pb-2 border-b border-border/50 bg-muted/10">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="font-heading text-lg">{t("Relationship Graph")}</CardTitle>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  {Object.entries(typeConfig).map(([type, cfg]) => (
                    <span key={type} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.color }} />
                      {t(cfg.label)}
                    </span>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
               <div className="relative w-full bg-gradient-to-br from-muted/10 to-muted/5 overflow-hidden">
                 <NetworkGraph
                   nodes={networkNodes}
                   edges={networkEdges}
                   selectedNode={selectedNode}
                   onSelectNode={setSelectedNode}
                   searchQuery={searchQuery}
                   filterType={filterType}
                 />
               </div>
             </CardContent>
          </Card>
        </motion.div>

        {/* Right: Detail Panel */}
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="lg:col-span-4">
          <div className="space-y-4 lg:sticky lg:top-4">
            {/* Search & Filter */}
            <Card className="glass-card hover:!transform-none">
              <CardContent className="p-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t("Search nodes...")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-muted/20 rounded-lg border border-border/50 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {[null, ...Object.keys(typeConfig)].map((type) => (
                    <button
                      key={type || "all"}
                      onClick={() => setFilterType(type)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        filterType === type
                          ? "bg-brand-blue text-white"
                          : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      {type ? t(typeConfig[type].label) : t("All")}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Selected Node Detail */}
            <AnimatePresence mode="wait">
              {selectedNode ? (
                <motion.div key={selectedNode.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <Card className="glass-card hover:!transform-none border-t-4" style={{ borderTopColor: typeConfig[selectedNode.type]?.color }}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="font-heading text-lg">{selectedNode.name}</CardTitle>
                        <button onClick={() => setSelectedNode(null)} className="p-1 rounded-md hover:bg-muted"><X className="h-4 w-4" /></button>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs font-bold uppercase px-2 py-1 rounded border" style={{ color: typeConfig[selectedNode.type]?.color, borderColor: typeConfig[selectedNode.type]?.color, backgroundColor: `${typeConfig[selectedNode.type]?.color}15` }}>
                          {t(typeConfig[selectedNode.type]?.label)}
                        </span>
                        <span className={`text-xs font-bold uppercase px-2 py-1 rounded border ${riskColors[selectedNode.risk]}`}>
                          {t(selectedNode.risk)} {t("Risk").toLowerCase()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-muted/20">
                          <p className="text-xs text-muted-foreground font-semibold uppercase">{t("FIR Count")}</p>
                          <p className="text-2xl font-bold text-foreground">{selectedNode.firCount}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/20">
                          <p className="text-xs text-muted-foreground font-semibold uppercase">{t("Connections")}</p>
                          <p className="text-2xl font-bold text-foreground">{connectedEdges.length}</p>
                        </div>
                      </div>

                      {/* Connected Entities */}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{t("Connected Entities")}</p>
                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                          {connectedNodes.map((cn) => {
                            const edge = connectedEdges.find((e) => e.source === cn.id || e.target === cn.id);
                            return (
                              <button
                                key={cn.id}
                                onClick={() => setSelectedNode(cn)}
                                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/20 transition-colors text-left"
                              >
                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: typeConfig[cn.type]?.color }} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-foreground truncate">{cn.name}</p>
                                  <p className="text-xs text-muted-foreground">{edge ? t(edgeTypeLabels[edge.type]) : ""}</p>
                                </div>
                                <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card className="glass-card hover:!transform-none border-dashed border-2 cursor-default hover:shadow-none">
                    <CardContent className="py-12 text-center">
                      <Network className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-foreground mb-1">{t("Select a Node")}</p>
                      <p className="text-xs text-muted-foreground">{t("Click any node in the graph to inspect its connections and details.")}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cluster Summary */}
            <Card className="glass-card hover:!transform-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-heading">{t("Detected Clusters")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {clusters.map((cluster) => (
                  <div key={cluster.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/15 border border-border/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-purple/10 text-brand-purple flex items-center justify-center text-xs font-bold">
                        G{cluster.id}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{cluster.count} {t("members")}</p>
                        <p className="text-xs text-muted-foreground">{cluster.accusedCount} {t("accused")}</p>
                      </div>
                    </div>
                    {cluster.highRiskCount > 0 && (
                      <span className="text-xs font-bold text-brand-red bg-brand-red/10 px-2 py-1 rounded">
                        {cluster.highRiskCount} {t("high-risk")}
                      </span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
