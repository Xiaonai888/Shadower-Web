import { useState } from "react";

const tabs = [
  { id: "chat", label: "Chat", icon: "✦" },
  { id: "story", label: "Manage Story", icon: "▤" },
  { id: "manga", label: "Manga Story", icon: "◫" },
  { id: "voice", label: "Clone Voice", icon: "◉" }
];

const welcomeMessage = {
  id: 1,
  role: "assistant",
  text: "សួស្តី! ខ្ញុំឈ្មោះ Shadower។ ខ្ញុំជាជំនួយការ AI សម្រាប់ជួយអ្នកបង្កើត និងសរសេររឿងប្រលោមលោកជាភាសាខ្មែរ និងអង់គ្លេស។"
};

function getReply(message) {
  const value = message.trim().toLowerCase();
  const greetings = ["hi", "hello", "សួស្តី"];

  if (greetings.some((greeting) => value === greeting || value.startsWith(`${greeting} `))) {
    return "សួស្តី! ខ្ញុំឈ្មោះ Shadower។ ខ្ញុំជាជំនួយការ AI សម្រាប់ជួយអ្នកបង្កើត និងសរសេររឿងប្រលោមលោកជាភាសាខ្មែរ និងអង់គ្លេស។";
  }

  return "ឥឡូវនេះខ្ញុំកំពុងសាកល្បងដំណាក់កាលដំបូង ហើយអាចឆ្លើយតែ សួស្តី, Hi និង Hello សិន។";
}

function App() {
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState([welcomeMessage]);
  const [input, setInput] = useState("");

  const sendMessage = (event) => {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;

    setMessages((current) => [
      ...current,
      { id: Date.now(), role: "user", text },
      { id: Date.now() + 1, role: "assistant", text: getReply(text) }
    ]);
    setInput("");
  };

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

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

        <div className="private-badge"><span>●</span>Private workspace</div>
      </aside>

      {activeTab === "chat" ? (
        <main className="chat-page">
          <header>
            <div>
              <span className="eyebrow">NOVEL WRITING ASSISTANT</span>
              <h1>Chat with Shadower</h1>
            </div>
            <span className="status">Online</span>
          </header>

          <section className="messages">
            <div className="message-list">
              {messages.map((message) => (
                <article className={`message ${message.role}`} key={message.id}>
                  <div className="avatar">{message.role === "assistant" ? "S" : "U"}</div>
                  <div>
                    <strong>{message.role === "assistant" ? "Shadower" : "You"}</strong>
                    <p>{message.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <form className="composer" onSubmit={sendMessage}>
            <input
              aria-label="Message Shadower"
              onChange={(event) => setInput(event.target.value)}
              placeholder="សរសេរ សួស្តី, Hi ឬ Hello..."
              value={input}
            />
            <button type="submit">Send</button>
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
