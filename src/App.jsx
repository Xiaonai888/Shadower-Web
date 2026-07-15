import { useEffect, useRef, useState } from "react";
import ChatWorkspace from "./components/ChatWorkspace";
import ComingSoon from "./components/ComingSoon";
import RightPanel from "./components/RightPanel";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import { topTabs } from "./data/uiData";
import {
  checkBackendHealth,
  createChatSession,
  deleteChatSession,
  getChatMessages,
  getChatModels,
  getChatSessions,
  sendChatMessage,
  updateChatSession
} from "./services/chatApi";

const CHAT_STORAGE_KEY = "shadower-current-chat";
const CURRENT_CHAT_ID_KEY = "shadower-current-chat-id";
const MY_AI_SELECTION_KEY = "shadower-my-ai-selection";
const LEGACY_SELECTION_KEY = "shadower-ai-selection";
const MAX_STORED_MESSAGES = 50;

const EMPTY_MY_AI = {
  id: "my-ai",
  label: "My AI",
  available: false,
  status: "My AI model is not connected",
  models: []
};

function getStoredTheme() {
  try {
    return localStorage.getItem("shadower-theme") || "light";
  } catch {
    return "light";
  }
}

function getStoredSelection() {
  try {
    const stored = JSON.parse(
      localStorage.getItem(MY_AI_SELECTION_KEY) || "{}"
    );

    return {
      model: typeof stored.model === "string" ? stored.model : "",
      intelligence:
        typeof stored.intelligence === "string"
          ? stored.intelligence
          : "high"
    };
  } catch {
    return {
      model: "",
      intelligence: "high"
    };
  }
}

function getStoredChatId() {
  try {
    return localStorage.getItem(CURRENT_CHAT_ID_KEY) || "";
  } catch {
    return "";
  }
}

function getStoredMessages() {
  try {
    const stored = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || "[]");

    if (!Array.isArray(stored)) {
      return [];
    }

    return stored
      .filter(
        (item) =>
          item &&
          (item.role === "user" || item.role === "assistant") &&
          typeof item.text === "string" &&
          item.text.trim()
      )
      .slice(-MAX_STORED_MESSAGES)
      .map((item, index) => ({
        id:
          typeof item.id === "string"
            ? item.id
            : `${item.role}-stored-${index}`,
        role: item.role,
        text: item.text,
        time: typeof item.time === "string" ? item.time : "",
        model:
          item.provider && item.provider !== "my-ai"
            ? ""
            : typeof item.model === "string"
              ? item.model
              : "",
        intelligence:
          typeof item.intelligence === "string" ? item.intelligence : ""
      }));
  } catch {
    return [];
  }
}

function formatTime(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}


function createMessage(role, text, metadata = {}) {
  const uniqueId =
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return {
    id: `${role}-${uniqueId}`,
    role,
    text,
    time: formatTime(),
    ...metadata
  };
}

function normalizeDatabaseMessages(records) {
  if (!Array.isArray(records)) {
    return [];
  }

  return records
    .filter(
      (item) =>
        item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim()
    )
    .map((item) => ({
      id: item.id,
      role: item.role,
      text: item.content,
      time: formatTime(item.created_at),
      model: item.model || "",
      intelligence: item.intelligence || ""
    }));
}

function toApiHistory(messages) {
  return messages
    .filter(
      (message) =>
        (message.role === "user" || message.role === "assistant") &&
        typeof message.text === "string" &&
        message.text.trim()
    )
    .map((message) => ({
      role: message.role,
      text: message.text
    }));
}

function normalizeMyAI(record) {
  if (!record || record.id !== "my-ai") {
    return { ...EMPTY_MY_AI };
  }

  return {
    id: "my-ai",
    label: "My AI",
    available: Boolean(record.available),
    status:
      typeof record.status === "string" && record.status.trim()
        ? record.status
        : EMPTY_MY_AI.status,
    models: Array.isArray(record.models) ? record.models : []
  };
}

function resolveModel(currentModel, myAI) {
  const models = Array.isArray(myAI.models) ? myAI.models : [];

  if (models.some((model) => model.id === currentModel)) {
    return currentModel;
  }

  return models[0]?.id || "";
}

