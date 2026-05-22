import { Bell, Globe, KeyRound, Palette } from "lucide-react";

const SECTIONS = [
  {
    icon: Bell,
    title: "Notifications",
    copy: "Choose how alerts, cluster detections, and routing changes reach you.",
  },
  {
    icon: Palette,
    title: "Appearance",
    copy: "Switch between light and dark themes, and adjust map density preferences.",
  },
  {
    icon: Globe,
    title: "Regional defaults",
    copy: "Set default county, time zone, and date range used across the console.",
  },
  {
    icon: KeyRound,
    title: "Security",
    copy: "Manage password, multi-factor authentication, and active sessions.",
  },
];

export default function SettingsPage() {
  return (
    <div>
      <div className="console-header">
        <div>
          <h1 className="console-title">Settings</h1>
          <p className="console-subtitle">
            Configure how the One Health AZ console behaves for you and your team.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        {SECTIONS.map(({ icon: Icon, title, copy }) => (
          <div className="settings-tile card" key={title}>
            <div className="settings-tile-icon">
              <Icon size={18} strokeWidth={1.8} />
            </div>
            <div className="settings-tile-title">{title}</div>
            <p className="settings-tile-copy">{copy}</p>
            <span className="settings-tile-tag">Coming soon</span>
          </div>
        ))}
      </div>
    </div>
  );
}
