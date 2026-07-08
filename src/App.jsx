import { useEffect, useRef, useState } from "react";
import { checkBackendHealth, sendChatMessage } from "./services/chatApi";

const tabs = [
  { id: "chat", label: "Chat", icon: "✦" },
  { id: "story", label: "Manage Story", icon: "▤" },
  { id: "manga", label: "Manga Story", icon: "◫" },
  { id: "voice", label: "Clone Voice", icon: "◉" }
];

const welcomeMessage = {
  id: "welcome",
  role: "assistant",
  text: "សួស្តី! ខ្ញុំឈ្មោះ Shadower។ សាកល្បងនិយាយ សួស្តី, Hi ឬ Hello មកខ្ញុំ។"
};

const suggestions = ["សួស្តី", "Hi", "Hello"];

function App() {
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [backendStatus, setBackendStatus] = useState("checking");
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  const refreshBackendStatus = async () => {
    setBackendStatus("checking");

    try {
      await checkBackendHealth();
      setBackendStatus("online");
    } catch {
      setBackendStatus("offline");
    }
  };

  useEffect(() => {
    refreshBackendStatus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const submitMessage = async (value) => {
    const text = value.trim();

    if (!text || isSending) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError("");
    setIsSending(true);

    try {
      const data = await sendChatMessage(text);

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: data.reply
        }
      ]);

      setBackendStatus("online");
    } catch (requestError) {
      setError(requestError.message || "Unable to connect to Shadower Backend");
      setBackendStatus("offline");
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitMessage(input);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([welcomeMessage]);
    setInput("");
    setError("");
  };

  const statusText = {
    checking: "Checking backend",
    online: "Backend online",
    offline: "Backend offline"
  }[backendStatus];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <strong>Shadower</strong>
            <span>Private AI Studio</span>
          </div>
        </div>

        <nav>
          {tabs.map((tab) => (
            <button
              className={activeTab === tab.id ? "nav-button active" : "nav-button"}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <span className="nav-icon">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id !== "chat" && <small>Coming soon</small>}
            </button>
          ))}
        </nav>

        <div className="private-badge">
          <span>●</span>
          Private workspace
        </div>
      </aside>

      {activeTab === "chat" ? (
        <main className="chat-page">
          <header className="chat-header">
            <div>
              <span className="eyebrow">NOVEL WRITING ASSISTANT</span>
              <h1>Chat with Shadower</h1>
            </div>

            <div className="header-actions">
              <button className="clear-button" onClick={clearChat} type="button">
                Clear chat
              </button>
              <button
                className={`status ${backendStatus}`}
                onClick={refreshBackendStatus}
                type="button"
              >
                <span />
                {statusText}
              </button>
            </div>
          </header>

          <section className="messages">
            <div className="message-list">
              {messages.length === 1 && (
                <div className="welcome-panel">
                  <div className="welcome-symbol">✦</div>
                  <span className="eyebrow">FIRST CHAT TEST</span>
                  <h2>Start a conversation</h2>
                  <p>
                    Shadower កំពុងសាកល្បងការតភ្ជាប់ទៅ Backend ដំបូង។
                    ជ្រើសពាក្យមួយខាងក្រោម។
                  </p>
                  <div className="suggestions">
                    {suggestions.map((suggestion) => (
                      <button
                        disabled={isSending}
                        key={suggestion}
                        onClick={() => submitMessage(suggestion)}
                        type="button"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <article className={`message ${message.role}`} key={message.id}>
                  <div className="avatar">
                    {message.role === "assistant" ? "S" : "U"}
                  </div>
                  <div className="message-content">
                    <strong>
                      {message.role === "assistant" ? "Shadower" : "You"}
                    </strong>
                    <p>{message.text}</p>
                  </div>
                </article>
              ))}

              {isSending && (
                <article className="message assistant typing-message">
                  <div className="avatar">S</div>
                  <div className="message-content">
                    <strong>Shadower</strong>
                    <div className="typing-dots" aria-label="Shadower is typing">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </article>
              )}

              {error && (
                <div className="error-banner">
                  <div>
                    <strong>Connection error</strong>
                    <p>{error}</p>
                  </div>
                  <button onClick={refreshBackendStatus} type="button">
                    Check again
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </section>

          <form className="composer" onSubmit={handleSubmit}>
            <textarea
              aria-label="Message Shadower"
              disabled={isSending}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="សរសេរ សួស្តី, Hi ឬ Hello..."
              rows="1"
              value={input}
            />
            <button disabled={!input.trim() || isSending} type="submit">
              {isSending ? "Sending..." : "Send"}
            </button>
          </form>
        </main>
      ) : (
        <main className="coming-soon">
          <div className="coming-icon">{activeTabData?.icon}</div>
          <span className="eyebrow">SHADOWER</span>
          <h1>{activeTabData?.label}</h1>
          <p>Coming soon</p>
        </main>
      )}
    </div>
  );
}

export default App;
