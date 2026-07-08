import { useEffect, useRef, useState } from "react";
import ChatWorkspace from "./components/ChatWorkspace";
import ComingSoon from "./components/ComingSoon";
import RightPanel from "./components/RightPanel";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import { topTabs } from "./data/uiData";
import { checkBackendHealth, sendChatMessage } from "./services/chatApi";

function getStoredTheme() {
  try {
    return localStorage.getItem("shadower-theme") || "light";
  } catch {
    return "light";
  }
}

function formatTime() {
  return new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date());
}

function App() {
  const [activeView, setActiveView] = useState("chat");
  const [backendStatus, setBackendStatus] = useState("checking");
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [theme, setTheme] = useState(getStoredTheme);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

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
    document.documentElement.dataset.theme = theme;

    try {
      localStorage.setItem("shadower-theme", theme);
    } catch {
      return;
    }
  }, [theme]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const startNewChat = () => {
    setActiveView("chat");
    setMessages([]);
    setInput("");
    setError("");
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const changeView = (viewId) => {
    setActiveView(viewId);
  };

  const submitMessage = async (rawMessage) => {
    const text = rawMessage.trim();

    if (!text || isSending) return;

    setActiveView("chat");
    setInput("");
    setError("");
    setIsSending(true);

    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: "user",
        text,
        time: formatTime()
      }
    ]);

    try {
      const data = await sendChatMessage(text);

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: data.reply || "Shadower did not return a reply.",
          time: formatTime()
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

  const handlePrompt = (prompt) => {
    setActiveView("chat");
    setInput(prompt);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const selectedTab = topTabs.find((item) => item.id === activeView);

  return (
    <div className="app-shell">
      <Sidebar
        activeView={activeView}
        onNewChat={startNewChat}
        onViewChange={changeView}
      />

      <section className="main-shell">
        <Topbar
          activeView={activeView}
          backendStatus={backendStatus}
          onRefreshBackend={refreshBackendStatus}
          onThemeChange={setTheme}
          onViewChange={changeView}
          theme={theme}
        />

        <div className={`workspace-grid ${activeView !== "chat" ? "single-column" : ""}`}>
          {activeView === "chat" ? (
            <>
              <ChatWorkspace
                error={error}
                input={input}
                inputRef={inputRef}
                isSending={isSending}
                messages={messages}
                messagesEndRef={messagesEndRef}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                onRetry={() => submitMessage(messages.at(-1)?.text || input)}
                onSendSuggestion={submitMessage}
                onSubmit={handleSubmit}
              />
              <RightPanel onPrompt={handlePrompt} />
            </>
          ) : (
            <ComingSoon
              icon={selectedTab?.icon || "sparkles"}
              title={selectedTab?.label || "Coming soon"}
            />
          )}
        </div>
      </section>
    </div>
  );
}

export default App;
