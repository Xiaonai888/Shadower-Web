import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "./Icon";

function useOutsideClose(open, onClose) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!ref.current?.contains(event.target)) {
        onClose();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  return ref;
}

function ModelSelector({
  available,
  disabled,
  loading,
  models,
  onSelect,
  selectedModel,
  status
}) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));
  const selected = useMemo(
    () => models.find((model) => model.id === selectedModel),
    [models, selectedModel]
  );

  const buttonLabel = loading
    ? "Loading models"
    : selected?.label || selectedModel || "Choose model";

  return (
    <div className="model-selector" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="model-trigger"
        disabled={disabled || loading}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="model-trigger-copy">
          <small>My AI</small>
          <strong>{buttonLabel}</strong>
        </span>
        <Icon name="chevronDown" size={13} />
      </button>

      {open && (
        <div className="model-menu" role="menu">
          <div className="selector-heading">My AI Model</div>

          <section className="provider-group">
            <div className="provider-heading">
              <span>
                <strong>My AI</strong>
                <small>{status}</small>
              </span>
              <span
                className={`provider-status ${
                  available ? "online" : "offline"
                }`}
              />
            </div>

            {models.length ? (
              <div className="provider-models">
                {models.map((model) => {
                  const active = model.id === selectedModel;

                  return (
                    <button
                      className={active ? "active" : ""}
                      disabled={!available}
                      key={model.id}
                      onClick={() => {
                        onSelect(model.id);
                        setOpen(false);
                      }}
                      role="menuitem"
                      type="button"
                    >
                      <span>
                        <strong>{model.label}</strong>
                        {model.detail && <small>{model.detail}</small>}
                      </span>
                      {active && <span className="selection-check">✓</span>}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="provider-empty">No My AI model is available.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function IntelligenceSelector({
  disabled,
  intelligence,
  levels,
  onSelect
}) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));
  const selected =
    levels.find((level) => level.id === intelligence) || levels[0];

  return (
    <div className="intelligence-selector" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="intelligence-trigger"
        disabled={disabled || !selected}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span>{selected?.label || "High"}</span>
        <Icon name="chevronDown" size={12} />
      </button>

      {open && (
        <div className="intelligence-menu" role="menu">
          <div className="selector-heading">Intelligence</div>
          {levels.map((level) => (
            <button
              className={level.id === intelligence ? "active" : ""}
              key={level.id}
              onClick={() => {
                onSelect(level.id);
                setOpen(false);
              }}
              role="menuitem"
              type="button"
            >
              <span>{level.label}</span>
              {level.id === intelligence && (
                <span className="selection-check">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { IntelligenceSelector, ModelSelector };
