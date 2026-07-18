import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../components/Icon";

const MODELS = [
  { id: "natural-v1", label: "Natural v1" },
  { id: "expressive-v1", label: "Expressive v1" },
  { id: "studio-v1", label: "Studio v1" }
];

const QUALITIES = [
  { id: "high", label: "High" },
  { id: "balanced", label: "Balanced" },
  { id: "fast", label: "Fast" }
];

const EMOTIONS = [
  "Neutral",
  "Soft",
  "Warm",
  "Happy",
  "Sad",
  "Calm",
  "Serious",
  "Excited"
];

const LANGUAGES = [
  "English",
  "Khmer",
  "Chinese",
  "Korean",
  "Japanese",
  "Thai",
  "Vietnamese",
  "Other"
];

function PlayIcon({ size = 18 }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d="m8 5 11 7-11 7V5Z"
        fill="currentColor"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function DownloadIcon({ size = 18 }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  );
}

function PauseIcon({ size = 16 }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
    >
      <path d="M9 6v12" />
      <path d="M15 6v12" />
    </svg>
  );
}

function TrashIcon({ size = 16 }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="m7 7 1 13h8l1-13" />
    </svg>
  );
}

function getInitials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "VC"
  );
}

function SliderField({ icon, label, max, min, onChange, step, suffix, value }) {
  return (
    <label className="voice-create-setting-card">
      <span className="voice-create-setting-title">
        <Icon name={icon} size={16} />
        {label}
      </span>
      <strong>
        {value}
        {suffix}
      </strong>
      <input
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
    </label>
  );
}

