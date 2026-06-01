import Link from "next/link";

interface AppSidebarStats {
  activeAlerts: number;
  monitoredCompanies: number;
  reportCount: number;
}

interface AppSidebarProps {
  activeItem?: string;
  stats: AppSidebarStats;
  width?: number;
}

const navItems = [
  { label: "Analyze", href: "/analyze", icon: "[]", badge: null, danger: false, enabled: true },
  { label: "Watchlist", href: "/watchlist", icon: "()", badgeKey: "monitoredCompanies", danger: false, enabled: true },
  { label: "Reports", href: "/reports", icon: "||", badgeKey: "reportCount", danger: false, enabled: true },
  { label: "Signals Feed", href: "/signals", icon: "::", badge: "LIVE", danger: true, enabled: true },
  { label: "Settings", href: "/settings", icon: "--", badge: null, danger: false, enabled: false },
] as const;

export function AppSidebar({ activeItem = "Analyze", stats, width = 320 }: AppSidebarProps) {
  return (
    <aside
      className="fixed bottom-0 left-0 top-0 z-40 flex w-0 flex-col overflow-hidden border-r border-[#1a1a22] bg-[#040406]"
      style={{ width }}
    >
      <div className="border-b border-[#1a1a22] px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-[40px] w-[40px] place-items-center bg-[#c8ff00] text-black">
            <span className="font-mono text-[15px] leading-none">N</span>
          </div>
          <div>
            <div className="font-hand text-[36px] leading-none tracking-[0.08em] text-white">
              NEXUS
            </div>
            <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.38em] text-[#33333a]">
              M&A Intelligence
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-[#1a1a22] px-6 py-4">
        <div className="flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.2em] text-[#595961]">
          <span className="h-3 w-3 rounded-full bg-[#28c840] shadow-[0_0_16px_rgba(40,200,64,0.8)]" />
          Agent Online
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 py-4" role="navigation">
        {navItems.map((item) => {
          const isActive = item.label === activeItem;
          const keyedBadge =
            "badgeKey" in item ? String(stats[item.badgeKey]) : item.badge;
          const itemClass = [
            "flex h-[58px] items-center justify-between border px-5 text-left font-mono text-[13px] uppercase tracking-[0.22em] transition-colors",
            isActive
              ? "border-[#4f5b13] bg-[#182000] text-[#dfff4c]"
              : item.enabled
                ? "border-transparent text-[#4d4d54] hover:border-[#1a1a22] hover:text-white"
                : "border-transparent text-[#34343b]",
          ].join(" ");

          const badge = keyedBadge ? (
            <span
              className={[
                "border px-2 py-1 text-[10px] tracking-[0.14em]",
                isActive
                  ? "border-[#708115] text-[#dfff4c]"
                  : item.danger
                    ? "border-[#ff2d2d]/45 text-[#ff2d2d]"
                    : "border-[#202028] text-[#555]",
              ].join(" ")}
            >
              {keyedBadge}
            </span>
          ) : null;

          if (!item.enabled) {
            return (
              <div className={itemClass} key={item.label}>
                <span className="flex items-center gap-3">
                  <span
                    className={[
                      "inline-block w-[18px] text-center font-mono text-[11px] tracking-[0.08em]",
                      isActive ? "text-[#c8ff00]" : "text-[#4a4a51]",
                    ].join(" ")}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </span>
                {badge}
              </div>
            );
          }

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={itemClass}
              href={item.href}
              key={item.label}
            >
              <span className="flex items-center gap-3">
                <span
                  className={[
                    "inline-block w-[18px] text-center font-mono text-[11px] tracking-[0.08em]",
                    isActive ? "text-[#c8ff00]" : "text-[#4a4a51]",
                  ].join(" ")}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </span>
              {badge}
            </Link>
          );
        })}
      </div>

      <div className="border-t border-[#1a1a22] px-6 py-5">
        <div className="space-y-3">
          <StatRow label="High alerts" value={`${stats.activeAlerts} active`} tone="danger" />
          <StatRow label="Monitored" value={`${stats.monitoredCompanies} companies`} />
          <StatRow label="Reports" value={`${stats.reportCount} saved`} />
        </div>
      </div>
    </aside>
  );
}

function StatRow({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: string;
  tone?: "muted" | "danger";
}) {
  return (
    <div className="flex items-end justify-between gap-3 bg-transparent">
      <span className="font-mono text-[13px] tracking-[0.06em] text-[#555]">{label}</span>
      <span
        className={[
          "font-mono text-[13px] tracking-[0.04em]",
          tone === "danger" ? "text-[#ff2d2d]" : "text-[#888]",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}
