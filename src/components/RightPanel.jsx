import Icon from "./Icon";
import { quickPrompts, writingShortcuts } from "../data/uiData";

function RightPanel({ onPrompt }) {
  return (
    <aside className="right-panel">
      <section className="utility-card quick-prompts-card">
        <div className="utility-heading">
          <Icon name="sparkles" size={17} />
          <h2>Quick Prompts</h2>
        </div>

        <div className="quick-prompt-grid">
          {quickPrompts.map((item) => (
            <button
              className="quick-prompt"
              key={item.title}
              onClick={() => onPrompt(item.prompt)}
              type="button"
            >
              <span className={`prompt-icon prompt-${item.icon}`}>
                <Icon name={item.icon} size={18} />
              </span>
              <span className="prompt-copy">
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
              <Icon name="chevronRight" size={14} />
            </button>
          ))}
        </div>
      </section>

      <section className="utility-card assistant-card">
        <div className="utility-heading">
          <h2>Assistant</h2>
        </div>

        <div className="assistant-profile">
          <div className="assistant-avatar">
            <span className="hood-shape">✦</span>
          </div>
          <div>
            <div className="assistant-name">
              <strong>Shadower</strong>
              <span>AI Writing Assistant</span>
            </div>
            <p>
              Specialized in Khmer and English storytelling. Here to help you
              write better, faster, and with more impact.
            </p>
          </div>
        </div>

        <div className="assistant-tags">
          <span>✨ Creative</span>
          <span>🧠 Insightful</span>
          <span>🛡️ Private</span>
        </div>
      </section>

      <section className="utility-card shortcuts-card">
        <div className="utility-heading">
          <h2>Writing Shortcuts</h2>
        </div>

        <div className="shortcut-list">
          {writingShortcuts.map((item) => (
            <button
              key={item.command}
              onClick={() => onPrompt(item.command)}
              type="button"
            >
              <code>{item.command}</code>
              <span>{item.description}</span>
            </button>
          ))}
        </div>
      </section>

      <footer className="right-footer">
        <span>© 2026 Shadower</span>
        <Icon name="shield" size={15} />
      </footer>
    </aside>
  );
}

export default RightPanel;
