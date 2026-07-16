import React, { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "shadower_voice_characters_v1";

const LANGUAGES = [
  "English",
  "Khmer",
  "Chinese",
  "Korean",
  "Japanese",
  "Thai",
  "Vietnamese",
  "Other",
];

const VOICE_TYPES = [
  "Narrator",
  "Female character",
  "Male character",
  "Child character",
  "Custom",
];

function Icon({ name, className = "h-5 w-5" }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
    wave: <><path d="M3 10v4" /><path d="M7 7v10" /><path d="M11 4v16" /><path d="M15 7v10" /><path d="M19 10v4" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></>,
    x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    sparkles: <><path d="m12 3-1.2 3.8L7 8l3.8 1.2L12 13l1.2-3.8L17 8l-3.8-1.2L12 3Z" /><path d="m19 14-.7 2.3L16 17l2.3.7L19 20l.7-2.3L22 17l-2.3-.7L19 14Z" /><path d="m5 14-.7 2.3L2 17l2.3.7L5 20l.7-2.3L8 17l-2.3-.7L5 14Z" /></>,
    folder: <><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z" /></>,
    microphone: <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" /><path d="M12 17v4" /><path d="M8 21h8" /></>,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function readCharacters() {
  if (typeof window === "undefined") return [];

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "VC";
}

function EmptyState({ onCreate }) {
  return (
    <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_55px_rgba(76,29,149,0.07)]">
      <div className="relative flex min-h-[430px] flex-col items-center justify-center px-6 py-16 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(139,92,246,0.10),transparent_38%)]" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-100 to-purple-50 text-violet-600 ring-1 ring-violet-200/70">
          <Icon name="microphone" className="h-9 w-9" />
          <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-white ring-4 ring-white">
            <Icon name="plus" className="h-4 w-4" />
          </span>
        </div>
        <h2 className="relative mt-6 text-2xl font-bold tracking-tight text-slate-950">
          Create your first voice character
        </h2>
        <p className="relative mt-3 max-w-md text-sm leading-6 text-slate-500">
          Build a character profile first. Voice samples and voice cloning will be connected to this character in the next stage.
        </p>
        <button
          type="button"
          onClick={onCreate}
          className="relative mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-200"
        >
          <Icon name="plus" className="h-4 w-4" />
          Create Character
        </button>
      </div>
    </div>
  );
}

