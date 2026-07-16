import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../components/Icon";
import "./VoiceStudioPage.css";

const STORAGE_KEY = "shadower_voice_characters_v1";

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

const VOICE_ROLES = [
  "Narrator",
  "Female character",
  "Male character",
  "Child character",
  "Custom"
];

const EMPTY_FORM = {
  name: "",
  displayName: "",
  language: "English",
  voiceRole: "Narrator",
  linkedStory: "",
  description: "",
  avatar: "",
  permissionConfirmed: false
};

function loadCharacters() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function getInitials(name) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "VC"
  );
}

function StatCard({ icon, label, value, tone }) {
  return (
    <article className="voice-stat-card">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className={`voice-stat-icon ${tone}`}>
        <Icon name={icon} size={21} />
      </div>
    </article>
  );
}

function EmptyState({ onCreate }) {
  return (
    <section className="voice-empty-state">
      <div className="voice-empty-glow" />
      <div className="voice-empty-icon">
        <Icon name="voice" size={35} />
        <span>
          <Icon name="plus" size={14} />
        </span>
      </div>
      <h2>Create your first voice character</h2>
      <p>
        Create a character profile first. Voice samples and cloning will be
        connected to this character in the next stage.
      </p>
      <button className="voice-primary-button" onClick={onCreate} type="button">
        <Icon name="plus" size={17} />
        Create Character
      </button>
    </section>
  );
}

function CharacterCard({ character }) {
  return (
    <article className="voice-character-card">
      <div className="voice-character-head">
        {character.avatar ? (
          <img
            alt=""
            className="voice-character-avatar"
            src={character.avatar}
          />
        ) : (
          <div className="voice-character-avatar voice-avatar-fallback">
            {getInitials(character.name)}
          </div>
        )}

        <div className="voice-character-title">
          <h3>{character.name}</h3>
          <span>{character.displayName || character.voiceRole}</span>
        </div>

        <div className="voice-status-badge">
          <i />
          No samples
        </div>
      </div>

      <p className="voice-character-description">
        {character.description || "No voice description has been added yet."}
      </p>

      <div className="voice-character-details">
        <div>
          <span>Language</span>
          <strong>{character.language}</strong>
        </div>
        <div>
          <span>Samples</span>
          <strong>0 files · 0 min</strong>
        </div>
      </div>

      <button
        className="voice-manage-button"
        disabled
        title="Voice samples will be available in Stage 2"
        type="button"
      >
        <span>
          <Icon name="voice" size={17} />
          Manage Voice
        </span>
        <Icon name="chevronRight" size={16} />
      </button>
    </article>
  );
}

function Field({ children, error, label, required }) {
  return (
    <div className="voice-field">
      <label>
        {label} {required ? <em>*</em> : null}
      </label>
      {children}
      {error ? <small className="voice-field-error">{error}</small> : null}
    </div>
  );
}

function CreateCharacterModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => nameInputRef.current?.focus(), 80);

    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      setErrors({});
    }
  }, [open]);

  if (!open) return null;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const handleAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((current) => ({
        ...current,
        avatar: "Please choose a PNG, JPG or WEBP image."
      }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrors((current) => ({
        ...current,
        avatar: "Avatar must be smaller than 2 MB."
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => updateField("avatar", String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const submit = (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Character name is required.";
    }

    if (!form.permissionConfirmed) {
      nextErrors.permissionConfirmed =
        "Please confirm that you own the voice or have permission.";
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    onCreate({
      ...form,
      name: form.name.trim(),
      displayName: form.displayName.trim(),
      linkedStory: form.linkedStory.trim(),
      description: form.description.trim()
    });
  };

  return (
    <div
      aria-labelledby="voice-create-title"
      aria-modal="true"
      className="voice-modal-layer"
      role="dialog"
    >
      <button
        aria-label="Close create character dialog"
        className="voice-modal-backdrop"
        onClick={onClose}
        type="button"
      />

      <div className="voice-modal">
        <header className="voice-modal-header">
          <div>
            <span className="voice-modal-icon">
              <Icon name="voice" size={21} />
            </span>
            <h2 id="voice-create-title">Create Voice Character</h2>
            <p>Create the profile now. Voice samples will be added next.</p>
          </div>
          <button
            aria-label="Close"
            className="voice-modal-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>

        <form onSubmit={submit}>
          <div className="voice-modal-body">
            <div className="voice-avatar-row">
              <button
                className="voice-avatar-upload"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                {form.avatar ? (
                  <img alt="Character avatar preview" src={form.avatar} />
                ) : (
                  <>
                    <Icon name="user" size={26} />
                    <span>Add avatar</span>
                  </>
                )}
              </button>
              <input
                accept="image/*"
                className="voice-hidden-input"
                onChange={handleAvatar}
                ref={fileInputRef}
                type="file"
              />
              <div>
                <strong>Character avatar</strong>
                <p>PNG, JPG or WEBP. Maximum 2 MB.</p>
                <div className="voice-avatar-actions">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    Upload image
                  </button>
                  {form.avatar ? (
                    <button
                      className="danger"
                      onClick={() => updateField("avatar", "")}
                      type="button"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                {errors.avatar ? (
                  <small className="voice-field-error">{errors.avatar}</small>
                ) : null}
              </div>
            </div>

            <div className="voice-form-grid">
              <Field error={errors.name} label="Character name" required>
                <input
                  className={errors.name ? "invalid" : ""}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="e.g. Gu Wanyin"
                  ref={nameInputRef}
                  value={form.name}
                />
              </Field>

              <Field label="Display name">
                <input
                  onChange={(event) =>
                    updateField("displayName", event.target.value)
                  }
                  placeholder="Optional public name"
                  value={form.displayName}
                />
              </Field>

              <Field label="Default language" required>
                <select
                  onChange={(event) =>
                    updateField("language", event.target.value)
                  }
                  value={form.language}
                >
                  {LANGUAGES.map((language) => (
                    <option key={language}>{language}</option>
                  ))}
                </select>
              </Field>

              <Field label="Voice role">
                <select
                  onChange={(event) =>
                    updateField("voiceRole", event.target.value)
                  }
                  value={form.voiceRole}
                >
                  {VOICE_ROLES.map((role) => (
                    <option key={role}>{role}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Linked story">
              <input
                onChange={(event) =>
                  updateField("linkedStory", event.target.value)
                }
                placeholder="Optional story or project name"
                value={form.linkedStory}
              />
            </Field>

            <Field label="Voice description">
              <textarea
                maxLength={240}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="e.g. Soft, calm, warm and emotionally gentle narrator..."
                rows={4}
                value={form.description}
              />
              <span className="voice-character-count">
                {form.description.length}/240
              </span>
            </Field>

            <label
              className={`voice-permission-box ${
                errors.permissionConfirmed ? "invalid" : ""
              }`}
            >
              <input
                checked={form.permissionConfirmed}
                onChange={(event) =>
                  updateField("permissionConfirmed", event.target.checked)
                }
                type="checkbox"
              />
              <span>
                <strong>Voice ownership and permission</strong>
                <small>
                  I confirm that I own this voice or have clear permission from
                  its owner to create and use a clone.
                </small>
                {errors.permissionConfirmed ? (
                  <em>{errors.permissionConfirmed}</em>
                ) : null}
              </span>
            </label>
          </div>

          <footer className="voice-modal-footer">
            <button className="voice-secondary-button" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="voice-primary-button" type="submit">
              <Icon name="plus" size={17} />
              Create Character
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

function VoiceStudioPage() {
  const [characters, setCharacters] = useState(loadCharacters);
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("All languages");
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
    } catch {
      setNotice("Unable to save this character in your browser.");
    }
  }, [characters]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredCharacters = useMemo(() => {
    const query = search.trim().toLowerCase();

    return characters.filter((character) => {
      const languageMatches =
        language === "All languages" || character.language === language;
      const searchMatches =
        !query ||
        [
          character.name,
          character.displayName,
          character.description,
          character.linkedStory
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));

      return languageMatches && searchMatches;
    });
  }, [characters, language, search]);

  const createCharacter = (form) => {
    const character = {
      id: `voice-character-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,
      ...form,
      sampleCount: 0,
      sampleDuration: 0,
      status: "no-samples",
      createdAt: new Date().toISOString()
    };

    setCharacters((current) => [character, ...current]);
    setModalOpen(false);
    setNotice(`${character.name} was created successfully.`);
  };

  return (
    <main className="voice-studio-page">
      <div className="voice-studio-container">
        <header className="voice-studio-header">
          <div>
            <span className="voice-eyebrow">
              <Icon name="sparkles" size={14} />
              Voice Studio
            </span>
            <h1>Voice Characters</h1>
            <p>
              Create and organize the characters that will hold your voice
              samples, cloned voices and generated audio.
            </p>
          </div>
          <button
            className="voice-primary-button"
            onClick={() => setModalOpen(true)}
            type="button"
          >
            <Icon name="plus" size={17} />
            Create Character
          </button>
        </header>

        <section className="voice-stats-grid">
          <StatCard
            icon="user"
            label="Characters"
            tone="purple"
            value={characters.length}
          />
          <StatCard
            icon="voice"
            label="Voice samples"
            tone="pink"
            value="0"
          />
          <StatCard
            icon="document"
            label="Generated audio"
            tone="blue"
            value="0 min"
          />
        </section>

        {characters.length ? (
          <section className="voice-toolbar">
            <input
              aria-label="Search characters"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search characters..."
              type="search"
              value={search}
            />
            <select
              aria-label="Filter by language"
              onChange={(event) => setLanguage(event.target.value)}
              value={language}
            >
              <option>All languages</option>
              {LANGUAGES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </section>
        ) : null}

        {!characters.length ? (
          <EmptyState onCreate={() => setModalOpen(true)} />
        ) : !filteredCharacters.length ? (
          <section className="voice-no-results">
            <Icon name="user" size={25} />
            <h2>No characters found</h2>
            <p>Try another name or language filter.</p>
          </section>
        ) : (
          <section className="voice-character-grid">
            {filteredCharacters.map((character) => (
              <CharacterCard character={character} key={character.id} />
            ))}
          </section>
        )}
      </div>

      <CreateCharacterModal
        onClose={() => setModalOpen(false)}
        onCreate={createCharacter}
        open={modalOpen}
      />

      {notice ? (
        <div className="voice-toast" role="status">
          <span>✓</span>
          {notice}
        </div>
      ) : null}
    </main>
  );
}

export default VoiceStudioPage;
