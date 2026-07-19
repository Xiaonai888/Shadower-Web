import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../components/Icon";
import { generateKhmerVoice, getVoiceSamples } from "../services/voiceApi";

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
  "Khmer",
  "English",
  "Chinese",
  "Korean",
  "Japanese",
  "Thai",
  "Vietnamese",
  "Other"
];
const MAX_TEST_TEXT = 250;

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

function formatClock(seconds = 0) {
  const safe = Number.isFinite(seconds) ? Math.max(seconds, 0) : 0;
  const minutes = Math.floor(safe / 60);
  const remaining = Math.floor(safe % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
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
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioTime, setAudioTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState("");
  const [characterId, setCharacterId] = useState("");
  const [emotion, setEmotion] = useState("Neutral");
  const [generating, setGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [language, setLanguage] = useState("Khmer");
  const [model, setModel] = useState("natural-v1");
  const [pitch, setPitch] = useState(0);
  const [quality, setQuality] = useState("high");
  const [script, setScript] = useState(
    "បើខ្ញុំខំរៀនខ្ញុំមុខជារស់ស្រួលនៅថ្ងៃក្រោយ"
  );
  const [speed, setSpeed] = useState(1);
  const [stability, setStability] = useState(75);
  const audioRef = useRef(null);
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

  useEffect(
    () => () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    },
    [audioUrl]
  );

  const selectedCharacter = useMemo(
    () => characters.find((character) => character.id === characterId) || null,
    [characterId, characters]
  );

  const insertPause = () => {
    const input = textareaRef.current;
    const token = " ... ";
    const start = input?.selectionStart ?? script.length;
    const end = input?.selectionEnd ?? script.length;
    const next = `${script.slice(0, start)}${token}${script.slice(end)}`.slice(
      0,
      MAX_TEST_TEXT
    );

    setScript(next);
    window.setTimeout(() => {
      const cursor = Math.min(start + token.length, next.length);
      input?.focus();
      input?.setSelectionRange(cursor, cursor);
    }, 0);
  };

  const improveScript = () => {
    if (!script.trim()) {
      onNotice("Write or paste your Khmer text first.", "error");
      return;
    }

    onNotice("AI Improve will be connected after Khmer voice generation works.", "info");
  };

  const clearAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl("");
    setAudioDuration(0);
    setAudioTime(0);
    setIsPlaying(false);
  };

  const generateVoice = async () => {
    if (!selectedCharacter) {
      onNotice("Create or select a voice character first.", "error");
      return;
    }

    if (!script.trim()) {
      onNotice("Write the Khmer text you want the character to speak.", "error");
      textareaRef.current?.focus();
      return;
    }

    if (script.trim().length > MAX_TEST_TEXT) {
      onNotice(`Use no more than ${MAX_TEST_TEXT} characters for the first test.`, "error");
      return;
    }

    if (!(Number(selectedCharacter.sampleCount) > 0)) {
      onNotice("Add a voice sample to this character before generating audio.", "error");
      return;
    }

    setGenerating(true);
    clearAudio();
    onNotice("Generating Khmer voice. The first request can take a few minutes.", "info");

    try {
      const sampleData = await getVoiceSamples(selectedCharacter.id);
      const samples = Array.isArray(sampleData.samples) ? sampleData.samples : [];
      const sample =
        samples.find(
          (item) => item.status === "ready" && item.includeInTraining
        ) || samples.find((item) => item.status === "ready");

      if (!sample) {
        throw new Error("This character has no ready voice sample.");
      }

      const audioBlob = await generateKhmerVoice({
        characterId: selectedCharacter.id,
        sampleId: sample.id,
        text: script.trim(),
        language,
        model,
        quality,
        speed,
        pitch,
        emotion,
        stability
      });

      const nextUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(nextUrl);
      onNotice("Khmer voice was generated. Press Play to listen.", "success");
    } catch (error) {
      onNotice(error.message || "Unable to generate Khmer voice.", "error");
    } finally {
      setGenerating(false);
    }
  };

  const togglePlayback = async () => {
    const player = audioRef.current;
    if (!player || !audioUrl) return;

    if (player.paused) {
      await player.play();
    } else {
      player.pause();
    }
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `${selectedCharacter?.name || "shadower"}-khmer-voice.wav`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const progress =
    audioDuration > 0 ? Math.min((audioTime / audioDuration) * 100, 100) : 0;

  return (
    <section className="voice-create-panel">
      <div className="voice-create-section voice-create-voice-section">
        <div className="voice-create-section-heading">
          <div>
            <span>Select voice</span>
            <p>Choose the character that will speak your Khmer text.</p>
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
            <p>First Khmer test · maximum {MAX_TEST_TEXT} characters.</p>
          </div>
        </div>

        <div className="voice-create-textarea-wrap">
          <textarea
            maxLength={MAX_TEST_TEXT}
            onChange={(event) => setScript(event.target.value)}
            placeholder="សរសេរអត្ថបទខ្មែរដែលចង់ឱ្យសំឡេងនេះនិយាយ..."
            ref={textareaRef}
            value={script}
          />
          <span>{script.length} / {MAX_TEST_TEXT}</span>
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

          <button
            className="voice-create-ai-button"
            onClick={improveScript}
            type="button"
          >
            <Icon name="sparkles" size={16} />
            AI Improve
          </button>
        </div>
      </div>

      <div className="voice-create-section">
        <div className="voice-create-section-heading">
          <div>
            <span>Voice settings</span>
            <p>Settings will be activated gradually after the first successful sound.</p>
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
        disabled={generating}
        onClick={generateVoice}
        type="button"
      >
        <Icon name="sparkles" size={19} />
        {generating ? "Generating Khmer Voice..." : "Generate Voice"}
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
              <strong>
                {audioUrl ? "Khmer voice generated" : "No audio generated yet"}
              </strong>
              <small>
                {audioUrl
                  ? "Press Play to listen or Download to save the WAV file."
                  : "Generate audio to preview, save, or download it."}
              </small>
            </div>
          </div>

          <audio
            hidden
            onEnded={() => setIsPlaying(false)}
            onLoadedMetadata={(event) =>
              setAudioDuration(Number(event.currentTarget.duration) || 0)
            }
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onTimeUpdate={(event) =>
              setAudioTime(Number(event.currentTarget.currentTime) || 0)
            }
            ref={audioRef}
            src={audioUrl}
          />

          <div className="voice-create-player">
            <button
              aria-label={isPlaying ? "Pause latest audio" : "Play latest audio"}
              disabled={!audioUrl}
              onClick={togglePlayback}
              type="button"
            >
              {isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
            </button>
            <div>
              <span>
                <i
                  style={{
                    display: "block",
                    height: "100%",
                    width: `${progress}%`,
                    borderRadius: "999px",
                    background: "var(--vs-accent)"
                  }}
                />
              </span>
              <small>
                <b>{formatClock(audioTime)}</b>
                <b>{formatClock(audioDuration)}</b>
              </small>
            </div>
            <button
              aria-label="Download latest audio"
              disabled={!audioUrl}
              onClick={downloadAudio}
              type="button"
            >
              <DownloadIcon size={17} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default VoiceStudioCreatePanel;
