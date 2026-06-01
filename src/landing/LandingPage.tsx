"use client";

import { useEffect, useRef } from "react";

import { FooterMetadata } from "@/components/landing/FooterMetadata";
import { HeaderRegistry } from "@/components/landing/HeaderRegistry";
import { HeroContent } from "@/components/landing/HeroContent";
import { Viewport3D } from "@/components/landing/Viewport3D";
import {
  architectureItems,
  badgeItems,
  signalItems,
  tickerItems,
  trackItems,
} from "@/landing/landing-data";
import { setupLandingEffects } from "@/landing/landing-effects";

export default function LandingPage() {
  const rootRef = useRef<HTMLElement | null>(null);
  const terminalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return setupLandingEffects({
      root: rootRef.current,
      cursor: null,
      ring: null,
      panel: null,
      canvas: null,
      terminal: terminalRef.current,
    });
  }, []);

  return (
    <main ref={rootRef}>
      <HeaderRegistry />

      <section className="hero">
        <HeroContent />
        <Viewport3D />
      </section>

      <div className="ticker-wrap">
        <div className="ticker-track">
          {tickerItems.map((item, index) => (
            <div className="tick-item" key={`${item.text}-${index}`}>
              <div className={item.live ? "tick-dot red" : "tick-dot"} />
              {item.text}
            </div>
          ))}
        </div>
      </div>

      <section className="content" id="arch">
        <div className="s-label">Architecture</div>
        <h2 className="s-title rev">
          THREE AGENTS.
          <br />
          ONE VERDICT.
        </h2>
        <div className="arch-grid rev">
          {architectureItems.map((item) => (
            <div className="arch-cell" key={item.badge}>
              <div className="abadge">{item.badge}</div>
              <div className="arch-num">{item.number}</div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="glow-div" />

      <section className="content">
        <div className="s-label">Live Intelligence</div>
        <h2 className="s-title rev">
          WATCH IT
          <br />
          THINK.
        </h2>
        <div className="term-wrap rev">
          <div className="term-bar">
            <div className="td r" />
            <div className="td a" />
            <div className="td g" />
            <span className="term-title">nexus-agent - live execution log</span>
          </div>
          <div className="term-body" ref={terminalRef} />
        </div>
      </section>

      <section className="content" id="signals">
        <div className="s-label">Signal Types</div>
        <h2 className="s-title rev">
          WHAT WE
          <br />
          HUNT.
        </h2>
        <div className="sig-grid rev">
          {signalItems.map((item) => (
            <div className="sig-card" key={item.title}>
              <span className="sig-icon">{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="content" id="tracks">
        <div className="s-label">Hackathon Alignment</div>
        <h2 className="s-title rev">
          BUILT FOR
          <br />
          THREE TRACKS.
        </h2>
        <div className="track-grid rev">
          {trackItems.map((item) => (
            <div className="track-card" key={item.label}>
              <div className="track-label">{item.label}</div>
              <div className="track-num">{item.score}</div>
              <div className="track-desc">{item.body}</div>
            </div>
          ))}
        </div>
        <div className="badges rev">
          {badgeItems.map((item) => (
            <div className="badge" key={item}>
              <div className="bdot" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <FooterMetadata />
    </main>
  );
}
