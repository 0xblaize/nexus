"use client";

import { useEffect, useRef } from "react";

import { setupMonolithCanvas } from "@/landing/monolith-canvas";

export function Viewport3D() {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    return setupMonolithCanvas(panelRef.current, canvasRef.current);
  }, []);

  return (
    <div className="hero-3d" id="h3d" ref={panelRef}>
      <canvas aria-hidden="true" id="mc" ref={canvasRef} />
    </div>
  );
}
