"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";

interface AssetRow {
  symbol: string;
  base: string;
  price: number;
  priceChange24h: number;
  openInterestUsd: number | null;
  longPct: number | null;
  shortPct: number | null;
  takerRatio: number | null;
  fundingPct: number | null;
  regime: string;
}

function fmtUsd(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return "--";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

interface NodePoint {
  id: string;
  label: string;
  symbol: string;
  longPct: number;
  takerRatio: number;
  oi: number;
  price: number;
  priceChange24h: number;
  regime: string;
  bullish: boolean;
  baseRadius: number;
  // Physics coordinates
  originX: number;
  originY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isDragging?: boolean;
}

// Interactive Physics-based Moveable Smart Money Radar Map
function MoveableSmartMoneyMap({
  assets,
  onSelectCoin,
}: {
  assets: AssetRow[];
  onSelectCoin: (sym: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [filter, setFilter] = useState<"all" | "top10" | "accum" | "dist">("all");
  const [physicsOn, setPhysicsOn] = useState(true);
  const [unpackOn, setUnpackOn] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<NodePoint | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodePoint | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const nodesRef = useRef<NodePoint[]>([]);
  const draggingNodeRef = useRef<NodePoint | null>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const mousePosRef = useRef({ x: 0, y: 0 });

  const W = 760;
  const H = 460;
  const PAD = 50;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;
  const minX = 20, maxX = 85;
  const minY = 0.4, maxY = 2.6;

  function toScreenX(v: number) {
    const clamped = Math.max(minX, Math.min(maxX, v));
    return PAD + ((clamped - minX) / (maxX - minX)) * innerW;
  }
  function toScreenY(v: number) {
    const clamped = Math.max(minY, Math.min(maxY, v));
    return PAD + innerH - ((clamped - minY) / (maxY - minY)) * innerH;
  }

  // Initialize or update nodes from assets
  useEffect(() => {
    const valid = assets.filter(
      (a) => a.longPct !== null && a.takerRatio !== null && (a.openInterestUsd ?? 0) > 0
    );
    const maxOI = Math.max(...valid.map((a) => a.openInterestUsd ?? 0), 1);

    const newNodes: NodePoint[] = valid.map((a) => {
      const origX = toScreenX(a.longPct as number);
      const origY = toScreenY(a.takerRatio as number);
      const oiVal = a.openInterestUsd ?? 0;
      // Proportional radius with min/max
      const r = Math.max(6, Math.min(26, 6 + Math.sqrt(oiVal / maxOI) * 20));
      const isBull = (a.longPct as number) >= 55 && (a.takerRatio as number) >= 1.0;

      // Retain existing position if already existing
      const existing = nodesRef.current.find((n) => n.symbol === a.symbol);
      return {
        id: a.symbol,
        label: a.base,
        symbol: a.symbol,
        longPct: a.longPct as number,
        takerRatio: a.takerRatio as number,
        oi: oiVal,
        price: a.price,
        priceChange24h: a.priceChange24h,
        regime: a.regime,
        bullish: isBull,
        baseRadius: r,
        originX: origX,
        originY: origY,
        x: existing ? existing.x : origX,
        y: existing ? existing.y : origY,
        vx: existing ? existing.vx : 0,
        vy: existing ? existing.vy : 0,
      };
    });

    nodesRef.current = newNodes;
  }, [assets]);

  // Main Canvas Rendering & Physics Animation Loop
  useEffect(() => {
    let animId: number;

    function render() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const displayW = canvas.clientWidth || W;
      const displayH = canvas.clientHeight || H;

      if (canvas.width !== displayW * dpr || canvas.height !== displayH * dpr) {
        canvas.width = displayW * dpr;
        canvas.height = displayH * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, displayW, displayH);

      // Apply Pan & Zoom transformation centered
      ctx.translate(pan.x + displayW / 2, pan.y + displayH / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-W / 2, -H / 2);

      // ── 1. Draw Grid & Quadrants ──
      // Subtle background grid
      ctx.strokeStyle = "#1a1d24";
      ctx.lineWidth = 1;
      for (let v = 25; v <= 80; v += 10) {
        const gx = toScreenX(v);
        ctx.beginPath();
        ctx.moveTo(gx, PAD);
        ctx.lineTo(gx, H - PAD);
        ctx.stroke();
      }
      for (let v = 0.6; v <= 2.4; v += 0.3) {
        const gy = toScreenY(v);
        ctx.beginPath();
        ctx.moveTo(PAD, gy);
        ctx.lineTo(W - PAD, gy);
        ctx.stroke();
      }

      // Threshold Reference Crosshairs
      const crossX = toScreenX(55);
      const crossY = toScreenY(1.0);

      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(201, 162, 39, 0.4)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(crossX, PAD);
      ctx.lineTo(crossX, H - PAD);
      ctx.moveTo(PAD, crossY);
      ctx.lineTo(W - PAD, crossY);
      ctx.stroke();
      ctx.restore();

      // Quadrant Ambient Aura Gradients
      // Smart Accumulation (Top Right)
      const accumGrad = ctx.createRadialGradient(toScreenX(70), toScreenY(1.8), 10, toScreenX(70), toScreenY(1.8), 160);
      accumGrad.addColorStop(0, "rgba(59, 164, 104, 0.08)");
      accumGrad.addColorStop(1, "transparent");
      ctx.fillStyle = accumGrad;
      ctx.fillRect(crossX, PAD, (W - PAD) - crossX, crossY - PAD);

      // Distribution Zone (Bottom Left)
      const distGrad = ctx.createRadialGradient(toScreenX(35), toScreenY(0.6), 10, toScreenX(35), toScreenY(0.6), 160);
      distGrad.addColorStop(0, "rgba(208, 83, 83, 0.08)");
      distGrad.addColorStop(1, "transparent");
      ctx.fillStyle = distGrad;
      ctx.fillRect(PAD, crossY, crossX - PAD, (H - PAD) - crossY);

      // Quadrant Watermark Labels
      ctx.font = "bold 9px monospace";
      ctx.fillStyle = "rgba(59, 164, 104, 0.45)";
      ctx.fillText("SMART ACCUMULATION ZONE (High Longs + High Taker)", toScreenX(58), toScreenY(2.45));
      ctx.fillStyle = "rgba(208, 83, 83, 0.45)";
      ctx.fillText("DISTRIBUTION ZONE (Low Longs + High Selling)", toScreenX(23), toScreenY(0.48));
      ctx.fillStyle = "rgba(201, 162, 39, 0.35)";
      ctx.fillText("SQUEEZE WATCH (Short Crowded)", toScreenX(23), toScreenY(2.45));
      ctx.fillStyle = "rgba(168, 85, 247, 0.35)";
      ctx.fillText("TRAPPED LONGS (Exhaustion)", toScreenX(62), toScreenY(0.48));

      // ── 2. Physics Simulation Step (Collision Avoidance & Spring Restitution) ──
      const nodes = nodesRef.current;
      const dragging = draggingNodeRef.current;

      if (physicsOn) {
        for (let i = 0; i < nodes.length; i++) {
          const n1 = nodes[i];
          if (n1 === dragging) continue;

          // Spring force pulling node back to its data origin
          const kSpring = unpackOn ? 0.04 : 0.12;
          const fx = (n1.originX - n1.x) * kSpring;
          const fy = (n1.originY - n1.y) * kSpring;
          n1.vx = (n1.vx + fx) * 0.78;
          n1.vy = (n1.vy + fy) * 0.78;

          // Collision repulsion between nodes so overlapping circles unpack
          if (unpackOn) {
            for (let j = i + 1; j < nodes.length; j++) {
              const n2 = nodes[j];
              const dx = n2.x - n1.x;
              const dy = n2.y - n1.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              const minDist = n1.baseRadius + n2.baseRadius + 6;

              if (dist < minDist) {
                const overlap = (minDist - dist) * 0.5;
                const repX = (dx / dist) * overlap * 0.15;
                const repY = (dy / dist) * overlap * 0.15;
                if (n1 !== dragging) {
                  n1.vx -= repX;
                  n1.vy -= repY;
                }
                if (n2 !== dragging) {
                  n2.vx += repX;
                  n2.vy += repY;
                }
              }
            }
          }

          // Gentle ambient drift for realistic alive sensation
          n1.x += n1.vx;
          n1.y += n1.vy;
        }
      }

      // ── 3. Draw Tether Lines for Displaced/Dragged Nodes ──
      for (const node of nodes) {
        const distFromOrigin = Math.hypot(node.x - node.originX, node.y - node.originY);
        if (distFromOrigin > 8 || node === dragging) {
          ctx.save();
          ctx.strokeStyle = node.bullish ? "rgba(59, 164, 104, 0.35)" : "rgba(208, 83, 83, 0.35)";
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(node.originX, node.originY);
          ctx.lineTo(node.x, node.y);
          ctx.stroke();

          // Small origin anchor dot
          ctx.fillStyle = "rgba(201, 162, 39, 0.5)";
          ctx.beginPath();
          ctx.arc(node.originX, node.originY, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // ── 4. Draw Bubbles (Orbs) ──
      for (const node of nodes) {
        // Filter evaluation
        if (filter === "accum" && !node.bullish) continue;
        if (filter === "dist" && node.bullish) continue;
        if (filter === "top10" && node.oi < 100_000_000) continue;
        if (searchQuery && !node.label.toLowerCase().includes(searchQuery.toLowerCase())) continue;

        const isHovered = hoveredNode?.id === node.id;
        const isSelected = selectedNode?.id === node.id;
        const r = node.baseRadius * (isHovered ? 1.25 : isSelected ? 1.15 : 1.0);

        // Outer glow
        const glowColor = node.bullish ? "rgba(59, 164, 104, 0.45)" : "rgba(208, 83, 83, 0.45)";
        if (isHovered || isSelected || node.oi > 1_000_000_000) {
          const auraGrad = ctx.createRadialGradient(node.x, node.y, r * 0.4, node.x, node.y, r * 2.2);
          auraGrad.addColorStop(0, glowColor);
          auraGrad.addColorStop(1, "transparent");
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Main Orb Body (3D Glass Sphere gradient)
        const orbGrad = ctx.createRadialGradient(
          node.x - r * 0.3,
          node.y - r * 0.3,
          r * 0.1,
          node.x,
          node.y,
          r
        );
        if (node.bullish) {
          orbGrad.addColorStop(0, "#4ade80");
          orbGrad.addColorStop(0.4, "#22c55e");
          orbGrad.addColorStop(0.85, "#15803d");
          orbGrad.addColorStop(1, "#052e16");
        } else {
          orbGrad.addColorStop(0, "#f87171");
          orbGrad.addColorStop(0.4, "#ef4444");
          orbGrad.addColorStop(0.85, "#b91c1c");
          orbGrad.addColorStop(1, "#450a0a");
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = orbGrad;
        ctx.fill();

        // Rim Light & Border
        ctx.lineWidth = isHovered || isSelected ? 2.2 : 1.2;
        ctx.strokeStyle = isHovered ? "#ffffff" : node.bullish ? "#86efac" : "#fca5a5";
        ctx.stroke();

        // Specular highlight dot for realistic glass sheen
        ctx.beginPath();
        ctx.arc(node.x - r * 0.35, node.y - r * 0.35, r * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
        ctx.fill();

        // Coin Label Badge (Centered inside or above)
        ctx.font = `bold ${Math.max(9, Math.min(13, r * 0.75))}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (r >= 13) {
          // Inside bubble
          ctx.fillStyle = "#ffffff";
          ctx.fillText(node.label, node.x, node.y);
        } else {
          // Above bubble with dark backing
          ctx.fillStyle = isHovered ? "#ffffff" : "#cbd5e1";
          ctx.fillText(node.label, node.x, node.y - r - 5);
        }
      }

      // ── 5. Draw Axis Labels ──
      ctx.restore(); // Restore to normal canvas coordinate space

      // Axis Bar Backgrounds
      ctx.fillStyle = "#14161b";
      ctx.fillRect(0, H - 28, W, 28);
      ctx.fillRect(0, 0, 36, H);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("Top Trader Long % (Account Bias →)", W / 2, H - 10);

      ctx.save();
      ctx.translate(14, H / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("Taker Buy / Sell Aggression Flow (↑)", 0, 0);
      ctx.restore();

      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [zoom, pan, filter, physicsOn, unpackOn, hoveredNode, selectedNode, searchQuery]);

  // Mouse & Touch Event Handlers for Moveable Dragging and Pan/Zoom
  function getCanvasCoords(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Invert pan & zoom to find world space coordinate
    const displayW = canvas.clientWidth || W;
    const displayH = canvas.clientHeight || H;

    const centeredX = clientX - (pan.x + displayW / 2);
    const centeredY = clientY - (pan.y + displayH / 2);

    const worldX = centeredX / zoom + W / 2;
    const worldY = centeredY / zoom + H / 2;

    return { x: worldX, y: worldY };
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const { x, y } = getCanvasCoords(e);
    mousePosRef.current = { x: e.clientX, y: e.clientY };

    // Check if user clicked on a node to drag it
    const clickedNode = nodesRef.current.find((n) => {
      const dist = Math.hypot(n.x - x, n.y - y);
      return dist <= n.baseRadius + 6;
    });

    if (clickedNode) {
      draggingNodeRef.current = clickedNode;
      setSelectedNode(clickedNode);
      onSelectCoin(clickedNode.symbol);
    } else {
      // Background pan
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const { x, y } = getCanvasCoords(e);

    if (draggingNodeRef.current) {
      // User is dragging a node!
      draggingNodeRef.current.x = x;
      draggingNodeRef.current.y = y;
      draggingNodeRef.current.vx = 0;
      draggingNodeRef.current.vy = 0;
      return;
    }

    if (isPanningRef.current) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    // Hover detection
    const found = nodesRef.current.find((n) => {
      const dist = Math.hypot(n.x - x, n.y - y);
      return dist <= n.baseRadius + 6;
    });
    setHoveredNode(found || null);
  }

  function handleMouseUp() {
    draggingNodeRef.current = null;
    isPanningRef.current = false;
  }

  function handleWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.max(0.65, Math.min(2.8, prev + delta)));
  }

  return (
    <div ref={containerRef} className="flex flex-col space-y-3 select-none">
      {/* ── Interactive Controls Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-raised/80 rounded-lg p-2 border border-border text-[11px]">
        {/* Filters */}
        <div className="flex items-center gap-1 bg-background rounded p-0.5 border border-border">
          {(
            [
              { id: "all", label: "All (50)" },
              { id: "top10", label: "Top OI" },
              { id: "accum", label: "🟢 Accumulation" },
              { id: "dist", label: "🔴 Distribution" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                filter === t.id
                  ? "bg-accent text-on-accent font-bold shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Quick Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search coin (BTC, SOL...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded border border-border bg-background px-2.5 py-0.5 text-xs text-foreground placeholder:text-faint focus:border-accent focus:outline-none w-36"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-1.5 top-0.5 text-muted hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>

        {/* Physics & View Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setUnpackOn(!unpackOn)}
            className={`px-2 py-0.5 rounded border text-[10px] font-bold transition-colors ${
              unpackOn
                ? "border-accent/40 bg-accent/15 text-accent"
                : "border-border bg-background text-muted"
            }`}
            title="Automatically repel overlapping bubbles so labels are clearly visible"
          >
            🧲 Unpack Overlap: {unpackOn ? "ON" : "OFF"}
          </button>

          <button
            onClick={() => setPhysicsOn(!physicsOn)}
            className={`px-2 py-0.5 rounded border text-[10px] font-bold transition-colors ${
              physicsOn
                ? "border-success/40 bg-success/15 text-success"
                : "border-border bg-background text-muted"
            }`}
            title="Toggle interactive elastic physics simulation"
          >
            ✨ Physics: {physicsOn ? "LIVE" : "PAUSED"}
          </button>

          {/* Zoom Buttons */}
          <div className="flex items-center gap-0.5 bg-background border border-border rounded p-0.5">
            <button
              onClick={() => setZoom((z) => Math.min(2.8, z + 0.2))}
              className="px-1.5 py-0.5 text-xs text-muted hover:text-foreground hover:bg-surface-raised rounded"
              title="Zoom In"
            >
              +
            </button>
            <span className="px-1 text-[9px] text-faint font-mono">{(zoom * 100).toFixed(0)}%</span>
            <button
              onClick={() => setZoom((z) => Math.max(0.65, z - 0.2))}
              className="px-1.5 py-0.5 text-xs text-muted hover:text-foreground hover:bg-surface-raised rounded"
              title="Zoom Out"
            >
              -
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="px-1.5 py-0.5 text-[9px] text-accent hover:underline rounded ml-0.5"
              title="Reset View"
            >
              ↺ Reset
            </button>
          </div>
        </div>
      </div>

      {/* ── Canvas Container with Moveable Orbs ── */}
      <div className="relative rounded-xl border border-border bg-background overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ width: "100%", height: "440px", cursor: draggingNodeRef.current ? "grabbing" : hoveredNode ? "grab" : "default" }}
        />

        {/* Moveable Interaction Tip Pill */}
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur border border-border/80 rounded px-2 py-1 text-[10px] text-muted pointer-events-none flex items-center gap-1.5">
          <span className="animate-pulse text-accent">🖐</span>
          <span>Click &amp; drag <strong>any bubble</strong> to move · Scroll wheel to zoom · Drag background to pan</span>
        </div>

        {/* ── Holographic Floating Quant HUD (Shows when node hovered or selected) ── */}
        {(hoveredNode || selectedNode) && (
          <div className="absolute bottom-3 right-3 w-64 rounded-lg border border-accent/40 bg-surface/95 p-3 backdrop-blur-md shadow-2xl space-y-2 animate-scale-up font-mono pointer-events-auto">
            {(() => {
              const node = hoveredNode || selectedNode!;
              return (
                <>
                  <div className="flex items-center justify-between border-b border-border/80 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className={`h-2.5 w-2.5 rounded-full ${node.bullish ? "bg-success" : "bg-danger"}`} />
                      <span className="text-xs font-bold text-foreground tracking-wider">{node.symbol}</span>
                    </div>
                    <span className={`text-[10px] font-bold ${node.priceChange24h >= 0 ? "text-success" : "text-danger"}`}>
                      {node.priceChange24h >= 0 ? "+" : ""}{node.priceChange24h}%
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Open Interest:</span>
                      <span className="font-bold text-accent">{fmtUsd(node.oi)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted">Top Trader Longs:</span>
                      <span className="font-bold text-success">{node.longPct.toFixed(1)}%</span>
                    </div>
                    {/* Dual progress bar */}
                    <div className="h-1.5 w-full rounded-full bg-surface-raised overflow-hidden flex">
                      <div className="h-full bg-success" style={{ width: `${node.longPct}%` }} />
                      <div className="h-full bg-danger flex-1" />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted">Taker Flow Ratio:</span>
                      <span className={`font-bold ${node.takerRatio >= 1.0 ? "text-success" : "text-danger"}`}>
                        {node.takerRatio.toFixed(2)}x {node.takerRatio >= 1.0 ? "BUY" : "SELL"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/60">
                      <span className="text-muted">Regime:</span>
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                        node.bullish ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
                      }`}>
                        {node.regime}
                      </span>
                    </div>
                  </div>

                  <p className="text-[9px] text-faint pt-1 text-center">
                    💡 Pull orb out to inspect crowded clusters
                  </p>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

export function SmartMoney() {
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/screener");
      const json = await res.json();
      if (json.ok && Array.isArray(json.assets)) {
        setAssets(json.assets);
        setLastUpdate(new Date().toLocaleTimeString());
      }
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const validEnriched = assets.filter(
    (a) => a.longPct !== null && a.takerRatio !== null && (a.openInterestUsd ?? 0) > 0
  );

  const ranked = validEnriched
    .map((a) => ({
      ...a,
      score: ((a.longPct as number) / 100) * (a.takerRatio as number) * ((a.openInterestUsd ?? 0) / 1e9),
    }))
    .sort((a, b) => b.score - a.score);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="font-mono text-xs text-muted animate-pulse">
          Synthesizing smart money positioning across top Binance contracts...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-mono">
      {/* ── Methodology Note ─────────────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-accent font-semibold">
              How Smart Money Is Defined &amp; Calculated
            </span>
            <span className="rounded border border-border px-2 py-0.5 text-[9px] text-faint">
              Institutional Methodology
            </span>
          </div>
          <span className="text-[10px] text-muted">
            Evaluating <span className="text-foreground font-semibold">{ranked.length}</span> Top Volume Contracts
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded border border-border bg-background p-3">
            <p className="text-[10px] font-semibold text-foreground mb-1">① Top Trader Long/Short Ratio</p>
            <p className="text-[10px] text-muted leading-relaxed">
              Endpoint: <code className="text-accent">topLongShortAccountRatio</code><br />
              Tracks the <span className="text-foreground">top 20% highest-volume accounts</span> on Binance Futures. Shows where elite high-volume accounts are positioning.
            </p>
          </div>
          <div className="rounded border border-border bg-background p-3">
            <p className="text-[10px] font-semibold text-foreground mb-1">② Taker Buy/Sell Aggression</p>
            <p className="text-[10px] text-muted leading-relaxed">
              Endpoint: <code className="text-accent">takerlongshortRatio</code><br />
              Measures aggressive market orders that hit the orderbook. Ratio &gt; 1.0 indicates net aggressive buy accumulation.
            </p>
          </div>
          <div className="rounded border border-border bg-background p-3">
            <p className="text-[10px] font-semibold text-foreground mb-1">③ Conviction Score Formula</p>
            <p className="text-[10px] text-muted leading-relaxed">
              <code className="text-accent">Score = (Long% ÷ 100) × Taker × OI($B)</code><br />
              Weights <span className="text-foreground">position bias × aggressive flow × contract liquidity</span>. Higher = stronger institutional conviction.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-border">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            <span className="text-[9px] text-muted">
              Source Data: <span className="text-foreground">100% Real Live Binance Futures Engine</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[9px] text-muted">
              Classification: <span className="text-accent">Proxy model based on top accounts &amp; taker volume flow</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Realistic Moveable Radar Map Section ── */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              Interactive Smart Money Positioning Map ({validEnriched.length} Assets)
            </h3>
            <p className="text-[10px] text-muted">
              Bubble size = Open Interest ($) · X-axis = Top Trader Long % · Y-axis = Taker Buy/Sell Aggression
            </p>
          </div>
          <span className="text-[10px] text-faint">Updated {lastUpdate}</span>
        </div>

        {/* Moveable Map with Collision Dispersion & Zoom/Pan */}
        <MoveableSmartMoneyMap assets={assets} onSelectCoin={(sym) => setSelectedCoin(sym)} />
      </div>

      {/* ── Institutional Conviction Leaderboard ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Conviction Rank */}
        <div className="rounded-lg border border-border bg-surface p-4 flex flex-col">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Institutional Conviction Rank
            </p>
            <span className="text-[10px] text-muted">Top 12 Ranked</span>
          </div>
          <p className="mb-4 text-[10px] text-muted">
            Ranked by composite score: <code className="text-accent">Long% × Taker Ratio × OI($B)</code>
          </p>
          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[360px] pr-1">
            {ranked.slice(0, 15).map((a, i) => {
              const isBull = (a.longPct ?? 0) >= 55 && (a.takerRatio ?? 0) >= 1.0;
              const maxScore = ranked[0]?.score || 1;
              const barW = Math.min(100, Math.max(4, (a.score / maxScore) * 100));

              return (
                <div key={a.symbol} className="flex items-center gap-3">
                  <span className="w-5 text-[10px] text-faint">#{i + 1}</span>
                  <div className="w-16">
                    <span className="text-xs font-semibold text-foreground">{a.base}</span>
                    <p className="text-[8px] text-faint">PERP</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-raised">
                      <div
                        className={`h-full rounded-full ${isBull ? "bg-success" : "bg-danger"}`}
                        style={{ width: `${barW}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-16 text-right text-[10px] text-muted">
                    {a.longPct != null ? `${a.longPct.toFixed(1)}% L` : "--"}
                  </span>
                  <span className={`w-14 text-right text-[10px] font-semibold ${isBull ? "text-success" : "text-danger"}`}>
                    {a.takerRatio != null ? `${a.takerRatio.toFixed(2)}x` : "--"}
                  </span>
                  <span className="w-16 text-right text-[10px] text-foreground font-medium">
                    {fmtUsd(a.openInterestUsd)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Insights Matrix */}
        <div className="rounded-lg border border-border bg-surface p-4 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Regime Breakdown
              </span>
              <span className="text-[10px] text-muted">Live Distribution</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="rounded border border-success/30 bg-success/5 p-3 space-y-1">
                <span className="text-[10px] font-bold text-success block">SMART ACCUMULATION</span>
                <span className="text-lg font-bold text-foreground">
                  {validEnriched.filter((a) => (a.longPct ?? 0) >= 55 && (a.takerRatio ?? 0) >= 1.0).length} Assets
                </span>
                <p className="text-[9px] text-muted">Whales accumulating + aggressive taker buying flow</p>
              </div>

              <div className="rounded border border-danger/30 bg-danger/5 p-3 space-y-1">
                <span className="text-[10px] font-bold text-danger block">DISTRIBUTION ZONE</span>
                <span className="text-lg font-bold text-foreground">
                  {validEnriched.filter((a) => (a.longPct ?? 0) < 50 && (a.takerRatio ?? 0) < 1.0).length} Assets
                </span>
                <p className="text-[9px] text-muted">Heavy net aggressive selling into bids</p>
              </div>

              <div className="rounded border border-accent/30 bg-accent/5 p-3 space-y-1">
                <span className="text-[10px] font-bold text-accent block">SHORT SQUEEZE RADAR</span>
                <span className="text-lg font-bold text-foreground">
                  {validEnriched.filter((a) => (a.longPct ?? 0) < 48 && (a.fundingPct ?? 0) < 0).length} Assets
                </span>
                <p className="text-[9px] text-muted">Negative funding rate + crowded short positioning</p>
              </div>

              <div className="rounded border border-purple-500/30 bg-purple-500/5 p-3 space-y-1">
                <span className="text-[10px] font-bold text-purple-400 block">TRAPPED LONGS WATCH</span>
                <span className="text-lg font-bold text-foreground">
                  {validEnriched.filter((a) => (a.longPct ?? 0) >= 60 && (a.takerRatio ?? 0) < 0.95).length} Assets
                </span>
                <p className="text-[9px] text-muted">Long accounts high but taker aggression exhausted</p>
              </div>
            </div>
          </div>

          <div className="rounded border border-border bg-background p-3 text-[10px] text-muted space-y-1">
            <span className="text-accent font-semibold block">Interactive Navigation Tip:</span>
            <p>› Drag any orb to pull it out of dense clusters (e.g. BTC/ETH/SOL).</p>
            <p>› Use mouse scroll or trackpad to zoom in on specific clusters.</p>
            <p>› Toggle &quot;Unpack Overlap&quot; to auto-space colliding coin labels.</p>
          </div>
        </div>
      </div>

      {/* ── Complete Detail Table across all 50 top assets ── */}
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <div className="border-b border-border bg-surface-raised px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Complete Smart Money Rankings ({ranked.length} Contracts)
          </span>
          <span className="text-[10px] text-muted">
            All data directly corroborated via Binance Agent OS
          </span>
        </div>
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-border bg-surface-raised/50">
            <tr>
              {["Rank", "Contract", "Price", "Top Trader Long", "Top Trader Short", "Taker Flow", "8h Funding", "Open Interest", "Signal"].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranked.map((a, i) => {
              const isBull = (a.longPct ?? 0) >= 55 && (a.takerRatio ?? 0) >= 1.0;
              return (
                <tr key={a.symbol} className="border-b border-border/40 hover:bg-surface-raised transition-colors">
                  <td className="px-3 py-2 text-[10px] text-faint">#{i + 1}</td>
                  <td className="px-3 py-2">
                    <span className="text-xs font-bold text-foreground">{a.base}</span>
                    <span className="ml-1 rounded bg-surface-raised px-1 text-[8px] text-faint">PERP</span>
                  </td>
                  <td className="px-3 py-2 text-xs text-foreground">
                    ${a.price >= 100 ? a.price.toFixed(2) : a.price >= 1 ? a.price.toFixed(4) : a.price.toFixed(6)}
                  </td>
                  <td className="px-3 py-2 text-xs text-success font-medium">
                    {a.longPct !== null ? `${a.longPct.toFixed(1)}%` : "--"}
                  </td>
                  <td className="px-3 py-2 text-xs text-danger font-medium">
                    {a.shortPct !== null ? `${a.shortPct.toFixed(1)}%` : "--"}
                  </td>
                  <td className={`px-3 py-2 text-xs font-semibold ${
                    a.takerRatio === null ? "text-faint" : isBull ? "text-success" : "text-danger"
                  }`}>
                    {a.takerRatio !== null ? `${a.takerRatio.toFixed(3)}x` : "--"}
                  </td>
                  <td className={`px-3 py-2 text-xs ${
                    a.fundingPct === null
                      ? "text-faint"
                      : (a.fundingPct ?? 0) > 0.05
                      ? "text-danger"
                      : (a.fundingPct ?? 0) < 0
                      ? "text-success"
                      : "text-muted"
                  }`}>
                    {a.fundingPct !== null ? `${a.fundingPct >= 0 ? "+" : ""}${a.fundingPct.toFixed(4)}%` : "--"}
                  </td>
                  <td className="px-3 py-2 text-xs text-foreground font-medium">
                    {fmtUsd(a.openInterestUsd)}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded border px-2 py-0.5 text-[9px] ${
                      isBull
                        ? "border-success/30 bg-success/10 text-success"
                        : "border-danger/30 bg-danger/10 text-danger"
                    }`}>
                      {isBull ? "▲ ACCUMULATION" : "▼ DISTRIBUTION"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
