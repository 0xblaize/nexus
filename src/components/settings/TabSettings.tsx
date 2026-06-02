"use client";

import { useState } from "react";

import type { SettingsData } from "@/types/nexus";

const PRESETS = [
  { label: "Sensitive", value: 50 },
  { label: "Default", value: 65 },
  { label: "Strict", value: 80 },
] as const;

const REFRESH_OPTIONS = ["1h", "3h", "6h", "12h", "24h"] as const;
const LANGUAGES = ["English", "French", "German", "Spanish"] as const;

export function TabSettings({ initialSettings }: { initialSettings: SettingsData }) {
  const [settings, setSettings] = useState<SettingsData>(initialSettings);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [utilityBusy, setUtilityBusy] = useState<"" | "password" | "billing">("");
  const [error, setError] = useState("");

  function update<K extends keyof SettingsData>(key: K, value: SettingsData[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    setSaveState("saving");
    setError("");

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Unable to save settings.");
      }

      const payload = (await response.json()) as { settings: SettingsData };
      setSettings(payload.settings);
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 2500);
    } catch (saveError) {
      setSaveState("idle");
      setError(saveError instanceof Error ? saveError.message : "Unable to save settings.");
    }
  }

  async function runUtilityAction(action: "change-password" | "billing-portal") {
    setError("");
    setUtilityBusy(action === "change-password" ? "password" : "billing");

    try {
      const response = await fetch("/api/settings/utilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        url?: string;
      };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Unable to complete settings action.");
      }

      window.open(payload.url, "_blank", "noopener,noreferrer");
    } catch (utilityError) {
      setError(
        utilityError instanceof Error
          ? utilityError.message
          : "Unable to complete settings action.",
      );
    } finally {
      setUtilityBusy("");
    }
  }

  const usagePercent = settings.usageTotal
    ? Math.max(0, Math.min(100, Math.round((settings.usageUsed / settings.usageTotal) * 100)))
    : 0;

  return (
    <div className="mx-auto w-full max-w-[680px]" style={{ paddingTop: 2, zoom: 0.9 }}>
      <div className="mb-10">
        <div className="mb-4 flex items-center gap-4">
          <span className="h-px w-10 bg-[#c8ff00]" />
          <span className="font-mono text-[16px] font-medium uppercase tracking-[0.36em] text-[#c8ff00]">
            Settings
          </span>
        </div>
        <h1
          className="font-hand leading-[0.95] tracking-[0.01em] text-white"
          style={{ fontSize: "clamp(52px, 5.8vw, 78px)" }}
        >
          CONTROL
          <br />
          PANEL
        </h1>
        <p className="mt-2 font-mono text-[16px] tracking-[0.01em] text-[#56565d]">
          Preferences, monitoring rules, and delivery setup.
        </p>
      </div>

      {error ? (
        <div className="mb-6 border border-[#ff2d2d]/40 bg-[#ff2d2d]/5 px-5 py-4 font-mono text-[12px] tracking-[0.04em] text-[#ff9999]">
          {error}
        </div>
      ) : null}

      <div className="space-y-6">
        <Section title="Profile">
          <Row label="Display name">
            <Input value={settings.displayName} onChange={(value) => update("displayName", value)} />
          </Row>
          <Row label="Email address">
            <Input value={settings.email} onChange={(value) => update("email", value)} />
          </Row>
          <Row description="Update your login password and security settings." label="Password">
            <button
              className="border border-[#23283f] px-5 py-3 font-mono text-[13px] uppercase tracking-[0.1em] text-[#c8d2ff] disabled:opacity-50"
              disabled={utilityBusy === "password"}
              onClick={() => runUtilityAction("change-password")}
              type="button"
            >
              {utilityBusy === "password" ? "[...] Opening" : "[!] Change Password"}
            </button>
          </Row>
        </Section>

        <Section title="Alert Thresholds">
          <Row description="Lower values surface earlier signals, higher values reduce noise." label="Score threshold">
            <div className="flex items-center gap-5">
              <input
                className="w-[240px] accent-[#c8ff00]"
                max={95}
                min={30}
                onChange={(event) => update("scoreThreshold", Number(event.target.value))}
                type="range"
                value={settings.scoreThreshold}
              />
              <span className="font-bebas text-[44px] leading-none text-[#d6ff1b]">
                {settings.scoreThreshold}
              </span>
            </div>
          </Row>
          <div className="flex flex-wrap gap-3 px-6 pb-6">
            {PRESETS.map((preset) => (
              <button
                className={[
                  "border px-4 py-2 font-mono text-[13px] uppercase tracking-[0.1em]",
                  settings.scoreThreshold === preset.value
                    ? "border-[#4f5b13] bg-[#182000] text-[#dfff4c]"
                    : "border-[#23232c] text-[#666]",
                ].join(" ")}
                key={preset.label}
                onClick={() => update("scoreThreshold", preset.value)}
                type="button"
              >
                {preset.label} {preset.value}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Watchlist Monitoring">
          <Row description="Controls how often monitored companies are refreshed." label="Auto-refresh interval">
            <div className="flex flex-wrap gap-2">
              {REFRESH_OPTIONS.map((option) => (
                <button
                  className={[
                    "border px-4 py-2 font-mono text-[13px] uppercase tracking-[0.1em]",
                    settings.refreshInterval === option
                      ? "border-[#4f5b13] bg-[#182000] text-[#dfff4c]"
                      : "border-[#23232c] text-[#666]",
                  ].join(" ")}
                  key={option}
                  onClick={() => update("refreshInterval", option)}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
          </Row>
          <Row description="Send a weekly summary of changes across monitored companies." label="Weekly digest">
            <Toggle checked={settings.weeklyDigest} onChange={(value) => update("weeklyDigest", value)} />
          </Row>
        </Section>

        <Section title="Alert Delivery">
          <Row description="Push new acquisition alerts directly into your Teams channel." label="Microsoft Teams">
            <Toggle checked={settings.teamsEnabled} onChange={(value) => update("teamsEnabled", value)} />
          </Row>
          {settings.teamsEnabled ? (
            <div className="border-t border-[#15151c] px-6 py-5">
              <div className="mb-2 font-mono text-[12px] tracking-[0.12em] text-[#555]">Teams webhook URL</div>
              <Input value={settings.teamsWebhook} onChange={(value) => update("teamsWebhook", value)} />
            </div>
          ) : null}
          <Row description="Send the same alert packets to your primary email inbox." label="Email alerts">
            <Toggle checked={settings.emailAlerts} onChange={(value) => update("emailAlerts", value)} />
          </Row>
          <Row description="Mirror signal events into Slack for the deal team." label="Slack notifications">
            <Toggle checked={settings.slackAlerts} onChange={(value) => update("slackAlerts", value)} />
          </Row>
        </Section>

        <Section title="Appearance">
          <Row description="This application is designed for dark mode." label="Dark mode">
            <Toggle checked={settings.darkMode} onChange={(value) => update("darkMode", value)} />
          </Row>
          <Row label="Language">
            <select
              className="h-[48px] min-w-[220px] border border-[#23232c] bg-[#101015] px-4 font-mono text-[14px] text-[#b7b7bd] outline-none"
              onChange={(event) => update("language", event.target.value)}
              value={settings.language}
            >
              {LANGUAGES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Row>
        </Section>

        <Section title="Account And Plan">
          <Row label="Current plan">
            <span className="border border-[#4f5b13] bg-[#182000] px-4 py-2 font-mono text-[13px] uppercase tracking-[0.1em] text-[#dfff4c]">
              {settings.currentPlan}
            </span>
          </Row>
          <div className="border-t border-[#15151c] px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-mono text-[14px] text-[#777]">API usage</div>
                <div className="mt-2 font-mono text-[13px] tracking-[0.08em] text-[#555]">
                  {settings.usageUsed.toLocaleString()} / {settings.usageTotal.toLocaleString()} signals
                </div>
              </div>
            </div>
            <div className="mt-4 h-3 bg-[#111118]">
              <div className="h-full bg-[#c8ff00]" style={{ width: `${usagePercent}%` }} />
            </div>
          </div>
          <Row label="Billing">
            <button
              className="border border-[#23283f] px-5 py-3 font-mono text-[13px] uppercase tracking-[0.1em] text-[#c8d2ff] disabled:opacity-50"
              disabled={utilityBusy === "billing"}
              onClick={() => runUtilityAction("billing-portal")}
              type="button"
            >
              {utilityBusy === "billing" ? "[...] Opening" : "[#] Billing Portal"}
            </button>
          </Row>
          <div className="border-t border-[#15151c] px-6 py-5 font-mono text-[12px] uppercase tracking-[0.12em] text-[#4d4d54]">
            Version {settings.version}
          </div>
        </Section>

        <button
          className={[
            "w-full px-6 py-5 text-center font-mono text-[18px] uppercase tracking-[0.16em] transition-colors",
            saveState === "saved" ? "bg-[#28c840] text-black" : "bg-[#c8ff00] text-black",
          ].join(" ")}
          onClick={handleSave}
          type="button"
        >
          {saveState === "saving" ? "Saving..." : saveState === "saved" ? "[OK] Saved" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-[#23232c] bg-[#0e1014]">
      <div className="border-b border-[#1a1a22] bg-[#0a0b0d] px-6 py-4 font-mono text-[14px] uppercase tracking-[0.22em] text-[#c8ff00]">
        {title}
      </div>
      <div>{children}</div>
    </section>
  );
}

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-t border-[#15151c] px-6 py-5 first:border-t-0">
      <div className="max-w-[300px]">
        <div className="font-mono text-[14px] tracking-[0.08em] text-[#777]">{label}</div>
        {description ? (
          <div className="mt-2 font-mono text-[12px] leading-6 tracking-[0.04em] text-[#4e4e55]">
            {description}
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-end">{children}</div>
    </div>
  );
}

function Input({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      className="h-[48px] min-w-[240px] border border-[#23232c] bg-[#101015] px-4 font-mono text-[14px] text-[#b7b7bd] outline-none"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    />
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      aria-pressed={checked}
      className={[
        "relative h-[30px] w-[62px] border transition-colors",
        checked ? "border-[#4f5b13] bg-[#182000]" : "border-[#23232c] bg-[#111118]",
      ].join(" ")}
      onClick={() => onChange(!checked)}
      type="button"
    >
      <span
        className={[
          "absolute top-[3px] h-[22px] w-[22px] transition-all",
          checked ? "left-[35px] bg-[#c8ff00]" : "left-[3px] bg-[#4a4a51]",
        ].join(" ")}
      />
    </button>
  );
}