function CharacterCard({ character }) {
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_16px_38px_rgba(76,29,149,0.09)]">
      <div className="flex items-start gap-4">
        {character.avatar ? (
          <img
            src={character.avatar}
            alt=""
            className="h-14 w-14 shrink-0 rounded-2xl border border-slate-200 object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 text-base font-bold text-white shadow-md shadow-violet-500/20">
            {initials(character.name)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-slate-950">{character.name}</h3>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {character.displayName || character.voiceType}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              No samples
            </span>
          </div>
        </div>
      </div>

      <p className="mt-4 min-h-[40px] overflow-hidden text-sm leading-5 text-slate-500">
        {character.description || "No voice description has been added yet."}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Language</p>
          <p className="mt-1 truncate text-xs font-semibold text-slate-700">{character.language}</p>
        </div>
        <div className="border-l border-slate-200 pl-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Samples</p>
          <p className="mt-1 text-xs font-semibold text-slate-700">0 files · 0 min</p>
        </div>
      </div>

      <button
        type="button"
        disabled
        title="Voice samples will be added in Stage 2"
        className="mt-4 flex h-10 w-full cursor-not-allowed items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-400"
      >
        <span className="flex items-center gap-2">
          <Icon name="wave" className="h-4 w-4" />
          Manage Voice
        </span>
        <Icon name="chevron" className="h-4 w-4" />
      </button>
    </article>
  );
}

function FieldLabel({ children, required }) {
  return (
    <label className="mb-2 block text-sm font-semibold text-slate-700">
      {children} {required && <span className="text-rose-500">*</span>}
    </label>
  );
}

function CreateCharacterModal({ open, onClose, onCreate }) {
  const fileInputRef = useRef(null);
  const nameInputRef = useRef(null);
  const [form, setForm] = useState({
    name: "",
    displayName: "",
    language: "English",
    voiceType: "Narrator",
    linkedStory: "",
    description: "",
    avatar: "",
    consent: false,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => nameInputRef.current?.focus(), 80);
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setForm({
        name: "",
        displayName: "",
        language: "English",
        voiceType: "Narrator",
        linkedStory: "",
        description: "",
        avatar: "",
        consent: false,
      });
      setErrors({});
    }
  }, [open]);

  if (!open) return null;

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  };

  const handleAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((current) => ({ ...current, avatar: "Please choose an image file." }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrors((current) => ({ ...current, avatar: "Avatar must be smaller than 2 MB." }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => update("avatar", String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const submit = (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!form.name.trim()) nextErrors.name = "Character name is required.";
    if (!form.consent) nextErrors.consent = "You must confirm voice ownership or permission.";

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    onCreate({
      ...form,
      name: form.name.trim(),
      displayName: form.displayName.trim(),
      linkedStory: form.linkedStory.trim(),
      description: form.description.trim(),
    });
  };

  const inputClass = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="create-character-title">
      <button
        type="button"
        aria-label="Close create character dialog"
        className="absolute inset-0 cursor-default bg-slate-950/35 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/80 bg-white shadow-2xl shadow-slate-950/20">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-7">
          <div>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <Icon name="microphone" className="h-5 w-5" />
            </div>
            <h2 id="create-character-title" className="text-xl font-bold tracking-tight text-slate-950">
              Create Voice Character
            </h2>
            <p className="mt-1 text-sm text-slate-500">Create the profile now. Voice samples will be added next.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-100"
            aria-label="Close"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="overflow-y-auto">
          <div className="space-y-5 px-5 py-6 sm:px-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50 text-violet-500 transition hover:border-violet-400 hover:bg-violet-100"
              >
                {form.avatar ? (
                  <img src={form.avatar} alt="Character avatar preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex flex-col items-center gap-1.5 text-[11px] font-semibold">
                    <Icon name="image" className="h-6 w-6" />
                    Add avatar
                  </span>
                )}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
              <div>
                <p className="text-sm font-semibold text-slate-700">Character avatar</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">PNG, JPG or WEBP. Maximum 2 MB.</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs font-semibold text-violet-600 hover:text-violet-700">
                    Upload image
                  </button>
                  {form.avatar && (
                    <button type="button" onClick={() => update("avatar", "")} className="text-xs font-semibold text-rose-500 hover:text-rose-600">
                      Remove
                    </button>
                  )}
                </div>
                {errors.avatar && <p className="mt-1 text-xs font-medium text-rose-500">{errors.avatar}</p>}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <FieldLabel required>Character name</FieldLabel>
                <input
                  ref={nameInputRef}
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  placeholder="e.g. Gu Wanyin"
                  className={`${inputClass} ${errors.name ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100" : ""}`}
                />
                {errors.name && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.name}</p>}
              </div>

              <div>
                <FieldLabel>Display name</FieldLabel>
                <input
                  value={form.displayName}
                  onChange={(event) => update("displayName", event.target.value)}
                  placeholder="Optional public name"
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel required>Default language</FieldLabel>
                <select value={form.language} onChange={(event) => update("language", event.target.value)} className={inputClass}>
                  {LANGUAGES.map((language) => <option key={language}>{language}</option>)}
                </select>
              </div>

              <div>
                <FieldLabel>Voice role</FieldLabel>
                <select value={form.voiceType} onChange={(event) => update("voiceType", event.target.value)} className={inputClass}>
                  {VOICE_TYPES.map((type) => <option key={type}>{type}</option>)}
                </select>
              </div>
            </div>

            <div>
              <FieldLabel>Linked story</FieldLabel>
              <div className="relative">
                <Icon name="folder" className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  value={form.linkedStory}
                  onChange={(event) => update("linkedStory", event.target.value)}
                  placeholder="Optional story or project name"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <div>
              <FieldLabel>Voice description</FieldLabel>
              <textarea
                value={form.description}
                onChange={(event) => update("description", event.target.value.slice(0, 240))}
                placeholder="e.g. Soft, calm, warm and emotionally gentle narrator..."
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              />
              <p className="mt-1 text-right text-[11px] text-slate-400">{form.description.length}/240</p>
            </div>

            <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${errors.consent ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-slate-50 hover:border-violet-200"}`}>
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(event) => update("consent", event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-violet-600"
              />
              <span>
                <span className="block text-sm font-semibold text-slate-700">Voice ownership and permission</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  I confirm that I own this voice or have clear permission from its owner to create and use a clone.
                </span>
                {errors.consent && <span className="mt-1 block text-xs font-medium text-rose-500">{errors.consent}</span>}
              </span>
            </label>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-200"
            >
              <Icon name="plus" className="h-4 w-4" />
              Create Character
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VoiceStudioPage() {
  const [characters, setCharacters] = useState(readCharacters);
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("All languages");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
  }, [characters]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredCharacters = useMemo(() => {
    const query = search.trim().toLowerCase();
    return characters.filter((character) => {
      const matchesLanguage = language === "All languages" || character.language === language;
      const matchesSearch = !query || [character.name, character.displayName, character.description, character.linkedStory]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
      return matchesLanguage && matchesSearch;
    });
  }, [characters, language, search]);

  const handleCreate = (form) => {
    const character = {
      id: `voice-character-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...form,
      sampleCount: 0,
      sampleDuration: 0,
      status: "no-samples",
      createdAt: new Date().toISOString(),
    };

    setCharacters((current) => [character, ...current]);
    setIsCreateOpen(false);
    setToast(`${character.name} was created successfully.`);
  };

  return (
    <div className="min-h-full bg-[#f8f7fc] px-4 py-6 text-slate-900 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-violet-700">
              <Icon name="sparkles" className="h-3.5 w-3.5" />
              Voice Studio
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Voice Characters</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Create and organize the characters that will hold your voice samples, cloned voices and generated audio.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-200"
          >
            <Icon name="plus" className="h-4 w-4" />
            Create Character
          </button>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Characters</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">{characters.length}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><Icon name="users" /></span>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Voice samples</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">0</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-50 text-fuchsia-600"><Icon name="wave" /></span>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Generated audio</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">0 min</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600"><Icon name="clock" /></span>
            </div>
          </div>
        </div>

        {characters.length > 0 && (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Icon name="search" className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search characters..."
                className="h-10 w-full rounded-xl border border-transparent bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </div>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100 sm:w-44"
            >
              <option>All languages</option>
              {LANGUAGES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
        )}

        {characters.length === 0 ? (
          <EmptyState onCreate={() => setIsCreateOpen(true)} />
        ) : filteredCharacters.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Icon name="search" /></div>
            <h2 className="mt-4 text-base font-bold text-slate-900">No characters found</h2>
            <p className="mt-1 text-sm text-slate-500">Try another name or language filter.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredCharacters.map((character) => <CharacterCard key={character.id} character={character} />)}
          </div>
        )}
      </div>

      <CreateCharacterModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
      />

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-[120] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-2xl">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500"><Icon name="check" className="h-3.5 w-3.5" /></span>
          {toast}
        </div>
      )}
    </div>
  );
}
