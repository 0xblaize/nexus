"use client";

import { useEffect, useRef } from "react";

export function GlobalCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const ring = ringRef.current;

    if (!cursor || !ring || window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let frameId = 0;
    let active = true;

    cursor.style.left = `${mouseX}px`;
    cursor.style.top = `${mouseY}px`;
    ring.style.left = `${ringX}px`;
    ring.style.top = `${ringY}px`;

    const grow = () => {
      cursor.style.width = "6px";
      cursor.style.height = "6px";
      ring.style.width = "54px";
      ring.style.height = "54px";
      ring.style.borderColor = "rgba(200, 255, 0, 0.7)";
    };

    const shrink = () => {
      cursor.style.width = "10px";
      cursor.style.height = "10px";
      ring.style.width = "36px";
      ring.style.height = "36px";
      ring.style.borderColor = "rgba(200, 255, 0, 0.35)";
    };

    const handleMove = (event: MouseEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      cursor.style.left = `${mouseX}px`;
      cursor.style.top = `${mouseY}px`;
    };

    const handleOver = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("button, a, input, textarea, [data-cursor='expand']")) {
        grow();
      } else {
        shrink();
      }
    };

    const handleDown = () => {
      ring.style.transform = "translate(-50%, -50%) scale(0.82)";
    };

    const handleUp = () => {
      ring.style.transform = "translate(-50%, -50%) scale(1)";
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseover", handleOver, true);
    document.addEventListener("mousedown", handleDown);
    document.addEventListener("mouseup", handleUp);

    function animateRing() {
      if (!active || !ring) return;

      ringX += (mouseX - ringX) * 0.13;
      ringY += (mouseY - ringY) * 0.13;

      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;

      frameId = window.requestAnimationFrame(animateRing);
    }

    frameId = window.requestAnimationFrame(animateRing);

    return () => {
      active = false;
      window.cancelAnimationFrame(frameId);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseover", handleOver, true);
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("mouseup", handleUp);
    };
  }, []);

  return (
    <>
      <div aria-hidden="true" className="cursor" ref={cursorRef} />
      <div aria-hidden="true" className="cursor-ring" ref={ringRef} />
    </>
  );
}