function App() {
  const storedSelection = getStoredSelection();
  const [activeView, setActiveView] = useState("chat");
  const [backendStatus, setBackendStatus] = useState("checking");
  const [chatSessions, setChatSessions] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [currentChatId, setCurrentChatId] = useState(getStoredChatId);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const [intelligence, setIntelligence] = useState(
    storedSelection.intelligence
  );
  const [intelligenceLevels, setIntelligenceLevels] = useState([
    { id: "instant", label: "Instant" },
    { id: "medium", label: "Medium" },
    { id: "high", label: "High" }
  ]);
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState(getStoredMessages);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [myAI, setMyAI] = useState(EMPTY_MY_AI);
  const [selectedModel, setSelectedModel] = useState(storedSelection.model);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const refreshModels = async () => {
    setModelsLoading(true);

    try {
      const data = await getChatModels();
      const records = Array.isArray(data.providers) ? data.providers : [];
      const nextMyAI = normalizeMyAI(
        records.find((record) => record.id === "my-ai")
      );

      setMyAI(nextMyAI);
      setSelectedModel((current) => resolveModel(current, nextMyAI));

      if (Array.isArray(data.intelligenceLevels)) {
        setIntelligenceLevels(data.intelligenceLevels);
      }

      setError("");
    } catch (requestError) {
      setMyAI({ ...EMPTY_MY_AI });
      setSelectedModel("");
      setError(requestError.message || "Unable to load My AI models");
    } finally {
      setModelsLoading(false);
    }
  };

  const refreshChatSessions = async () => {
  setChatsLoading(true);

  try {
    const data = await getChatSessions();
    const chats = Array.isArray(data.chats) ? data.chats : [];

    setChatSessions(chats);
    return chats;
  } catch (requestError) {
    setError(requestError.message || "Unable to load chat sessions");
    return [];
  } finally {
    setChatsLoading(false);
  }
};

const openChat = async (chat) => {
  if (!chat?.id || isSending) return;

  setActiveView("chat");
  setCurrentChatId(chat.id);
  setMessages([]);
  setInput("");
  setError("");

  if (chat.model) {
    setSelectedModel(chat.model);
  }

  if (chat.intelligence) {
    setIntelligence(chat.intelligence);
  }

  try {
    const data = await getChatMessages(chat.id);

    setMessages(normalizeDatabaseMessages(data.messages));
    setBackendStatus("online");
  } catch (requestError) {
    setError(requestError.message || "Unable to open this chat");
  }
};

  useEffect(() => {
  refreshBackendStatus();
  refreshModels();

  refreshChatSessions().then((chats) => {
    const storedChatId = getStoredChatId();
    const storedChat = chats.find((chat) => chat.id === storedChatId);

    if (storedChat) {
      openChat(storedChat);
    } else {
      setCurrentChatId("");
      setMessages([]);
    }
  });
}, []);

  useEffect(() => {
  try {
    if (currentChatId) {
      localStorage.setItem(CURRENT_CHAT_ID_KEY, currentChatId);
    } else {
      localStorage.removeItem(CURRENT_CHAT_ID_KEY);
    }
  } catch {
    return;
  }
}, [currentChatId]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      localStorage.setItem("shadower-theme", theme);
    } catch {
      return;
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_SELECTION_KEY);
      localStorage.setItem(
        MY_AI_SELECTION_KEY,
        JSON.stringify({
          model: selectedModel,
          intelligence
        })
      );
    } catch {
      return;
    }
  }, [intelligence, selectedModel]);

  useEffect(() => {
    try {
      if (messages.length) {
        localStorage.setItem(
          CHAT_STORAGE_KEY,
          JSON.stringify(messages.slice(-MAX_STORED_MESSAGES))
        );
      } else {
        localStorage.removeItem(CHAT_STORAGE_KEY);
      }
    } catch {
      return;
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const selectedAvailable = Boolean(
    myAI.available &&
      myAI.models.some((model) => model.id === selectedModel)
  );

const startNewChat = async () => {
  setActiveView("chat");
  setMessages([]);
  setInput("");
  setError("");

  try {
    const data = await createChatSession({
      model: selectedModel || undefined,
      intelligence
    });

    setCurrentChatId(data.chat.id);
    setChatSessions((current) => [
      data.chat,
      ...current.filter((chat) => chat.id !== data.chat.id)
    ]);

    setBackendStatus("online");
    window.setTimeout(() => inputRef.current?.focus(), 0);
  } catch (requestError) {
    setError(requestError.message || "Unable to create a new chat");
  }
};
  const changeView = (viewId) => {
    setActiveView(viewId);
  };

  const handleModelSelect = (model) => {
    setSelectedModel(model);
    setError("");
  };

  const submitMessage = async (
    rawMessage,
    {
      history = messages,
      appendUser = true,
      selection = {
        model: selectedModel,
        intelligence
      }
    } = {}
  ) => {
    const text = rawMessage.trim();

    if (!text || isSending) return;

    const modelExists = myAI.models.some(
      (model) => model.id === selection.model
    );

    if (!myAI.available || !modelExists) {
      setError(myAI.status || "The selected My AI model is unavailable.");
      return;
    }

    setActiveView("chat");
    setInput("");
    setError("");
    setIsSending(true);

    try {
  let targetChatId = currentChatId;

  if (!targetChatId) {
    const created = await createChatSession({
      model: selection.model,
      intelligence: selection.intelligence
    });

    targetChatId = created.chat.id;
    setCurrentChatId(targetChatId);

    setChatSessions((current) => [
      created.chat,
      ...current.filter((chat) => chat.id !== created.chat.id)
    ]);
  }

  if (appendUser) {
    setMessages((current) => [
      ...current,
      createMessage("user", text, selection)
    ]);
  }

  const data = await sendChatMessage(
    text,
    toApiHistory(history),
    {
      ...selection,
      chatId: appendUser ? targetChatId : null
    }
  );

      setMessages((current) => [
        ...current,
        createMessage(
          "assistant",
          data.reply || "Shadower did not return a reply.",
          {
            model: data.model || selection.model,
            intelligence: data.intelligence || selection.intelligence
          }
        )
      ]);

      await refreshChatSessions();
      setBackendStatus("online");
    } catch (requestError) {
      setError(
        requestError.message || "Unable to connect to Shadower Backend"
      );
      setBackendStatus("offline");
    } finally {
      setIsSending(false);
    }
  };

  const renameChat = async (chat) => {
  const title = window.prompt("Rename chat", chat.title)?.trim();

  if (!title || title === chat.title) return;

  try {
    const data = await updateChatSession(chat.id, { title });

    setChatSessions((current) =>
      current.map((item) => (item.id === chat.id ? data.chat : item))
    );
  } catch (requestError) {
    setError(requestError.message || "Unable to rename this chat");
  }
};

const removeChat = async (chat) => {
  const confirmed = window.confirm(`Delete "${chat.title}"?`);

  if (!confirmed) return;

  try {
    await deleteChatSession(chat.id);

    setChatSessions((current) =>
      current.filter((item) => item.id !== chat.id)
    );

    if (currentChatId === chat.id) {
      setCurrentChatId("");
      setMessages([]);
    }
  } catch (requestError) {
    setError(requestError.message || "Unable to delete this chat");
  }
};

  const retryLastMessage = () => {
    let lastUserIndex = -1;

    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index].role === "user") {
        lastUserIndex = index;
        break;
      }
    }

    if (lastUserIndex < 0) {
      return;
    }

    const message = messages[lastUserIndex];
    const history = messages.slice(0, lastUserIndex);
    const selection = {
      model: message.model || selectedModel,
      intelligence: message.intelligence || intelligence
    };

    setMessages(messages.slice(0, lastUserIndex + 1));
    setSelectedModel(selection.model);
    setIntelligence(selection.intelligence);
    submitMessage(message.text, {
      history,
      appendUser: false,
      selection
    });
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
  chats={chatSessions}
  chatsLoading={chatsLoading}
  currentChatId={currentChatId}
  onClose={() => setSidebarOpen(false)}
  onDeleteChat={removeChat}
  onNewChat={startNewChat}
  onOpenChat={openChat}
  onRenameChat={renameChat}
  onViewChange={changeView}
  open={sidebarOpen}
/>

      <section className="main-shell">
        <Topbar
  activeView={activeView}
  backendStatus={backendStatus}
  onOpenSidebar={() => setSidebarOpen(true)}
          onRefreshBackend={() => {
            refreshBackendStatus();
            refreshModels();
          }}
          onThemeChange={setTheme}
          onViewChange={changeView}
          theme={theme}
        />

        <div
          className={`workspace-grid ${
            activeView !== "chat" ? "single-column" : ""
          }`}
        >
          {activeView === "chat" ? (
            <>
              <ChatWorkspace
                error={error}
                input={input}
                inputRef={inputRef}
                intelligence={intelligence}
                intelligenceLevels={intelligenceLevels}
                isSending={isSending}
                messages={messages}
                messagesEndRef={messagesEndRef}
                models={myAI.models}
                modelsLoading={modelsLoading}
                myAIAvailable={myAI.available}
                myAIStatus={myAI.status}
                onChange={(event) => setInput(event.target.value)}
                onIntelligenceChange={setIntelligence}
                onKeyDown={handleKeyDown}
                onModelSelect={handleModelSelect}
                onRetry={retryLastMessage}
                onSendSuggestion={submitMessage}
                onSubmit={handleSubmit}
                selectedAvailable={selectedAvailable}
                selectedModel={selectedModel}
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
