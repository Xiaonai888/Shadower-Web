import Icon from "./Icon";
import { greetingSuggestions } from "../data/uiData";

function getSafeUrl(value) {
  if (typeof value !== "string") {
    return "";
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "";
    }

    return url.href;
  } catch {
    return "";
  }
}

function getHostname(value) {
  const safeUrl = getSafeUrl(value);

  if (!safeUrl) {
    return "";
  }

  try {
    return new URL(safeUrl).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function CitedMessageText({ message }) {
  const text = typeof message.text === "string" ? message.text : "";
  const citations = Array.isArray(message.citations)
    ? [...message.citations].sort(
        (first, second) =>
          first.startIndex - second.startIndex ||
          first.endIndex - second.endIndex
      )
    : [];

  if (!citations.length) {
    return <p>{text}</p>;
  }

  const parts = [];
  let cursor = 0;

  citations.forEach((citation, index) => {
    const startIndex = Number(citation.startIndex);
    const endIndex = Number(citation.endIndex);
    const safeUrl = getSafeUrl(citation.url);

    if (
      !Number.isInteger(startIndex) ||
      !Number.isInteger(endIndex) ||
      startIndex < cursor ||
      endIndex <= startIndex ||
      endIndex > text.length
    ) {
      return;
    }

    if (startIndex > cursor) {
      parts.push(text.slice(cursor, startIndex));
    }

    const label = Number.isInteger(citation.sourceIndex)
      ? citation.sourceIndex
      : index + 1;

    if (safeUrl) {
      parts.push(
        <a
          aria-label={`Open source ${label}`}
          className="message-citation"
          href={safeUrl}
          key={`citation-${startIndex}-${endIndex}-${safeUrl}`}
          rel="noreferrer noopener"
          target="_blank"
          title={citation.title || "Open source"}
        >
          {label}
        </a>
      );
    } else {
      parts.push(
        <span
          className="message-citation"
          key={`citation-${startIndex}-${endIndex}-${index}`}
        >
          {label}
        </span>
      );
    }

    cursor = endIndex;
  });

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return <p>{parts.length ? parts : text}</p>;
}

function SourceList({ sources }) {
  if (!Array.isArray(sources) || !sources.length) {
    return null;
  }

  return (
    <div className="message-sources">
      <strong>Sources</strong>
      <div className="source-links">
        {sources.map((source, index) => {
          const safeUrl = getSafeUrl(source.url);

          if (!safeUrl) {
            return null;
          }

          const label = Number.isInteger(source.index)
            ? source.index
            : index + 1;

          return (
            <a
              href={safeUrl}
              key={`${safeUrl}-${label}`}
              rel="noreferrer noopener"
              target="_blank"
            >
              <span>{label}</span>
              <span>
                <strong>{source.title || getHostname(safeUrl)}</strong>
                <small>{getHostname(safeUrl)}</small>
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function WelcomeState({ isSending, onSendSuggestion }) {
  return (
    <div className="welcome-state">
      <div className="welcome-title">
        <h1>Welcome to Shadower</h1>
        <Icon name="sparkles" size={31} />
      </div>

      <p className="welcome-subtitle">
        Your private AI writing studio for <strong>Khmer & English</strong> novels.
      </p>

      <div className="feature-row">
        <article>
          <Icon name="pen" size={30} />
          <div>
            <strong>Write with freedom</strong>
            <p>AI that understands your story and style.</p>
          </div>
        </article>
        <article>
          <Icon name="shield" size={30} />
          <div>
            <strong>Your stories, private</strong>
            <p>Your creative space stays protected.</p>
          </div>
        </article>
        <article>
          <Icon name="book" size={30} />
          <div>
            <strong>From idea to masterpiece</strong>
            <p>Build, refine, and bring your stories to life.</p>
          </div>
        </article>
      </div>

      <div className="start-section">
        <span>Start a conversation</span>
        <div className="greeting-grid">
          {greetingSuggestions.map((item) => (
            <button
              disabled={isSending}
              key={item.title}
              onClick={() => onSendSuggestion(item.title)}
              type="button"
            >
              <span>
                <strong>{item.title}</strong>
                <small>{item.subtitle}</small>
              </span>
              <span className="wave">👋</span>
            </button>
          ))}
        </div>
      </div>

      <div className="disclaimer">
        <Icon name="shield" size={15} />
        <span>Shadower can make mistakes. Please review important information.</span>
      </div>
    </div>
  );
}

function MessageList({
  error,
  isSending,
  messages,
  messagesEndRef,
  onRetry,
  webSearchEnabled
}) {
  return (
    <div className="conversation">
      {messages.map((message) => (
        <article className={`chat-message ${message.role}`} key={message.id}>
          <div className="message-avatar">
            {message.role === "assistant" ? (
              <Icon name="sparkles" size={17} />
            ) : (
              "S"
            )}
          </div>
          <div className="message-stack">
            <div className="message-meta">
              <strong>{message.role === "assistant" ? "Shadower" : "You"}</strong>
              <time>{message.time}</time>
              {message.searchedWeb && (
                <span className="web-search-badge">
                  <Icon name="globe" size={11} />
                  Web
                </span>
              )}
            </div>
            <div className="message-bubble">
              <CitedMessageText message={message} />
              {message.role === "assistant" && (
                <>
                  <SourceList sources={message.sources} />
                  <div className="message-actions">
                    <button aria-label="More actions" type="button">
                      <Icon name="more" size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </article>
      ))}

      {isSending && (
        <article className="chat-message assistant">
          <div className="message-avatar">
            <Icon name="sparkles" size={17} />
          </div>
          <div className="message-stack">
            <div className="message-meta">
              <strong>Shadower</strong>
              <span>
                {webSearchEnabled ? "Searching the web" : "Thinking"}
              </span>
            </div>
            <div className="message-bubble typing-bubble">
              <span />
              <span />
              <span />
            </div>
          </div>
        </article>
      )}

      {error && (
        <div className="chat-error">
          <div>
            <strong>Unable to reach Shadower Backend</strong>
            <p>{error}</p>
          </div>
          <button onClick={onRetry} type="button">
            Retry
          </button>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

function Composer({
  input,
  inputRef,
  isSending,
  onChange,
  onKeyDown,
  onSubmit,
  onToggleWebSearch,
  webSearchEnabled
}) {
  return (
    <form className="message-composer" onSubmit={onSubmit}>
      <textarea
        aria-label="Message Shadower"
        disabled={isSending}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder="Message Shadower..."
        ref={inputRef}
        rows="3"
        value={input}
      />

      <div className="composer-toolbar">
        <div className="composer-tools">
          <button aria-label="Attach file" type="button">
            <Icon name="paperclip" size={18} />
          </button>
          <button
            aria-label={
              webSearchEnabled
                ? "Disable web search"
                : "Enable web search"
            }
            aria-pressed={webSearchEnabled}
            className={`web-search-toggle ${
              webSearchEnabled ? "active" : ""
            }`}
            disabled={isSending}
            onClick={onToggleWebSearch}
            title={
              webSearchEnabled
                ? "Web search is enabled"
                : "Search current information on the web"
            }
            type="button"
          >
            <Icon name="globe" size={18} />
            <span>Web</span>
          </button>
          <button className="composer-select" type="button">
            <Icon name="book" size={16} />
            <span>Book</span>
            <Icon name="chevronDown" size={13} />
          </button>
          <button className="composer-select" type="button">
            <Icon name="chat" size={16} />
            <span>Tone</span>
            <Icon name="chevronDown" size={13} />
          </button>
          <button className="composer-select" type="button">
            <Icon name="settings" size={16} />
            <span>Length</span>
            <Icon name="chevronDown" size={13} />
          </button>
        </div>

        <div className="send-area">
          <kbd>⌘ ↵</kbd>
          <button
            aria-label="Send message"
            className="send-button"
            disabled={!input.trim() || isSending}
            type="submit"
          >
            <Icon name="send" size={19} />
          </button>
        </div>
      </div>
    </form>
  );
}

function ChatWorkspace({
  error,
  input,
  inputRef,
  isSending,
  messages,
  messagesEndRef,
  onChange,
  onKeyDown,
  onRetry,
  onSendSuggestion,
  onSubmit,
  onToggleWebSearch,
  webSearchEnabled
}) {
  return (
    <main className="chat-workspace">
      <div className={`chat-content ${messages.length ? "has-messages" : ""}`}>
        {messages.length === 0 ? (
          <WelcomeState
            isSending={isSending}
            onSendSuggestion={onSendSuggestion}
          />
        ) : (
          <MessageList
            error={error}
            isSending={isSending}
            messages={messages}
            messagesEndRef={messagesEndRef}
            onRetry={onRetry}
            webSearchEnabled={webSearchEnabled}
          />
        )}
      </div>

      <Composer
        input={input}
        inputRef={inputRef}
        isSending={isSending}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onSubmit={onSubmit}
        onToggleWebSearch={onToggleWebSearch}
        webSearchEnabled={webSearchEnabled}
      />
    </main>
  );
}

export default ChatWorkspace;
