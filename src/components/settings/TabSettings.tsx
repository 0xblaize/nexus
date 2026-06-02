"use client";

import { useEffect, useRef, useState } from "react";

import type { SettingsData } from "@/types/nexus";

const PRESETS = [
  { label: "Sensitive", value: 50 },
  { label: "Default", value: 65 },
  { label: "Strict", value: 80 },
] as const;

const REFRESH_OPTIONS = ["1h", "3h", "6h", "12h", "24h"] as const;
const LANGUAGES = ["English", "French", "German", "Spanish"] as const;

interface SessionUserSettings {
  name: string;
  email: string;
  plan: string;
}

function isPaidPlan(plan: string) {
  return plan === "PRO_ANALYST" || plan.toLowerCase().includes("pro");
}

function mergeSessionSettings(settings: SettingsData, sessionUser: SessionUserSettings | null): SettingsData {
  if (!sessionUser) return settings;
  const paidPlan = isPaidPlan(sessionUser.plan);

  return {
    ...settings,
    displayName: sessionUser.name || settings.displayName,
    email: sessionUser.email || settings.email,
    currentPlan: paidPlan ? "Pro analyst" : "Free developer",
    teamsEnabled: paidPlan ? settings.teamsEnabled : false,
    teamsWebhook: paidPlan ? settings.teamsWebhook : "",
    slackAlerts: paidPlan ? settings.slackAlerts : false,
  };
}

