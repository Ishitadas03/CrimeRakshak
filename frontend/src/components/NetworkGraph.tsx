"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { forceCollide } from "d3-force-3d";
import { brandColors } from "@/lib/design-tokens";
import type { NetworkNode, NetworkEdge } from "@/app/(dashboard)/network/page";

// Canvas library — client-only (touches window at import time).
// next/dynamic doesn't forward refs, so wrap it and pass the ref via a prop.
const ForceGraph2D = dynamic(
  () =>
    import("react-force-graph-2d").then((mod) => {
      const FG = mod.default;
      const Wrapper = ({ fgRef, ...props }: any) => <FG ref={fgRef} {...props} />;
      Wrapper.displayName = "ForceGraph2DWrapper";
      return Wrapper;
    }),
  { ssr: false }
);

const typeColors: Record<string, string> = {
  accused: brandColors.customRed,
  victim: brandColors.teal,
  location: brandColors.blue,
  account: brandColors.purple,
};

interface GraphNode extends NetworkNode {
  x?: number;
  y?: number;
  degree: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: NetworkEdge["type"];
}

interface NetworkGraphProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  selectedNode: NetworkNode | null;
  onSelectNode: (node: NetworkNode | null) => void;
  searchQuery: string;
  filterType: string | null;
}

const linkId = (v: string | GraphNode) => (typeof v === "object" ? v.id : v);

