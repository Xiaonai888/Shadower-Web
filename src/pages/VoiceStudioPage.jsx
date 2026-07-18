import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../components/Icon";
import {
  completeVoiceAvatarUpload,
  completeVoiceSampleUpload,
  createVoiceCharacter,
  deleteVoiceAvatar,
  deleteVoiceCharacter,
  deleteVoiceSample,
  getVoiceCharacters,
  getVoiceSamplePlayUrl,
  getVoiceSamples,
  requestVoiceAvatarUpload,
  requestVoiceSampleUpload,
  updateVoiceCharacter,
  updateVoiceSample,
  uploadVoiceFile
} from "../services/voiceApi";
import "./VoiceStudioPage.css";
import "./VoiceSamplesModal.css";
import "./VoiceCharacterAvatar.css";

const LEGACY_STORAGE_KEY = "shadower_voice_characters_v1";
const MIGRATION_KEY = "shadower_voice_characters_api_migrated_v1";
const MAX_FILE_BYTES = 100 * 1024 * 1024;
const MAX_FILES_PER_BATCH = 20;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

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

const MIME_BY_EXTENSION = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  aac: "audio/aac",
  ogg: "audio/ogg",
  webm: "audio/webm",
  flac: "audio/flac"
};

const IMAGE_MIME_BY_EXTENSION = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp"
};

const ALLOWED_MIME_TYPES = new Set(Object.values(MIME_BY_EXTENSION));
const ALLOWED_IMAGE_TYPES = new Set(Object.values(IMAGE_MIME_BY_EXTENSION));

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
  const totalSeconds = Math.max(Number(seconds) || 0, 0);
  if (!totalSeconds) return "0 sec";
  if (totalSeconds < 60) return `${Math.round(totalSeconds)} sec`;
  const minutes = totalSeconds / 60;
  return `${minutes < 10 ? minutes.toFixed(1) : Math.round(minutes)} min`;
}

function formatFileSize(bytes = 0) {
  const size = Math.max(Number(bytes) || 0, 0);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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

function getFileMimeType(file) {
  const browserType = file.type?.split(";", 1)[0].trim().toLowerCase();
  if (ALLOWED_MIME_TYPES.has(browserType)) return browserType;
  const extension = file.name.split(".").pop()?.toLowerCase();
  return MIME_BY_EXTENSION[extension] || "";
}

function getImageMimeType(file) {
  const browserType = file.type?.split(";", 1)[0].trim().toLowerCase();
  if (ALLOWED_IMAGE_TYPES.has(browserType)) return browserType;
  const extension = file.name.split(".").pop()?.toLowerCase();
  return IMAGE_MIME_BY_EXTENSION[extension] || "";
}

function getAudioDuration(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const audio = document.createElement("audio");
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Unable to read audio duration"));
    }, 15000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      audio.removeAttribute("src");
      audio.load();
      URL.revokeObjectURL(objectUrl);
    };

    audio.preload = "metadata";
    audio.addEventListener(
      "loadedmetadata",
      () => {
        const duration = Number(audio.duration);
        cleanup();
        if (!Number.isFinite(duration) || duration <= 0) {
          reject(new Error("This audio file has an invalid duration"));
          return;
        }
        resolve(duration);
      },
      { once: true }
    );
    audio.addEventListener(
      "error",
      () => {
        cleanup();
        reject(new Error("Browser could not read this audio file"));
      },
      { once: true }
    );
    audio.src = objectUrl;
  });
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
      <p>Create a character profile, then add voice samples to that character.</p>
      <button className="voice-primary-button" onClick={onCreate} type="button">
        <Icon name="plus" size={17} />
        Create Character
      </button>
    </section>
  );
}