export function TabSettings({
  initialSettings,
  sessionUser,
}: {
  initialSettings: SettingsData;
  sessionUser: SessionUserSettings | null;
}) {
  const [settings, setSettings] = useState<SettingsData>(() =>
    mergeSessionSettings(initialSettings, sessionUser),
  );
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [utilityBusy, setUtilityBusy] = useState<"" | "password" | "billing" | "checkout">("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const skipAutosave = useRef(true);
  const paidPlan = isPaidPlan(sessionUser?.plan || settings.currentPlan);

  useEffect(() => {
    setSettings((current) => mergeSessionSettings(current, sessionUser));
  }, [sessionUser]);

  useEffect(() => {
    if (skipAutosave.current) {
      skipAutosave.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void persistSettings(settings, { quiet: true });
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [settings]);

  function update<K extends keyof SettingsData>(key: K, value: SettingsData[K]) {
    if (!paidPlan && (key === "teamsEnabled" || key === "teamsWebhook" || key === "slackAlerts")) {
      openUpgradePrompt();
      return;
    }

    setSettings((current) => ({ ...current, [key]: value }));
  }

  function openUpgradePrompt() {
    setError("");
    setNotice("Email alerts remain free. Slack and Microsoft Teams require the $9/mo Premium plan.");
    setUpgradeOpen(true);
  }

  async function persistSettings(nextSettings: SettingsData, options: { quiet?: boolean } = {}) {
    if (!options.quiet) {
      setSaveState("saving");
    }
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextSettings),
      });

      if (!response.ok) {
        throw new Error("Unable to save settings.");
      }

      const payload = (await response.json()) as { settings: SettingsData };
      const mergedSettings = mergeSessionSettings(payload.settings, sessionUser);
      if (JSON.stringify(mergedSettings) !== JSON.stringify(nextSettings)) {
        setSettings(mergedSettings);
      }
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 2500);
    } catch (saveError) {
      setSaveState("idle");
      setError(saveError instanceof Error ? saveError.message : "Unable to save settings.");
    }
  }

  async function handleSave() {
    await persistSettings(settings);
  }

  async function runUtilityAction(action: "change-password" | "billing-portal") {
    setError("");
    setNotice("");
    setUtilityBusy(action === "change-password" ? "password" : "billing");

    try {
      const response = await fetch("/api/settings/utilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        notice?: string;
        url?: string;
      };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Unable to complete settings action.");
      }

      if (payload.url === "#" || payload.notice) {
        setNotice(payload.notice || "Billing portal is not connected for this account.");
        return;
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

  async function handleUpgradeClick() {
    setError("");
    setNotice("");
    setUtilityBusy("checkout");

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const payload = (await response.json().catch(() => ({}))) as {
        alreadyPremium?: boolean;
        error?: string;
        notice?: string;
        url?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to start checkout.");
      }

      if (payload.alreadyPremium) {
        setUpgradeOpen(false);
        setNotice("This account already has Premium access.");
        return;
      }

      if (!payload.url || payload.url === "#") {
        setNotice(payload.notice || "Checkout is not connected yet. Configure BILLING_CHECKOUT_URL for the $9/mo Premium subscription.");
        return;
      }

      window.location.href = payload.url;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Unable to start checkout.");
    } finally {
      setUtilityBusy("");
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Delete this NEXUS account and all linked settings/watchlist data? This cannot be undone.",
    );
    if (!confirmed) return;

    setError("");
    setNotice("");
    setDeleteBusy(true);

    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        redirectTo?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to delete account.");
      }

      window.localStorage.clear();
      window.sessionStorage.clear();
      window.location.href = payload.redirectTo || "/";
    } catch (deleteError) {
      setDeleteBusy(false);
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete account.");
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
          CONTROL PANEL
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
      {notice ? (
        <div className="mb-6 border border-[#ff9900]/40 bg-[#ff9900]/5 px-5 py-4 font-mono text-[12px] tracking-[0.04em] text-[#d7b37a]">
          {notice}
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
          <div className="relative">
            <Row description="Email summary metrics and alert packets are available on every account." label="Email alerts">
              <Toggle checked={settings.emailAlerts} onChange={(value) => update("emailAlerts", value)} />
            </Row>
            <Row
              badge="PRO"
              description="Push high-severity risk cards directly into enterprise Teams channels."
              label="Microsoft Teams"
            >
              <Toggle
                checked={paidPlan && settings.teamsEnabled}
                locked={!paidPlan}
                onChange={(value) => update("teamsEnabled", value)}
              />
            </Row>
            {paidPlan && settings.teamsEnabled ? (
              <div className="border-t border-[#15151c] px-6 py-5">
                <div className="mb-2 font-mono text-[12px] tracking-[0.12em] text-[#555]">Teams webhook URL</div>
                <Input value={settings.teamsWebhook} onChange={(value) => update("teamsWebhook", value)} />
              </div>
            ) : !paidPlan ? (
              <LockedWebhookFields onInteract={openUpgradePrompt} />
            ) : null}
            <Row
              badge="PRO"
              description="Mirror signal events into continuous enterprise Slack channels."
              label="Slack notifications"
            >
              <Toggle
                checked={paidPlan && settings.slackAlerts}
                locked={!paidPlan}
                onChange={(value) => update("slackAlerts", value)}
              />
            </Row>
            {!paidPlan && upgradeOpen ? (
              <UpgradeOverlay
                busy={utilityBusy === "checkout"}
                onClose={() => setUpgradeOpen(false)}
                onUpgradeClick={handleUpgradeClick}
              />
            ) : null}
          </div>
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
              disabled={utilityBusy === "billing" || utilityBusy === "checkout"}
              onClick={() => (paidPlan ? runUtilityAction("billing-portal") : handleUpgradeClick())}
              type="button"
            >
              {utilityBusy === "billing" || utilityBusy === "checkout"
                ? "[...] Opening"
                : paidPlan
                  ? "[#] Billing Portal"
                  : "[#] Activate Enterprise Access ($9/mo)"}
            </button>
          </Row>
          <div className="border-t border-[#3a1616] bg-[#160909] px-6 py-5">
            <div className="font-mono text-[14px] uppercase tracking-[0.18em] text-[#ff7676]">
              Danger Zone
            </div>
            <div className="mt-2 max-w-[420px] font-mono text-[12px] leading-6 tracking-[0.04em] text-[#805b5b]">
              Permanently delete this account, local profile state, settings records, and watchlist data.
            </div>
            <button
              className="mt-4 border border-[#ff2d2d]/50 bg-[#2a0d0d] px-5 py-3 font-mono text-[13px] uppercase tracking-[0.1em] text-[#ff9999] disabled:opacity-50"
              disabled={deleteBusy}
              onClick={handleDeleteAccount}
              type="button"
            >
              {deleteBusy ? "[...] Deleting" : "[!] DELETE ACCOUNT"}
            </button>
          </div>
          <div className="border-t border-[#15151c] px-6 py-5 font-mono text-[12px] uppercase tracking-[0.12em] font-medium text-[#9fb5c8]">
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

function LockedWebhookFields({ onInteract }: { onInteract: () => void }) {
  return (
    <div className="border-t border-[#15151c] px-6 py-5">
      <div className="mb-3 font-mono text-[12px] tracking-[0.12em] text-[#555]">
        Enterprise webhook routing
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {["Teams webhook URL", "Slack webhook URL"].map((label) => (
          <label className="block" key={label}>
            <span className="sr-only">{label}</span>
            <input
              className="h-[46px] w-full cursor-pointer border border-[#29221a] bg-[#100f0d] px-4 font-mono text-[12px] text-[#7d6a4d] outline-none"
              onClick={onInteract}
              onFocus={onInteract}
              placeholder={`${label} locked`}
              readOnly
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function UpgradeOverlay({
  busy,
  onClose,
  onUpgradeClick,
}: {
  busy: boolean;
  onClose: () => void;
  onUpgradeClick: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center border border-dashed border-[#4c3c1a] bg-black/90 p-6 backdrop-blur-sm">
      <button
        aria-label="Close upgrade overlay"
        className="absolute right-4 top-4 border border-[#333] px-3 py-1 font-mono text-[12px] text-[#777]"
        onClick={onClose}
        type="button"
      >
        x
      </button>
      <div className="max-w-[420px] text-center">
        <div className="font-mono text-[13px] font-bold uppercase tracking-[0.24em] text-[#ffb020]">
          Upgrade to Enterprise Alerts
        </div>
        <p className="mt-4 font-mono text-[13px] leading-7 tracking-[0.03em] text-[#c9c1ad]">
          Enterprise integrations (Slack & Microsoft Teams) require a Premium subscription.
          Upgrade your workspace access for $9/month to activate real-time team dispatch pipelines.
        </p>
        <div className="mx-auto mt-5 w-fit border border-[#2b2b31] bg-[#101015] px-6 py-4">
          <span className="font-bebas text-[46px] leading-none text-white">$9</span>
          <span className="ml-2 font-mono text-[12px] uppercase tracking-[0.12em] text-[#777]">/mo</span>
        </div>
        <button
          className="mt-5 w-full bg-[#c8ff00] px-5 py-4 font-mono text-[13px] font-bold uppercase tracking-[0.12em] text-black transition-colors hover:bg-[#dfff4c] disabled:opacity-60"
          disabled={busy}
          onClick={onUpgradeClick}
          type="button"
        >
          {busy ? "[...] STARTING CHECKOUT" : "[#] ACTIVATE ENTERPRISE ACCESS ($9/mo)"}
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
  badge,
  children,
}: {
  label: string;
  description?: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-t border-[#15151c] px-6 py-5 first:border-t-0">
      <div className="max-w-[300px]">
        <div className="flex items-center gap-2 font-mono text-[14px] tracking-[0.08em] text-[#777]">
          <span>{label}</span>
          {badge ? (
            <span className="bg-[#ff9900] px-1.5 py-0.5 text-[9px] font-black tracking-[0.12em] text-black">
              {badge}
            </span>
          ) : null}
        </div>
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
  disabled = false,
  locked = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  locked?: boolean;
}) {
  return (
    <button
      aria-disabled={locked || disabled}
      aria-pressed={checked}
      className={[
        "relative h-[30px] w-[62px] border transition-colors",
        disabled || locked ? "cursor-pointer opacity-65" : "",
        checked ? "border-[#4f5b13] bg-[#182000]" : "border-[#23232c] bg-[#111118]",
      ].join(" ")}
      disabled={disabled}
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
