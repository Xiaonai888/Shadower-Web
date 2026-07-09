import { useEffect, useRef, useState } from "react";
import ChatWorkspace from "./components/ChatWorkspace";
import ComingSoon from "./components/ComingSoon";
import RightPanel from "./components/RightPanel";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import { topTabs } from "./data/uiData";
import {
  checkBackendHealth,
  getChatModels,
  sendChatMessage
} from "./services/chatApi";

const CHAT_STORAGE_KEY = "shadower-current-chat";
const AI_SELECTION_KEY = "shadower-ai-selection";
const MAX_STORED_MESSAGES = 50;

function getStoredTheme() {
  try {
    return localStorage.getItem("shadower-theme") || "light";
  } catch {
    return "light";
  }
}

function getStoredSelection() {
  try {
    const stored = JSON.parse(localStorage.getItem(AI_SELECTION_KEY) || "{}");

    return {
      provider:
        typeof stored.provider === "string" ? stored.provider : "my-ai",
      model: typeof stored.model === "string" ? stored.model : "",
      intelligence:
        typeof stored.intelligence === "string"
          ? stored.intelligence
          : "high"
    };
  } catch {
    return {
      provider: "my-ai",
      model: "",
      intelligence: "high"
    };
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
        provider: typeof item.provider === "string" ? item.provider : "",
        model: typeof item.model === "string" ? item.model : "",
        intelligence:
          typeof item.intelligence === "string" ? item.intelligence : ""
      }));
  } catch {
    return [];
  }
}

function formatTime() {
  return new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date());
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

function resolveSelection(current, providers) {
  const exactProvider = providers.find(
    (provider) => provider.id === current.provider
  );
  const exactModel = exactProvider?.models?.find(
    (model) => model.id === current.model
  );

  if (exactProvider?.available && exactModel) {
    return current;
  }

  const availableProvider = providers.find(
    (provider) => provider.available && provider.models?.length
  );

  if (availableProvider) {
    return {
      ...current,
      provider: availableProvider.id,
      model: availableProvider.models[0].id
    };
  }

  const firstProvider = providers.find((provider) => provider.models?.length);

  if (firstProvider) {
    return {
      ...current,
      provider: firstProvider.id,
      model: firstProvider.models[0].id
    };
  }

  return current;
}

function App() {
  const storedSelection = getStoredSelection();
  const [activeView, setActiveView] = useState("chat");
  const [backendStatus, setBackendStatus] = useState("checking");
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
  const [providers, setProviders] = useState([]);
  const [selectedModel, setSelectedModel] = useState(storedSelection.model);
  const [selectedProvider, setSelectedProvider] = useState(
    storedSelection.provider
  );
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
      const nextProviders = Array.isArray(data.providers)
        ? data.providers
        : [];

      setProviders(nextProviders);

      if (Array.isArray(data.intelligenceLevels)) {
        setIntelligenceLevels(data.intelligenceLevels);
      }

      const nextSelection = resolveSelection(
        {
          provider: selectedProvider,
          model: selectedModel,
          intelligence
        },
        nextProviders
      );

      setSelectedProvider(nextSelection.provider);
      setSelectedModel(nextSelection.model);
      setError("");
    } catch (requestError) {
      setError(
        requestError.message || "Unable to load AI providers and models"
      );
    } finally {
      setModelsLoading(false);
    }
  };

  useEffect(() => {
    refreshBackendStatus();
    refreshModels();
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
    try {
      localStorage.setItem(
        AI_SELECTION_KEY,
        JSON.stringify({
          provider: selectedProvider,
          model: selectedModel,
          intelligence
        })
      );
    } catch {
      return;
    }
  }, [intelligence, selectedModel, selectedProvider]);

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

  const selectedProviderRecord = providers.find(
    (provider) => provider.id === selectedProvider
  );
  const selectedAvailable = Boolean(
    selectedProviderRecord?.available &&
      selectedProviderRecord.models?.some(
        (model) => model.id === selectedModel
      )
  );
  const selectedProviderLabel =
    selectedProviderRecord?.label ||
    (selectedProvider === "openai" ? "OpenAI" : "My AI");

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

  const handleModelSelect = (provider, model) => {
    setSelectedProvider(provider);
    setSelectedModel(model);
    setError("");
  };

  const submitMessage = async (
    rawMessage,
    {
      history = messages,
      appendUser = true,
      selection = {
        provider: selectedProvider,
        model: selectedModel,
        intelligence
      }
    } = {}
  ) => {
    const text = rawMessage.trim();

    if (!text || isSending) return;

    const providerRecord = providers.find(
      (provider) => provider.id === selection.provider
    );
    const modelExists = providerRecord?.models?.some(
      (model) => model.id === selection.model
    );

    if (!providerRecord?.available || !modelExists) {
      setError(
        providerRecord?.status ||
          "The selected AI provider or model is unavailable."
      );
      return;
    }

    setActiveView("chat");
    setInput("");
    setError("");
    setIsSending(true);

    if (appendUser) {
      setMessages((current) => [
        ...current,
        createMessage("user", text, selection)
      ]);
    }

    try {
      const data = await sendChatMessage(
        text,
        toApiHistory(history),
        selection
      );

      setMessages((current) => [
        ...current,
        createMessage(
          "assistant",
          data.reply || "Shadower did not return a reply.",
          {
            provider: data.provider || selection.provider,
            model: data.model || selection.model,
            intelligence: data.intelligence || selection.intelligence
          }
        )
      ]);

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
      provider: message.provider || selectedProvider,
      model: message.model || selectedModel,
      intelligence: message.intelligence || intelligence
    };

    setMessages(messages.slice(0, lastUserIndex + 1));
    setSelectedProvider(selection.provider);
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
        onNewChat={startNewChat}
        onViewChange={changeView}
      />

      <section className="main-shell">
        <Topbar
          activeView={activeView}
          backendStatus={backendStatus}
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
                modelsLoading={modelsLoading}
                onChange={(event) => setInput(event.target.value)}
                onIntelligenceChange={setIntelligence}
                onKeyDown={handleKeyDown}
                onModelSelect={handleModelSelect}
                onRetry={retryLastMessage}
                onSendSuggestion={submitMessage}
                onSubmit={handleSubmit}
                providers={providers}
                selectedAvailable={selectedAvailable}
                selectedModel={selectedModel}
                selectedProvider={selectedProvider}
                selectedProviderLabel={selectedProviderLabel}
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
