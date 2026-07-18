import { useEffect, useState } from "react";
import Icon from "../components/Icon";
import { getVoiceCharacters } from "../services/voiceApi";
import VoiceStudioCreatePanel from "./VoiceStudioCreatePanel";
import VoiceStudioPage from "./VoiceStudioPage";
import "./VoiceStudioWorkspacePage.css";

const TABS = [
  { id: "create", label: "Create Audio" },
  { id: "voices", label: "Voices" },
  { id: "history", label: "History" }
];

function VoiceStudioWorkspacePage() {
  const [activeTab, setActiveTab] = useState("create");
  const [characters, setCharacters] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");

  const showNotice = (message, type = "success") => {
    setNotice(message);
    setNoticeType(type);
  };

  const loadCharacters = async () => {
    setLoading(true);
    setLoadError("");

    try {
      const data = await getVoiceCharacters();
      setCharacters(Array.isArray(data.characters) ? data.characters : []);
    } catch (error) {
      setLoadError(error.message || "Unable to load voice characters.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCharacters();
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const changeTab = (tabId) => {
    setActiveTab(tabId);

    if (tabId === "create") {
      loadCharacters();
    }
  };

  return (
    <div className="voice-workspace-page">
      <div className="voice-workspace-container">
        <header className="voice-workspace-header">
          <span>
            <Icon name="voice" size={18} />
            Voice Studio
          </span>
          <h1>Create speech with your own voices</h1>
          <p>
            Write your script, select a voice character, adjust the delivery,
            and generate natural audio.
          </p>
        </header>

        <nav aria-label="Voice Studio sections" className="voice-workspace-tabs">
          {TABS.map((tab) => (
            <button
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={activeTab === tab.id ? "active" : ""}
              key={tab.id}
              onClick={() => changeTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === "create" ? (
          <VoiceStudioCreatePanel
            characters={characters}
            loadError={loadError}
            loading={loading}
            onNotice={showNotice}
            onOpenVoices={() => setActiveTab("voices")}
            onRetry={loadCharacters}
          />
        ) : activeTab === "voices" ? (
          <section className="voice-workspace-voices">
            <VoiceStudioPage />
          </section>
        ) : (
          <section className="voice-workspace-history">
            <div className="voice-workspace-history-icon">
              <Icon name="document" size={28} />
            </div>
            <h2>No generated audio yet</h2>
            <p>
              Generated files will appear here with their voice, model,
              duration, playback, download, and delete actions.
            </p>
            <button onClick={() => setActiveTab("create")} type="button">
              <Icon name="plus" size={16} />
              Create Audio
            </button>
          </section>
        )}
      </div>

      {notice ? (
        <div className={`voice-workspace-toast ${noticeType}`} role="status">
          <span>{noticeType === "error" ? "!" : noticeType === "info" ? "i" : "✓"}</span>
          {notice}
        </div>
      ) : null}
    </div>
  );
}

export default VoiceStudioWorkspacePage;