function CharacterCard({
  character,
  deleting,
  onDelete,
  onEdit,
  onManage
}) {
  return (
    <article className="voice-character-card">
      <div className="voice-character-head">
        {character.avatarUrl ? (
          <img
            alt={`${character.name} profile`}
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
            {character.sampleCount || 0} files ·{" "}
            {formatDuration(character.sampleDurationSeconds)}
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

      <button className="voice-manage-button" onClick={onManage} type="button">
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
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarMimeType, setAvatarMimeType] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const nameInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const localAvatarUrlRef = useRef("");
  const editing = Boolean(character);

  const clearLocalAvatarUrl = () => {
    if (localAvatarUrlRef.current) {
      URL.revokeObjectURL(localAvatarUrlRef.current);
      localAvatarUrlRef.current = "";
    }
  };

  useEffect(() => {
    if (!open) return;

    clearLocalAvatarUrl();
    setForm(getCharacterForm(character));
    setErrors({});
    setAvatarFile(null);
    setAvatarMimeType("");
    setAvatarPreview(character?.avatarUrl || "");
    setRemoveAvatar(false);
    setAvatarError("");
  }, [character, open]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => nameInputRef.current?.focus(), 80);
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !saving) onClose();
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
      clearLocalAvatarUrl();
    };
  }, [onClose, open, saving]);

  if (!open) return null;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const chooseAvatar = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const mimeType = getImageMimeType(file);

    if (!mimeType) {
      setAvatarError("Use a JPG, PNG, or WEBP profile image.");
      return;
    }

    if (!file.size || file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Profile image must be 5 MB or smaller.");
      return;
    }

    clearLocalAvatarUrl();
    const previewUrl = URL.createObjectURL(file);
    localAvatarUrlRef.current = previewUrl;
    setAvatarFile(file);
    setAvatarMimeType(mimeType);
    setAvatarPreview(previewUrl);
    setRemoveAvatar(false);
    setAvatarError("");
  };

  const removeSelectedAvatar = () => {
    clearLocalAvatarUrl();
    setAvatarFile(null);
    setAvatarMimeType("");
    setAvatarPreview("");
    setRemoveAvatar(Boolean(character?.hasAvatar || character?.avatarUrl));
    setAvatarError("");
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
      form: {
        name: form.name.trim(),
        displayName: form.displayName.trim() || null,
        language: form.language,
        voiceRole: form.voiceRole,
        linkedStory: form.linkedStory.trim() || null,
        description: form.description.trim() || null,
        ...(editing ? {} : { permissionConfirmed: true })
      },
      avatar: {
        file: avatarFile,
        mimeType: avatarMimeType,
        remove: removeAvatar
      }
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
                ? "Update the profile, image and character details."
                : "Create the profile, then add voice samples."}
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
            <div className="voice-avatar-editor">
              <div className="voice-avatar-preview">
                {avatarPreview ? (
                  <img alt="Character profile preview" src={avatarPreview} />
                ) : (
                  <Icon name="user" size={29} />
                )}
              </div>

              <div className="voice-avatar-editor-copy">
                <strong>Character profile image</strong>
                <small>JPG, PNG or WEBP · Maximum 5 MB · Stored privately in Cloudflare R2</small>
                {avatarFile ? (
                  <div className="voice-avatar-file-name">{avatarFile.name}</div>
                ) : null}

                <div className="voice-avatar-actions">
                  <input
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    className="voice-avatar-input"
                    onChange={chooseAvatar}
                    ref={avatarInputRef}
                    type="file"
                  />
                  <button
                    className="voice-avatar-action"
                    disabled={saving}
                    onClick={() => avatarInputRef.current?.click()}
                    type="button"
                  >
                    {avatarPreview ? "Replace Image" : "Choose Image"}
                  </button>
                  {avatarPreview ? (
                    <button
                      className="voice-avatar-action danger"
                      disabled={saving}
                      onClick={removeSelectedAvatar}
                      type="button"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>

                {avatarError ? (
                  <div className="voice-avatar-error">{avatarError}</div>
                ) : null}
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
                  {LANGUAGES.map((item) => (
                    <option key={item}>{item}</option>
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
                  {VOICE_ROLES.map((item) => (
                    <option key={item}>{item}</option>
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

function VoiceSamplesModal({
  character,
  open,
  onClose,
  onSamplesChanged,
  onNotice
}) {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [queue, setQueue] = useState([]);
  const [playUrls, setPlayUrls] = useState({});
  const [loadingPlayerId, setLoadingPlayerId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const fileInputRef = useRef(null);

  const loadSamples = async () => {
    if (!character?.id) return;
    setLoading(true);
    setLoadError("");

    try {
      const data = await getVoiceSamples(character.id);
      setSamples(Array.isArray(data.samples) ? data.samples : []);
    } catch (error) {
      setLoadError(error.message || "Unable to load voice samples.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !character?.id) return;
    setSamples([]);
    setQueue([]);
    setPlayUrls({});
    loadSamples();
  }, [character?.id, open]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !uploading) onClose();
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, open, uploading]);

  if (!open || !character) return null;

  const updateQueue = (id, changes) => {
    setQueue((current) =>
      current.map((item) => (item.id === id ? { ...item, ...changes } : item))
    );
  };

  const handleFiles = async (event) => {
    const selectedFiles = Array.from(event.target.files || []).slice(
      0,
      MAX_FILES_PER_BATCH
    );
    event.target.value = "";

    if (!selectedFiles.length || uploading) return;

    const queueItems = selectedFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      fileName: file.name,
      progress: 0,
      status: "waiting",
      message: "Waiting"
    }));

    setQueue(queueItems);
    setUploading(true);
    let successCount = 0;

    for (let index = 0; index < selectedFiles.length; index += 1) {
      const file = selectedFiles[index];
      const item = queueItems[index];
      let preparedSampleId = "";

      try {
        const mimeType = getFileMimeType(file);

        if (!mimeType) {
          throw new Error("Use MP3, WAV, M4A, AAC, OGG, WEBM, or FLAC audio");
        }

        if (!file.size || file.size > MAX_FILE_BYTES) {
          throw new Error("Each audio file must be between 1 byte and 100 MB");
        }

        updateQueue(item.id, {
          status: "processing",
          message: "Reading audio metadata"
        });

        const durationSeconds = await getAudioDuration(file);
        const prepared = await requestVoiceSampleUpload(
          character.id,
          file,
          mimeType
        );
        preparedSampleId = prepared.sample?.id || "";

        updateQueue(item.id, {
          status: "uploading",
          message: "Uploading to Cloudflare R2"
        });

        await uploadVoiceFile(prepared.upload, file, (progress) => {
          updateQueue(item.id, { progress });
        });

        const completed = await completeVoiceSampleUpload(
          character.id,
          preparedSampleId,
          durationSeconds
        );

        setSamples((current) => [
          completed.sample,
          ...current.filter((sample) => sample.id !== completed.sample.id)
        ]);

        updateQueue(item.id, {
          progress: 100,
          status: "success",
          message: "Upload complete"
        });
        successCount += 1;
      } catch (error) {
        if (preparedSampleId) {
          deleteVoiceSample(character.id, preparedSampleId).catch(() => {});
        }

        updateQueue(item.id, {
          status: "error",
          message: error.message || "Upload failed"
        });
      }
    }

    setUploading(false);

    if (successCount) {
      await loadSamples();
      await onSamplesChanged?.();
      onNotice?.(
        `${successCount} voice sample${successCount === 1 ? "" : "s"} uploaded successfully.`
      );
    }

    if (successCount < selectedFiles.length) {
      onNotice?.(
        `${selectedFiles.length - successCount} audio file${
          selectedFiles.length - successCount === 1 ? "" : "s"
        } could not be uploaded.`,
        "error"
      );
    }
  };

  const loadPlayer = async (sample) => {
    setLoadingPlayerId(sample.id);

    try {
      const data = await getVoiceSamplePlayUrl(character.id, sample.id);
      setPlayUrls((current) => ({ ...current, [sample.id]: data.url }));
    } catch (error) {
      onNotice?.(error.message || "Unable to play this sample.", "error");
    } finally {
      setLoadingPlayerId("");
    }
  };

  const toggleTraining = async (sample, includeInTraining) => {
    setUpdatingId(sample.id);

    try {
      const data = await updateVoiceSample(character.id, sample.id, {
        includeInTraining
      });
      setSamples((current) =>
        current.map((item) => (item.id === sample.id ? data.sample : item))
      );
    } catch (error) {
      onNotice?.(error.message || "Unable to update this sample.", "error");
    } finally {
      setUpdatingId("");
    }
  };

  const removeSample = async (sample) => {
    const confirmed = window.confirm(`Delete “${sample.originalName}”?`);
    if (!confirmed) return;

    setDeletingId(sample.id);

    try {
      await deleteVoiceSample(character.id, sample.id);
      setSamples((current) => current.filter((item) => item.id !== sample.id));
      setPlayUrls((current) => {
        const next = { ...current };
        delete next[sample.id];
        return next;
      });
      await onSamplesChanged?.();
      onNotice?.(`${sample.originalName} was deleted successfully.`);
    } catch (error) {
      onNotice?.(error.message || "Unable to delete this sample.", "error");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div
      aria-labelledby="voice-samples-title"
      aria-modal="true"
      className="voice-samples-layer"
      role="dialog"
    >
      <button
        aria-label="Close voice samples"
        className="voice-samples-backdrop"
        disabled={uploading}
        onClick={onClose}
        type="button"
      />

      <section className="voice-samples-dialog">
        <header className="voice-samples-header">
          <div className="voice-samples-heading">
            <span>
              <Icon name="voice" size={22} />
            </span>
            <div>
              <h2 id="voice-samples-title">Manage Voice Samples</h2>
              <p>{character.name}</p>
            </div>
          </div>
          <button
            aria-label="Close"
            className="voice-samples-close"
            disabled={uploading}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>

        <div className="voice-samples-body">
          <div className="voice-samples-upload-box">
            <div className="voice-samples-upload-copy">
              <strong>Add voice samples</strong>
              <span>
                MP3, WAV, M4A, AAC, OGG, WEBM or FLAC · Maximum 100 MB each ·
                Up to {MAX_FILES_PER_BATCH} files per batch
              </span>
            </div>
            <input
              accept=".mp3,.wav,.m4a,.aac,.ogg,.webm,.flac,audio/*"
              className="voice-samples-file-input"
              multiple
              onChange={handleFiles}
              ref={fileInputRef}
              type="file"
            />
            <button
              className="voice-primary-button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <Icon name="plus" size={16} />
              {uploading ? "Uploading..." : "Choose Audio"}
            </button>
          </div>

          {queue.length ? (
            <div className="voice-samples-queue">
              {queue.map((item) => (
                <div
                  className={`voice-upload-row ${item.status}`}
                  key={item.id}
                >
                  <div>
                    <strong>{item.fileName}</strong>
                    <small>{item.message}</small>
                  </div>
                  <div className="voice-upload-progress">
                    <span style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="voice-samples-section-head">
            <h3>Saved samples</h3>
            <span>{samples.length} files</span>
          </div>

          {loading ? (
            <div className="voice-samples-state">
              <div>
                <span className="voice-samples-spinner" />
                <h3>Loading voice samples</h3>
              </div>
            </div>
          ) : loadError ? (
            <div className="voice-samples-state">
              <div>
                <Icon name="voice" size={28} />
                <h3>Unable to load samples</h3>
                <p>{loadError}</p>
                <button
                  className="voice-primary-button"
                  onClick={loadSamples}
                  type="button"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : !samples.length ? (
            <div className="voice-samples-state">
              <div>
                <Icon name="voice" size={30} />
                <h3>No voice samples yet</h3>
                <p>Select one or more audio files above. You can add more later.</p>
              </div>
            </div>
          ) : (
            <div className="voice-samples-list">
              {samples.map((sample) => (
                <article className="voice-sample-item" key={sample.id}>
                  <div className="voice-sample-main">
                    <div className="voice-sample-file">
                      <span>
                        <Icon name="voice" size={18} />
                      </span>
                      <div>
                        <strong>{sample.originalName}</strong>
                        <small>
                          {formatDuration(sample.durationSeconds)} ·{" "}
                          {formatFileSize(sample.fileSizeBytes)}
                        </small>
                      </div>
                    </div>
                    <div className="voice-sample-actions">
                      <button
                        className="voice-sample-button"
                        disabled={
                          sample.status !== "ready" ||
                          loadingPlayerId === sample.id
                        }
                        onClick={() => loadPlayer(sample)}
                        type="button"
                      >
                        {loadingPlayerId === sample.id
                          ? "Loading..."
                          : playUrls[sample.id]
                            ? "Refresh Player"
                            : "Listen"}
                      </button>
                      <button
                        className="voice-sample-button danger"
                        disabled={deletingId === sample.id}
                        onClick={() => removeSample(sample)}
                        type="button"
                      >
                        {deletingId === sample.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>

                  <div className="voice-sample-options">
                    <label className="voice-sample-training">
                      <input
                        checked={Boolean(sample.includeInTraining)}
                        disabled={updatingId === sample.id}
                        onChange={(event) =>
                          toggleTraining(sample, event.target.checked)
                        }
                        type="checkbox"
                      />
                      Use this sample for voice training
                    </label>
                    <span className="voice-sample-status">{sample.status}</span>
                  </div>

                  {playUrls[sample.id] ? (
                    <audio
                      className="voice-sample-player"
                      controls
                      preload="metadata"
                      src={playUrls[sample.id]}
                    />
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
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
  const [managingCharacter, setManagingCharacter] = useState(null);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");

  const showNotice = (message, type = "success") => {
    setNotice(message);
    setNoticeType(type);
  };

  const fetchCharacters = async ({ migrate = false } = {}) => {
    const data = await getVoiceCharacters();
    const serverCharacters = Array.isArray(data.characters)
      ? data.characters
      : [];

    if (!migrate) {
      setCharacters(serverCharacters);
      return serverCharacters;
    }

    const migrated = await migrateLegacyCharacters(serverCharacters);
    setCharacters(migrated.characters);

    if (migrated.migratedCount) {
      showNotice(
        `${migrated.migratedCount} browser character saved to the database.`
      );
    }

    return migrated.characters;
  };

  const loadCharacters = async () => {
    setLoading(true);
    setLoadError("");

    try {
      await fetchCharacters({ migrate: true });
    } catch (error) {
      setLoadError(error.message || "Unable to load voice characters.");
    } finally {
      setLoading(false);
    }
  };

  const refreshCharacters = async () => {
    try {
      const refreshed = await fetchCharacters();

      if (managingCharacter) {
        const updated = refreshed.find(
          (item) => item.id === managingCharacter.id
        );
        if (updated) setManagingCharacter(updated);
      }
    } catch (error) {
      showNotice(error.message || "Unable to refresh voice characters.", "error");
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

  const saveCharacter = async ({ form, avatar }) => {
    setSaving(true);
    setSubmitError("");
    let createdCharacter = null;

    try {
      const saved = editingCharacter
        ? await updateVoiceCharacter(editingCharacter.id, form)
        : await createVoiceCharacter({ ...form, avatarUrl: null });

      createdCharacter = editingCharacter ? null : saved.character;
      let finalCharacter = saved.character;

      if (avatar.file) {
        const prepared = await requestVoiceAvatarUpload(
          finalCharacter.id,
          avatar.file,
          avatar.mimeType
        );
        await uploadVoiceFile(prepared.upload, avatar.file);
        const completed = await completeVoiceAvatarUpload(
          finalCharacter.id,
          prepared.avatar
        );
        finalCharacter = completed.character;
      } else if (avatar.remove && finalCharacter.hasAvatar) {
        const removed = await deleteVoiceAvatar(finalCharacter.id);
        finalCharacter = removed.character;
      }

      setCharacters((current) => {
        if (editingCharacter) {
          return current.map((item) =>
            item.id === finalCharacter.id ? finalCharacter : item
          );
        }

        return [
          finalCharacter,
          ...current.filter((item) => item.id !== finalCharacter.id)
        ];
      });

      showNotice(
        `${finalCharacter.name} was ${
          editingCharacter ? "updated" : "created"
        } successfully.`
      );
      setModalOpen(false);
      setEditingCharacter(null);
    } catch (error) {
      if (createdCharacter?.id) {
        await deleteVoiceCharacter(createdCharacter.id).catch(() => {});
      }
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
              Create characters, store profile images and voice samples in
              Cloudflare R2, preview audio and update each profile anytime.
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
                onManage={() => setManagingCharacter(character)}
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

      <VoiceSamplesModal
        character={managingCharacter}
        onClose={() => setManagingCharacter(null)}
        onNotice={showNotice}
        onSamplesChanged={refreshCharacters}
        open={Boolean(managingCharacter)}
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