export default function NetworkGraph({
  nodes,
  edges,
  selectedNode,
  onSelectNode,
  searchQuery,
  filterType,
}: NetworkGraphProps) {
  const graphRef = useRef<any>(null);
  const [fgInstance, setFgInstance] = useState<any>(null);
  const setFgRef = useCallback((fg: any) => {
    graphRef.current = fg;
    setFgInstance(fg);
  }, []);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 560 });
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Responsive canvas size.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      if (width > 0) setDimensions({ width, height: 560 });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Build graph data once per dataset; degree drives node size.
  const graphData = useMemo(() => {
    const degree: Record<string, number> = {};
    const valid = edges.filter((e) => e.source !== e.target);
    valid.forEach((e) => {
      degree[e.source] = (degree[e.source] || 0) + 1;
      degree[e.target] = (degree[e.target] || 0) + 1;
    });
    return {
      nodes: nodes.map((n) => ({ ...n, degree: degree[n.id] || 0 })) as GraphNode[],
      links: valid.map((e) => ({ source: e.source, target: e.target, type: e.type })) as GraphLink[],
    };
  }, [nodes, edges]);

  // Neighbor lookup for highlight-on-select/hover.
  const neighborMap = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    graphData.links.forEach((l) => {
      const s = linkId(l.source);
      const t = linkId(l.target);
      (map[s] ||= new Set()).add(t);
      (map[t] ||= new Set()).add(s);
    });
    return map;
  }, [graphData]);

  const focusNode = selectedNode || hoverNode;
  const focusNeighbors = focusNode ? neighborMap[focusNode.id] : undefined;

  const matchesFilters = useCallback(
    (node: GraphNode) => {
      const matchesSearch =
        !searchQuery || node.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = !filterType || node.type === filterType;
      return matchesSearch && matchesType;
    },
    [searchQuery, filterType]
  );

  // Physics: spacing + collision so clusters read clearly.
  // Depends on fgInstance so it re-runs once the dynamic import mounts.
  useEffect(() => {
    const fg = fgInstance;
    if (!fg) return;
    fg.d3Force("charge")?.strength(-120).distanceMax(260);
    fg.d3Force("link")?.distance((l: GraphLink) => (l.type === "co-accused" ? 45 : 70));
    fg.d3Force(
      "collide",
      forceCollide((n: GraphNode) => nodeRadius(n) + 4)
    );
    fg.d3ReheatSimulation();
    didInitialFit.current = false; // refit when the dataset changes
  }, [graphData, fgInstance]);

  // Zoom to fit on the first settle only — later engine stops (after drags)
  // must not yank the user's zoom/pan away.
  const didInitialFit = useRef(false);
  const handleEngineStop = useCallback(() => {
    if (didInitialFit.current) return;
    didInitialFit.current = true;
    graphRef.current?.zoomToFit(500, 50);
  }, []);

  const nodeRadius = (node: GraphNode) => {
    const base = node.type === "accused" ? 6 : 4.5;
    return base + Math.min(node.degree, 12) * 0.55;
  };

  const nodeCanvasObject = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const r = nodeRadius(node);
      const color = typeColors[node.type] || brandColors.blue;
      const isFocus = focusNode?.id === node.id;
      const isNeighbor = !!focusNeighbors?.has(node.id);
      const dimmed = (focusNode && !isFocus && !isNeighbor) || !matchesFilters(node);

      ctx.globalAlpha = dimmed ? 0.12 : 1;

      // High-risk accused get a warning ring.
      if (node.risk === "high" && node.type === "accused" && !dimmed) {
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, r + 2.5, 0, 2 * Math.PI);
        ctx.strokeStyle = brandColors.amber;
        ctx.lineWidth = 1.5 / globalScale;
        ctx.stroke();
      }

      // Selection glow.
      if (isFocus) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
      }

      ctx.beginPath();
      ctx.arc(node.x!, node.y!, r, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.shadowBlur = 0;

      if (isFocus) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();
      }

      // Labels: focus + neighbors always; others only when zoomed in.
      const showLabel = isFocus || isNeighbor || globalScale > 2.2;
      if (showLabel && !dimmed) {
        const label = node.name.length > 18 ? `${node.name.slice(0, 17)}…` : node.name;
        const fontSize = Math.max(11 / globalScale, 2.5);
        ctx.font = `${isFocus ? "700" : "500"} ${fontSize}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const textWidth = ctx.measureText(label).width;
        // Backdrop pill for readability over edges.
        ctx.fillStyle = isDark ? "rgba(13,17,23,0.75)" : "rgba(255,255,255,0.8)";
        ctx.fillRect(
          node.x! - textWidth / 2 - 2 / globalScale,
          node.y! + r + 2 / globalScale,
          textWidth + 4 / globalScale,
          fontSize + 3 / globalScale
        );
        ctx.fillStyle = isDark ? "#e5e7eb" : "#1f2937";
        ctx.fillText(label, node.x!, node.y! + r + 3 / globalScale);
      }
      ctx.globalAlpha = 1;
    },
    [focusNode, focusNeighbors, matchesFilters, isDark]
  );

  const nodePointerAreaPaint = useCallback(
    (node: GraphNode, color: string, ctx: CanvasRenderingContext2D) => {
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, nodeRadius(node) + 4, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    },
    []
  );

  const linkColor = useCallback(
    (link: GraphLink) => {
      const s = linkId(link.source);
      const t = linkId(link.target);
      const isFocusLink = focusNode && (s === focusNode.id || t === focusNode.id);
      if (focusNode && !isFocusLink) return isDark ? "rgba(148,163,184,0.04)" : "rgba(100,116,139,0.05)";
      if (isFocusLink) return brandColors.customRed;
      if (link.type === "co-accused") return isDark ? "rgba(251,113,133,0.35)" : "rgba(251,113,133,0.45)";
      if (link.type === "transaction") return isDark ? "rgba(139,92,246,0.3)" : "rgba(139,92,246,0.4)";
      return isDark ? "rgba(148,163,184,0.15)" : "rgba(100,116,139,0.2)";
    },
    [focusNode, isDark]
  );

  const linkWidth = useCallback(
    (link: GraphLink) => {
      const s = linkId(link.source);
      const t = linkId(link.target);
      if (focusNode && (s === focusNode.id || t === focusNode.id)) return 2;
      return link.type === "co-accused" ? 1.4 : 0.8;
    },
    [focusNode]
  );

  return (
    <div ref={containerRef} className="relative w-full h-[560px]">
      <ForceGraph2D
        fgRef={setFgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        backgroundColor="rgba(0,0,0,0)"
        nodeCanvasObject={nodeCanvasObject as any}
        nodePointerAreaPaint={nodePointerAreaPaint as any}
        nodeLabel={() => ""}
        linkColor={linkColor as any}
        linkWidth={linkWidth as any}
        linkLineDash={((link: GraphLink) => (link.type === "transaction" ? [4, 2] : null)) as any}
        linkDirectionalParticles={((link: GraphLink) => {
          const s = linkId(link.source);
          const t = linkId(link.target);
          return focusNode && (s === focusNode.id || t === focusNode.id) ? 2 : 0;
        }) as any}
        linkDirectionalParticleWidth={2.5}
        linkDirectionalParticleColor={(() => brandColors.customRed) as any}
        onNodeClick={((node: GraphNode) => {
          onSelectNode(selectedNode?.id === node.id ? null : node);
          graphRef.current?.centerAt(node.x, node.y, 600);
        }) as any}
        onNodeHover={((node: GraphNode | null) => {
          setHoverNode(node);
          if (containerRef.current) containerRef.current.style.cursor = node ? "pointer" : "grab";
        }) as any}
        onBackgroundClick={() => onSelectNode(null)}
        cooldownTicks={120}
        onEngineStop={handleEngineStop}
        d3AlphaDecay={0.03}
        d3VelocityDecay={0.35}
        minZoom={0.4}
        maxZoom={8}
      />

      {/* Hover tooltip */}
      {hoverNode && !selectedNode && (
        <div className="absolute top-3 left-3 px-3 py-2 rounded-lg bg-background/90 border border-border/60 shadow-lg pointer-events-none z-20 backdrop-blur-sm">
          <p className="text-sm font-bold text-foreground">{hoverNode.name}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {hoverNode.type} · {hoverNode.degree} connections
            {hoverNode.risk === "high" ? " · high risk" : ""}
          </p>
        </div>
      )}

      {/* Controls hint + fit button */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2 z-20">
        <span className="text-[10px] text-muted-foreground bg-background/70 px-2 py-1 rounded backdrop-blur-sm hidden sm:block">
          Scroll to zoom · Drag to pan · Drag nodes to rearrange
        </span>
        <button
          onClick={() => graphRef.current?.zoomToFit(500, 50)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-background/80 border border-border/60 text-foreground hover:bg-muted/50 transition-colors backdrop-blur-sm"
        >
          Fit View
        </button>
      </div>
    </div>
  );
}
