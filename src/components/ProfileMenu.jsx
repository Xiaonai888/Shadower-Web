import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

const menuItems = [
  {
    id: "upgrade",
    label: "Upgrade plan",
    icon: "crown"
  },
  {
    id: "personalization",
    label: "Personalization",
    icon: "sparkles"
  },
  {
    id: "profile",
    label: "Profile",
    icon: "user"
  },
  {
    id: "settings",
    label: "Settings",
    icon: "settings"
  }
];

function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const closeMenu = (event) => {
      if (!profileRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const closeWithEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeWithEscape);

    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, []);

  const showComingSoon = (label) => {
    setOpen(false);
    window.alert(`${label} — Coming soon`);
  };

  return (
    <div className="sidebar-profile" ref={profileRef}>
      {open && (
        <div className="profile-popup" role="menu">
          <button
            className="profile-popup-header"
            onClick={() => showComingSoon("Profile")}
            type="button"
          >
            <span className="profile-avatar">SU</span>

            <span className="profile-copy">
              <strong>suvasu</strong>
              <small>Free plan</small>
            </span>

            <Icon name="chevronRight" size={16} />
          </button>

          <div className="profile-menu-divider" />

          <div className="profile-menu-list">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => showComingSoon(item.label)}
                role="menuitem"
                type="button"
              >
                <Icon name={item.icon} size={17} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="profile-menu-divider" />

          <button
            className="profile-help-button"
            onClick={() => showComingSoon("Help")}
            role="menuitem"
            type="button"
          >
            <Icon name="help" size={17} />
            <span>Help</span>
            <Icon name="chevronRight" size={15} />
          </button>

          <div className="profile-menu-divider" />

          <button
            className="profile-logout-button"
            onClick={() => showComingSoon("Log out")}
            role="menuitem"
            type="button"
          >
            <span className="logout-symbol">↪</span>
            <span>Log out</span>
          </button>
        </div>
      )}

      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className={`sidebar-profile-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="profile-avatar small">SU</span>

        <span className="profile-copy">
          <strong>suvasu</strong>
          <small>Free plan</small>
        </span>

        <Icon name="chevronRight" size={16} />
      </button>
    </div>
  );
}

export default ProfileMenu;
