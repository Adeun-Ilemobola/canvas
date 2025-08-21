"use client";
import { Camera, NodeData, Vec2 } from "@/lib/zod";
import React, { useCallback, useMemo, useRef, useState } from "react";



type Props = {
  width?: number | string;
  height?: number | string;
  background?: string;
  gridSize?: number;         // world units between grid lines
  minScale?: number;
  maxScale?: number;


  setNodes: React.Dispatch<React.SetStateAction<NodeData[]>>
  nodes: NodeData[]

  setSelectedId: React.Dispatch<React.SetStateAction<string | null>>
  selectedId: string | null
};

// ---------- Transform helpers ----------
function worldToScreen(camera: Camera, p: Vec2): Vec2 {
  return { x: camera.x + p.x * camera.scale, y: camera.y + p.y * camera.scale };
}
function screenToWorld(camera: Camera, p: Vec2): Vec2 {
  return { x: (p.x - camera.x) / camera.scale, y: (p.y - camera.y) / camera.scale };
}

export default function CanvasBoard({
  width = "100%",
  height = "100%",
  background = "#0b0f19",
  gridSize = 40,
  minScale = 0.2,
  maxScale = 4,

  setNodes,
  nodes,

  setSelectedId,
  selectedId
}: Props) {
  // Camera and nodes
  const [camera, setCamera] = useState<Camera>({ x: 200, y: 120, scale: 1 });
;

  // dragging state
  const isPanningRef = useRef(false);
  const lastScreenRef = useRef<Vec2 | null>(null);
  const draggingNodeIdRef = useRef<string | null>(null);
  const dragOffsetWorldRef = useRef<Vec2>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  // ---------- Zoom ----------
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
    //   get the position of the mouse cursor relative to the canvas
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

       // Calculate new scale based on wheel delta
      const delta = e.deltaY;
      const zoomFactor = Math.exp(-delta * 0.0015); // smooth wheel zoom
      const newScale = Math.min(maxScale, Math.max(minScale, camera.scale * zoomFactor));

      if (newScale === camera.scale) return;

      // keep cursor anchored
      const pre = screenToWorld(camera, { x: sx, y: sy });
      const nx = sx - pre.x * newScale;
      const ny = sy - pre.y * newScale;

      setCamera((c) => ({ ...c, x: nx, y: ny, scale: newScale }));
    },
    [camera, maxScale, minScale]
  );

  // ---------- Pan background ----------
  const beginPan = useCallback((e: React.PointerEvent) => {
    // Optional: only pan with middle click or right click or Space+LMB
    const isMiddle = e.button === 1;
    const isRight = e.button === 2;
    const isSpacePan = e.button === 0 && (e.nativeEvent as PointerEvent).ctrlKey; // tweak to taste

    if (!isMiddle && !isRight && !isSpacePan) return;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isPanningRef.current = true;
    lastScreenRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onPointerMoveBackground = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanningRef.current || !lastScreenRef.current) return;
      const curr = { x: e.clientX, y: e.clientY };
      const last = lastScreenRef.current;
      const dx = curr.x - last.x;
      const dy = curr.y - last.y;

      setCamera((c) => ({ ...c, x: c.x + dx, y: c.y + dy }));
      lastScreenRef.current = curr;
    },
    []
  );

  const endPan = useCallback((e: React.PointerEvent) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      lastScreenRef.current = null;
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    }
  }, []);

  // ---------- Node dragging when the node is selected and left mouse button is pressed ----------
  const onPointerDownNode = useCallback(
    (e: React.PointerEvent, id: string) => {
      e.stopPropagation();
      const rect = (e.currentTarget as HTMLElement).closest("[data-canvas-root]")!.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = screenToWorld(camera, { x: sx, y: sy });

      const node = nodes.find((n) => n.id === id)!;
      dragOffsetWorldRef.current = { x: world.x - node.x, y: world.y - node.y };
      draggingNodeIdRef.current = id;
      setSelectedId(id);

      (containerRef.current as HTMLElement).setPointerCapture(e.pointerId);
    },
    [camera, nodes]
  );

  const onPointerMoveCanvas = useCallback(
    (e: React.PointerEvent) => {
      // Node drag move (if any)
      const draggingId = draggingNodeIdRef.current;
      if (!draggingId) return;
     // get the position of the mouse cursor relative to the canvas
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = screenToWorld(camera, { x: sx, y: sy });
      const offset = dragOffsetWorldRef.current;

      setNodes((prev) =>
        prev.map((n) =>
          n.id === draggingId ? { ...n, x: world.x - offset.x, y: world.y - offset.y } : n
        )
      );
    },
    [camera]
  );

  const onPointerUpCanvas = useCallback((e: React.PointerEvent) => {
    if (draggingNodeIdRef.current) {
      draggingNodeIdRef.current = null;
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      // TODO: snap to grid if desired:
      //setNodes(prev => prev.map(n => n.id===selectedId ? {...n, x: Math.round(n.x/gridSize)*gridSize, y: Math.round(n.y/gridSize)*gridSize} : n));
    }
  }, []);

  // ---------- Background click to deselect ----------
  const onBackgroundClick = useCallback(() => {
    setSelectedId(null);
  }, []);

  // ---------- Grid lines (world-space SVG) ----------
  const gridSvg = useMemo(() => {
    // Draw a grid patch big enough for the viewport.
    // Find world bounds visible in the viewport:
    const viewportW = containerRef.current?.clientWidth ?? 1200;
    const viewportH = containerRef.current?.clientHeight ?? 600;

    const topLeftWorld = screenToWorld(camera, { x: 0, y: 0 });
    const bottomRightWorld = screenToWorld(camera, { x: viewportW, y: viewportH });

    const startX = Math.floor(topLeftWorld.x / gridSize) * gridSize;
    const endX = Math.ceil(bottomRightWorld.x / gridSize) * gridSize;
    const startY = Math.floor(topLeftWorld.y / gridSize) * gridSize;
    const endY = Math.ceil(bottomRightWorld.y / gridSize) * gridSize;

    const verticals: React.ReactElement[] = [];
    for (let x = startX; x <= endX; x += gridSize) {
      const p1 = worldToScreen(camera, { x, y: startY });
      const p2 = worldToScreen(camera, { x, y: endY });
      verticals.push(
        <line key={`vx-${x}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(255,255,255,0.06)" />
      );
    }
    const horizontals: React.ReactElement[] = [];
    for (let y = startY; y <= endY; y += gridSize) {
      const p1 = worldToScreen(camera, { x: startX, y });
      const p2 = worldToScreen(camera, { x: endX, y });
      horizontals.push(
        <line key={`hy-${y}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(255,255,255,0.06)" />
      );
    }
    return (
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        {verticals}
        {horizontals}
      </svg>
    );
  }, [camera, gridSize]);

  // ---------- Node UI ----------
  const NodeCard = React.useMemo(
    () =>
      function NodeCard({ n }: { n: NodeData }) {
        const screenPos = worldToScreen(camera, { x: n.x, y: n.y });
        const selected = n.id === selectedId;

        return (
          <div
            onPointerDown={(e) => onPointerDownNode(e, n.id)}
            style={{
              position: "absolute",
              left: screenPos.x,
              top: screenPos.y,
              width: n.w * camera.scale,
              height: n.h * camera.scale,
               transform: "translate(-50%, -50%)", // center on (x,y)
              borderRadius: 10,
              background: selected ? "rgba(80,160,255,0.15)" : "rgba(255,255,255,0.06)",
              border: selected ? `1px solid ${n.color}` : "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(6px)",
              boxShadow: selected ? `0 0 0 4px ${n.color}` : "0 1px 6px rgba(0,0,0,0.35)",
              color: "white",
              userSelect: "none",
              cursor: "grab",
            }}
          >
            <div style={{ padding: 12, fontSize: Math.max(12, 14 * camera.scale) }}>
              <div style={{ opacity: 0.8, fontWeight: 600 }}>{n.label ?? n.id}</div>
              <div style={{ opacity: 0.6, marginTop: 6, fontSize: Math.max(10, 12 * camera.scale) }}>
                ({n.x.toFixed(0)}, {n.y.toFixed(0)})
              </div>
            </div>
          </div>
        );
      },
    [camera, onPointerDownNode, selectedId]
  );

  return (
    <div
      ref={containerRef}
      data-canvas-root
      onWheel={onWheel}
      onPointerMove={(e) => {
        onPointerMoveBackground(e);
        onPointerMoveCanvas(e);
      }}
      onPointerUp={(e) => {
        endPan(e);
        onPointerUpCanvas(e);
      }}
      onPointerDown={beginPan}
      onClick={onBackgroundClick}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        
        touchAction: "none",
      }}
      className=" h-full w-full relative overflow-hidden border border-gray-600 rounded-md bg-gray-950 shadow-sm  dark:bg-gray-800/40 dark:shadow-none  dark:hover:bg-gray-800/40"
    >
      {/* Grid (drawn in screen space but computed from world) */}
      {gridSvg}

      {/* World layer (single transform is optional since we compute screen pos per node) */}
      {/* Keeping per-node positioning for clarity; for thousands of nodes consider a single parent transform */}
      {nodes.map((n) => (
        <NodeCard key={n.id} n={n} />
      ))}

      {/* HUD */}
      <div
        style={{
          position: "absolute",
          left: 12,
          bottom: 12,
          padding: "6px 10px",
          color: "#c9d4ff",
          background: "rgba(11,15,25,0.6)",
          border: "1px solid #1b2440",
          borderRadius: 8,
          fontSize: 12,
        }}
      >
        scale: {camera.scale.toFixed(2)} | cam: {camera.x.toFixed(0)},{camera.y.toFixed(0)}{" "}
        {selectedId ? `| selected: ${nodes.find((n) => n.id === selectedId)?.label}` : ""}
      </div>
    </div>
  );
}
