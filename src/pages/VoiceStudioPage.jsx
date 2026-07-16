import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../components/Icon";
import {
  createVoiceCharacter,
  deleteVoiceCharacter,
  getVoiceCharacters,
  updateVoiceCharacter
} from "../services/voiceApi";
import "./VoiceStudioPage.css";

const LEGACY_STORAGE_KEY = "shadower_voice_characters_v1";
const MIGRATION_KEY = "shadower_voice_characters_api_migrated_v1";

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
  permissionConfirmed: false
};

function readLegacyCharacters() {
  try {
    const value = JSON.parse(
      window.localStorage.getItem(LEGACY_STORAGE_KEY) || "[]"
    );
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function characterMatches(left, right) {
  return (
    left.name?.trim().toLowerCase() === right.name?.trim().toLowerCase() &&
    left.language?.trim().toLowerCase() ===
      right.language?.trim().toLowerCase() &&
    (left.displayName || "").trim().toLowerCase() ===
      (right.displayName || "").trim().toLowerCase()
  );
}

async function migrateLegacyCharacters(serverCharacters) {
  try {
    if (window.localStorage.getItem(MIGRATION_KEY) === "done") {
      return { characters: serverCharacters, migratedCount: 0 };
    }
  } catch {
    return { characters: serverCharacters, migratedCount: 0 };
  }

  const legacyCharacters = readLegacyCharacters();
  const characters = [...serverCharacters];
  let migratedCount = 0;

  for (const legacy of legacyCharacters) {
    if (!legacy?.name?.trim()) continue;
    if (characters.some((item) => characterMatches(item, legacy))) continue;

    const data = await createVoiceCharacter({
      name: legacy.name.trim(),
      displayName: legacy.displayName?.trim() || null,
      language: legacy.language?.trim() || "English",
      voiceRole: legacy.voiceRole?.trim() || "Narrator",
      linkedStory: legacy.linkedStory?.trim() || null,
      description: legacy.description?.trim() || null,
      avatarUrl: null,
      permissionConfirmed: true
    });

    if (data.character) {
      characters.unshift(data.character);
      migratedCount += 1;
    }
  }

  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    window.localStorage.setItem(MIGRATION_KEY, "done");
  } catch {
    return { characters, migratedCount };
  }

  return { characters, migratedCount };
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

function formatDuration(seconds = 0) {
  const minutes = Math.max(Number(seconds) || 0, 0) / 60;
  if (!minutes) return "0 min";
  return `${minutes < 10 ? minutes.toFixed(1) : Math.round(minutes)} min`;
}

function getStatusLabel(status) {
  const labels = {
    "no-samples": "No samples",
    "ready-to-clone": "Ready to clone",
    processing: "Processing",
    ready: "Voice ready",
    failed: "Failed"
  };

  return labels[status] || "No samples";
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

function CharacterCard({ character, deleting, onDelete, onEdit }) {
  return (
    <article className="voice-character-card">
      <div className="voice-character-head">
        {character.avatarUrl ? (
          <img
            alt=""
            className="voice-character-avatar"
            src={character.avatarUrl}
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

        <div className={`voice-status-badge ${character.status || "no-samples"}`}>
          <i />
          {getStatusLabel(character.status)}
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
          <strong>
            {character.sampleCount || 0} files · {formatDuration(character.sampleDurationSeconds)}
          </strong>
        </div>
      </div>

      <div className="voice-character-actions">
        <button className="voice-card-action" onClick={onEdit} type="button">
          <Icon name="pen" size={15} />
          Edit
        </button>
        <button
          className="voice-card-action danger"
          disabled={deleting}
          onClick={onDelete}
          type="button"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      <button
        className="voice-manage-button"
        disabled
        title="Voice upload will be available in Stage 4"
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

function getCharacterForm(character) {
  if (!character) return EMPTY_FORM;

  return {
    name: character.name || "",
    displayName: character.displayName || "",
    language: character.language || "English",
    voiceRole: character.voiceRole || "Narrator",
    linkedStory: character.linkedStory || "",
    description: character.description || "",
    permissionConfirmed: true
  };
}

function CharacterModal({
  character,
  open,
  onClose,
  onSubmit,
  saving,
  submitError
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const nameInputRef = useRef(null);
  const editing = Boolean(character);

  useEffect(() => {
    if (!open) return;
    setForm(getCharacterForm(character));
    setErrors({});
  }, [character, open]);

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

  if (!open) return null;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const submit = (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Character name is required.";
    }

    if (!editing && !form.permissionConfirmed) {
      nextErrors.permissionConfirmed =
        "Please confirm that you own the voice or have permission.";
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({
      name: form.name.trim(),
      displayName: form.displayName.trim() || null,
      language: form.language,
      voiceRole: form.voiceRole,
      linkedStory: form.linkedStory.trim() || null,
      description: form.description.trim() || null,
      ...(editing ? {} : { permissionConfirmed: true })
    });
  };

  return (
    <div
      aria-labelledby="voice-character-modal-title"
      aria-modal="true"
      className="voice-modal-layer"
      role="dialog"
    >
      <button
        aria-label="Close character dialog"
        className="voice-modal-backdrop"
        disabled={saving}
        onClick={onClose}
        type="button"
      />

      <div className="voice-modal">
        <header className="voice-modal-header">
          <div>
            <span className="voice-modal-icon">
              <Icon name={editing ? "pen" : "voice"} size={21} />
            </span>
            <h2 id="voice-character-modal-title">
              {editing ? "Edit Voice Character" : "Create Voice Character"}
            </h2>
            <p>
              {editing
                ? "Update this character profile."
                : "Create the profile now. Voice samples will be added next."}
            </p>
          </div>
          <button
            aria-label="Close"
            className="voice-modal-close"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>

        <form onSubmit={submit}>
          <div className="voice-modal-body">
            <div className="voice-avatar-row">
              <div className="voice-avatar-upload">
                {character?.avatarUrl ? (
                  <img alt="Character avatar" src={character.avatarUrl} />
                ) : (
                  <>
                    <Icon name="user" size={26} />
                    <span>Avatar</span>
                  </>
                )}
              </div>
              <div>
                <strong>Character avatar</strong>
                <p>Avatar upload will be connected with cloud storage later.</p>
              </div>
            </div>

            <div className="voice-form-grid">
              <Field error={errors.name} label="Character name" required>
                <input
                  className={errors.name ? "invalid" : ""}
                  maxLength={120}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="e.g. Gu Wanyin"
                  ref={nameInputRef}
                  value={form.name}
                />
              </Field>

              <Field label="Display name">
                <input
                  maxLength={120}
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

              <Field label="Voice role" required>
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
                maxLength={160}
                onChange={(event) =>
                  updateField("linkedStory", event.target.value)
                }
                placeholder="Optional story or project name"
                value={form.linkedStory}
              />
            </Field>

            <Field label="Voice description">
              <textarea
                maxLength={500}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="e.g. Soft, calm, warm and emotionally gentle narrator..."
                rows={4}
                value={form.description}
              />
              <span className="voice-character-count">
                {form.description.length}/500
              </span>
            </Field>

            {!editing ? (
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
                    I confirm that I own this voice or have clear permission
                    from its owner to create and use a clone.
                  </small>
                  {errors.permissionConfirmed ? (
                    <em>{errors.permissionConfirmed}</em>
                  ) : null}
                </span>
              </label>
            ) : null}

            {submitError ? (
              <div className="voice-form-server-error" role="alert">
                {submitError}
              </div>
            ) : null}
          </div>

          <footer className="voice-modal-footer">
            <button
              className="voice-secondary-button"
              disabled={saving}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="voice-primary-button"
              disabled={saving}
              type="submit"
            >
              <Icon name={editing ? "pen" : "plus"} size={17} />
              {saving
                ? "Saving..."
                : editing
                  ? "Save Changes"
                  : "Create Character"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

function VoiceStudioPage() {
  const [characters, setCharacters] = useState([]);
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("All languages");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState(null);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [deletingId, setDeletingId] = useState("");
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
      const serverCharacters = Array.isArray(data.characters)
        ? data.characters
        : [];
      const migrated = await migrateLegacyCharacters(serverCharacters);

      setCharacters(migrated.characters);

      if (migrated.migratedCount) {
        showNotice(
          `${migrated.migratedCount} browser character saved to the database.`
        );
      }
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
    const timer = window.setTimeout(() => setNotice(""), 3200);
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

  const totalSamples = characters.reduce(
    (sum, character) => sum + (Number(character.sampleCount) || 0),
    0
  );

  const openCreate = () => {
    setEditingCharacter(null);
    setSubmitError("");
    setModalOpen(true);
  };

  const openEdit = (character) => {
    setEditingCharacter(character);
    setSubmitError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingCharacter(null);
    setSubmitError("");
  };

  const saveCharacter = async (form) => {
    setSaving(true);
    setSubmitError("");

    try {
      if (editingCharacter) {
        const data = await updateVoiceCharacter(editingCharacter.id, form);
        setCharacters((current) =>
          current.map((item) =>
            item.id === editingCharacter.id ? data.character : item
          )
        );
        showNotice(`${data.character.name} was updated successfully.`);
      } else {
        const data = await createVoiceCharacter({ ...form, avatarUrl: null });
        setCharacters((current) => [data.character, ...current]);
        showNotice(`${data.character.name} was created successfully.`);
      }

      setModalOpen(false);
      setEditingCharacter(null);
    } catch (error) {
      setSubmitError(error.message || "Unable to save this character.");
    } finally {
      setSaving(false);
    }
  };

  const removeCharacter = async (character) => {
    const confirmed = window.confirm(
      `Delete “${character.name}”? This character will be removed from Voice Studio.`
    );

    if (!confirmed) return;

    setDeletingId(character.id);

    try {
      await deleteVoiceCharacter(character.id);
      setCharacters((current) =>
        current.filter((item) => item.id !== character.id)
      );
      showNotice(`${character.name} was deleted successfully.`);
    } catch (error) {
      showNotice(error.message || "Unable to delete this character.", "error");
    } finally {
      setDeletingId("");
    }
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
            onClick={openCreate}
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
            value={totalSamples}
          />
          <StatCard
            icon="document"
            label="Generated audio"
            tone="blue"
            value="0 min"
          />
        </section>

        {!loading && !loadError && characters.length ? (
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

        {loading ? (
          <section className="voice-request-state">
            <span className="voice-loading-spinner" />
            <h2>Loading voice characters</h2>
            <p>Connecting to Shadower Backend...</p>
          </section>
        ) : loadError ? (
          <section className="voice-request-state error">
            <Icon name="voice" size={27} />
            <h2>Unable to load Voice Studio</h2>
            <p>{loadError}</p>
            <button
              className="voice-primary-button"
              onClick={loadCharacters}
              type="button"
            >
              Try Again
            </button>
          </section>
        ) : !characters.length ? (
          <EmptyState onCreate={openCreate} />
        ) : !filteredCharacters.length ? (
          <section className="voice-no-results">
            <Icon name="user" size={25} />
            <h2>No characters found</h2>
            <p>Try another name or language filter.</p>
          </section>
        ) : (
          <section className="voice-character-grid">
            {filteredCharacters.map((character) => (
              <CharacterCard
                character={character}
                deleting={deletingId === character.id}
                key={character.id}
                onDelete={() => removeCharacter(character)}
                onEdit={() => openEdit(character)}
              />
            ))}
          </section>
        )}
      </div>

      <CharacterModal
        character={editingCharacter}
        onClose={closeModal}
        onSubmit={saveCharacter}
        open={modalOpen}
        saving={saving}
        submitError={submitError}
      />

      {notice ? (
        <div className={`voice-toast ${noticeType}`} role="status">
          <span>{noticeType === "error" ? "!" : "✓"}</span>
          {notice}
        </div>
      ) : null}
    </main>
  );
}

export default VoiceStudioPage;