function VoiceStudioCreatePanel({
  characters,
  loadError,
  loading,
  onNotice,
  onOpenVoices,
  onRetry
}) {
  const [characterId, setCharacterId] = useState("");
  const [emotion, setEmotion] = useState("Neutral");
  const [language, setLanguage] = useState("English");
  const [model, setModel] = useState("natural-v1");
  const [pitch, setPitch] = useState(0);
  const [quality, setQuality] = useState("high");
  const [script, setScript] = useState("");
  const [speed, setSpeed] = useState(1);
  const [stability, setStability] = useState(75);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!characters.length) {
      setCharacterId("");
      return;
    }

    setCharacterId((current) =>
      characters.some((character) => character.id === current)
        ? current
        : characters[0].id
    );
  }, [characters]);

  const selectedCharacter = useMemo(
    () => characters.find((character) => character.id === characterId) || null,
    [characterId, characters]
  );

  useEffect(() => {
    if (selectedCharacter?.language) {
      setLanguage(selectedCharacter.language);
    }
  }, [selectedCharacter?.id, selectedCharacter?.language]);

  const insertPause = () => {
    const input = textareaRef.current;
    const token = "[pause 0.5s]";

    if (!input) {
      setScript((current) => `${current}${current ? " " : ""}${token}`);
      return;
    }

    const start = input.selectionStart ?? script.length;
    const end = input.selectionEnd ?? script.length;
    const before = script.slice(0, start);
    const after = script.slice(end);
    const prefix = before && !before.endsWith(" ") ? " " : "";
    const suffix = after && !after.startsWith(" ") ? " " : "";
    const next = `${before}${prefix}${token}${suffix}${after}`.slice(0, 5000);

    setScript(next);
    window.setTimeout(() => {
      const cursor = Math.min(
        start + prefix.length + token.length + suffix.length,
        next.length
      );
      input.focus();
      input.setSelectionRange(cursor, cursor);
    }, 0);
  };

  const improveScript = () => {
    if (!script.trim()) {
      onNotice("Write or paste your script first.", "error");
      return;
    }

    onNotice("AI Improve will be connected with the voice engine in the next stage.", "info");
  };

  const generateVoice = () => {
    if (!selectedCharacter) {
      onNotice("Create or select a voice character first.", "error");
      return;
    }

    if (!script.trim()) {
      onNotice("Write the text you want the character to speak.", "error");
      textareaRef.current?.focus();
      return;
    }

    if (!(Number(selectedCharacter.sampleCount) > 0)) {
      onNotice("Add voice samples to this character before generating audio.", "error");
      return;
    }

    onNotice("The Create Audio interface is ready. The generation engine is the next stage.", "info");
  };

  return (
    <section className="voice-create-panel">
      <div className="voice-create-section voice-create-voice-section">
        <div className="voice-create-section-heading">
          <div>
            <span>Select voice</span>
            <p>Choose the character that will speak your text.</p>
          </div>
          <button onClick={onOpenVoices} type="button">
            Manage Voices
          </button>
        </div>

        {loading ? (
          <div className="voice-create-state">
            <span className="voice-create-spinner" />
            Loading your voices...
          </div>
        ) : loadError ? (
          <div className="voice-create-state error">
            <span>{loadError}</span>
            <button onClick={onRetry} type="button">
              Try Again
            </button>
          </div>
        ) : !characters.length ? (
          <div className="voice-create-empty-voice">
            <div className="voice-create-empty-icon">
              <Icon name="voice" size={24} />
            </div>
            <div>
              <strong>No voice character yet</strong>
              <span>Create a character and upload voice samples first.</span>
            </div>
            <button onClick={onOpenVoices} type="button">
              Create Voice
            </button>
          </div>
        ) : (
          <div className="voice-create-character-select">
            {selectedCharacter?.avatarUrl ? (
              <img
                alt={`${selectedCharacter.name} profile`}
                src={selectedCharacter.avatarUrl}
              />
            ) : (
              <span className="voice-create-avatar-fallback">
                {getInitials(selectedCharacter?.name)}
              </span>
            )}

            <div>
              <strong>{selectedCharacter?.name}</strong>
              <small>
                {selectedCharacter?.displayName ||
                  selectedCharacter?.voiceRole ||
                  "Voice character"}
              </small>
            </div>

            <Icon name="chevronDown" size={18} />

            <select
              aria-label="Select voice character"
              onChange={(event) => setCharacterId(event.target.value)}
              value={characterId}
            >
              {characters.map((character) => (
                <option key={character.id} value={character.id}>
                  {character.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="voice-create-control-grid">
        <label className="voice-create-control">
          <span>Model</span>
          <select onChange={(event) => setModel(event.target.value)} value={model}>
            {MODELS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="voice-create-control">
          <span>Language</span>
          <select
            onChange={(event) => setLanguage(event.target.value)}
            value={language}
          >
            {LANGUAGES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="voice-create-control">
          <span>Quality</span>
          <select
            onChange={(event) => setQuality(event.target.value)}
            value={quality}
          >
            {QUALITIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="voice-create-section voice-create-script-section">
        <div className="voice-create-section-heading">
          <div>
            <span>Text to speech</span>
            <p>Write clearly and use pause markers for more natural delivery.</p>
          </div>
        </div>

        <div className="voice-create-textarea-wrap">
          <textarea
            maxLength={5000}
            onChange={(event) => setScript(event.target.value)}
            placeholder="Type or paste the text you want the voice to speak..."
            ref={textareaRef}
            value={script}
          />
          <span>{script.length} / 5000</span>
        </div>

        <div className="voice-create-script-actions">
          <div>
            <button onClick={insertPause} type="button">
              <PauseIcon />
              Insert Pause
            </button>
            <button
              disabled={!script}
              onClick={() => setScript("")}
              type="button"
            >
              <TrashIcon />
              Clear
            </button>
          </div>

          <button className="voice-create-ai-button" onClick={improveScript} type="button">
            <Icon name="sparkles" size={16} />
            AI Improve
          </button>
        </div>
      </div>

      <div className="voice-create-section">
        <div className="voice-create-section-heading">
          <div>
            <span>Voice settings</span>
            <p>Fine-tune the tone without changing the original voice identity.</p>
          </div>
        </div>

        <div className="voice-create-settings-grid">
          <SliderField
            icon="settings"
            label="Speed"
            max={2}
            min={0.5}
            onChange={setSpeed}
            step={0.1}
            suffix="x"
            value={speed}
          />

          <SliderField
            icon="voice"
            label="Pitch"
            max={20}
            min={-20}
            onChange={setPitch}
            step={1}
            suffix="%"
            value={pitch}
          />

          <label className="voice-create-setting-card voice-create-emotion-card">
            <span className="voice-create-setting-title">
              <Icon name="sparkles" size={16} />
              Emotion
            </span>
            <select
              onChange={(event) => setEmotion(event.target.value)}
              value={emotion}
            >
              {EMOTIONS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <SliderField
            icon="shield"
            label="Stability"
            max={100}
            min={0}
            onChange={setStability}
            step={1}
            suffix="%"
            value={stability}
          />
        </div>
      </div>

      <button
        className="voice-create-generate-button"
        onClick={generateVoice}
        type="button"
      >
        <Icon name="sparkles" size={19} />
        Generate Voice
      </button>

      <div className="voice-create-section voice-create-output-section">
        <div className="voice-create-section-heading">
          <div>
            <span>Latest output</span>
            <p>Your newest generated audio will appear here.</p>
          </div>
        </div>

        <div className="voice-create-output">
          <div className="voice-create-output-note">
            <span>
              <Icon name="voice" size={22} />
            </span>
            <div>
              <strong>No audio generated yet</strong>
              <small>Generate audio to preview, save, or download it.</small>
            </div>
          </div>

          <div className="voice-create-player">
            <button aria-label="Play latest audio" disabled type="button">
              <PlayIcon size={16} />
            </button>
            <div>
              <span />
              <small>
                <b>00:00</b>
                <b>00:00</b>
              </small>
            </div>
            <button aria-label="Download latest audio" disabled type="button">
              <DownloadIcon size={17} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default VoiceStudioCreatePanel;
