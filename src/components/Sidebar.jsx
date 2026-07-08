import Icon from "./Icon";
import { recentChats, sideNavigation } from "../data/uiData";

function Sidebar({ activeView, onNewChat, onViewChange }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">
          <Icon name="feather" size={28} />
        </div>
        <div className="brand-copy">
          <strong>Shadower</strong>
          <span>Private AI Writing Studio</span>
        </div>
      </div>

      <button className="new-chat-button" onClick={onNewChat} type="button">
        <Icon name="plus" size={19} />
        <span>New Chat</span>
        <kbd>⌘ K</kbd>
      </button>

      <nav className="side-navigation" aria-label="Primary navigation">
        {sideNavigation.map((item) => (
          <button
            className={`side-nav-item ${activeView === item.id ? "active" : ""}`}
            key={item.id}
            onClick={() => onViewChange(item.id)}
            type="button"
          >
            <Icon name={item.icon} size={19} />
            <span>{item.label}</span>
            {!item.enabled && <small>Soon</small>}
          </button>
        ))}
      </nav>

      <section className="recent-section">
        <div className="section-heading">
          <span>Recent Chats</span>
        </div>
        <div className="recent-list">
          {recentChats.map((chat) => (
            <div className="recent-item" key={chat.title}>
              <Icon name="chat" size={14} />
              <span title={chat.title}>{chat.title}</span>
              <time>{chat.time}</time>
            </div>
          ))}
        </div>
        <button className="view-all-button" type="button">
          <span>View all</span>
          <Icon name="chevronRight" size={15} />
        </button>
      </section>

      <div className="storage-card">
        <div className="storage-heading">
          <strong>Storage</strong>
          <span>24% used</span>
        </div>
        <div className="storage-track">
          <span />
        </div>
        <div className="storage-footer">
          <span>2.4 GB / 10 GB</span>
          <button type="button">Manage</button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
