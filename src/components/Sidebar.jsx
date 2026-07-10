import Icon from "./Icon";
import ProfileMenu from "./ProfileMenu";
import { sideNavigation } from "../data/uiData";

function formatChatTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat([], {
    month: "short",
    day: "numeric"
  }).format(date);
}

function Sidebar({
  activeView,
  chats = [],
  chatsLoading = false,
  currentChatId,
  onDeleteChat,
  onNewChat,
  onOpenChat,
  onRenameChat,
  onViewChange
}) {
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
  {chatsLoading ? (
    <div className="recent-empty">Loading chats...</div>
  ) : chats.length ? (
    chats.map((chat) => (
      <article
        className={`recent-item ${
          currentChatId === chat.id ? "active" : ""
        }`}
        key={chat.id}
      >
        <button
          className="recent-open-button"
          onClick={() => onOpenChat(chat)}
          type="button"
        >
          <Icon name="chat" size={14} />
          <span title={chat.title}>{chat.title}</span>
          <time>{formatChatTime(chat.updated_at)}</time>
        </button>

        <button
          aria-label={`Rename ${chat.title}`}
          className="recent-action-button"
          onClick={() => onRenameChat(chat)}
          title="Rename"
          type="button"
        >
          <Icon name="pen" size={13} />
        </button>

        <button
          aria-label={`Delete ${chat.title}`}
          className="recent-action-button danger"
          onClick={() => onDeleteChat(chat)}
          title="Delete"
          type="button"
        >
          ×
        </button>
      </article>
    ))
  ) : (
    <div className="recent-empty">No chats yet</div>
  )}
</div>
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

      <ProfileMenu />
    </aside>
