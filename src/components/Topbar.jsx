import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { topTabs } from "../data/uiData";

const themes = [
  { id: "light", label: "Light", icon: "sun" },
  { id: "dark", label: "Dark", icon: "moon" },
  { id: "purple", label: "Purple", icon: "sparkles" }
];

function Topbar({
  activeView,
  backendStatus,
  onOpenSidebar,
  onRefreshBackend,
  onThemeChange,
  onViewChange,
  theme
}) {
  const [themeOpen, setThemeOpen] = useState(false);
  const themeRef = useRef(null);

  useEffect(() => {
    const closeMenu = (event) => {
      if (!themeRef.current?.contains(event.target)) {
        setThemeOpen(false);
      }
    };

    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  const selectedTheme = themes.find((item) => item.id === theme) || themes[0];

  const statusCopy = {
    checking: "Checking backend",
    online: "Backend online",
    offline: "Backend offline"
  }[backendStatus];

  return (
    <header className="topbar">
  <button
    aria-label="Open chat menu"
    className="mobile-sidebar-toggle"
    onClick={onOpenSidebar}
    type="button"
  >
    ☰
  </button>

  <div className="top-tabs" role="tablist" aria-label="Shadower tools">
        {topTabs.map((tab) => (
          <button
            className={`top-tab ${activeView === tab.id ? "active" : ""}`}
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            role="tab"
            type="button"
          >
            <Icon name={tab.icon} size={19} />
            <span>
              <strong>{tab.label}</strong>
              {!tab.enabled && <small>Coming soon</small>}
            </span>
          </button>
        ))}
      </div>

      <div className="top-actions">
        <button
  className="pro-button"
  onClick={() => window.alert("Coming soon")}
  type="button"
>
          <Icon name="crown" size={16} />
          <span>Upgrade to Pro</span>
        </button>

        <button
          aria-label={statusCopy}
          className={`backend-dot ${backendStatus}`}
          onClick={onRefreshBackend}
          title={statusCopy}
          type="button"
        >
          <span />
        </button>

        <button aria-label="Help" className="icon-button" type="button">
          <Icon name="help" size={19} />
        </button>

        <button aria-label="Notifications" className="icon-button" type="button">
          <Icon name="bell" size={19} />
        </button>

        <div className="theme-select" ref={themeRef}>
          <button
            aria-expanded={themeOpen}
            aria-haspopup="menu"
            className="theme-trigger"
            onClick={() => setThemeOpen((current) => !current)}
            type="button"
          >
            <Icon name={selectedTheme.icon} size={17} />
            <span>{selectedTheme.label}</span>
            <Icon name="chevronDown" size={14} />
          </button>

          {themeOpen && (
            <div className="theme-menu" role="menu">
              {themes.map((item) => (
                <button
                  className={theme === item.id ? "selected" : ""}
                  key={item.id}
                  onClick={() => {
                    onThemeChange(item.id);
                    setThemeOpen(false);
                  }}
                  role="menuitem"
                  type="button"
                >
                  <Icon name={item.icon} size={17} />
                  <span>{item.label}</span>
                  {theme === item.id && <span className="theme-check">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <button aria-label="Profile" className="profile-button" type="button">
          S
        </button>
      </div>
    </header>
  );
}

export default Topbar;
