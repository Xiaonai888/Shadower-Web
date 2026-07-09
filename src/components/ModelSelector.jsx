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
  disabled,
  loading,
  onSelect,
  providers,
  selectedModel,
  selectedProvider
}) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));

  const selected = useMemo(() => {
    const provider = providers.find((item) => item.id === selectedProvider);
    const model = provider?.models?.find((item) => item.id === selectedModel);

    return {
      provider,
      model
    };
  }, [providers, selectedModel, selectedProvider]);

  const buttonLabel = loading
    ? "Loading models"
    : selected.model?.label || selectedModel || "Choose model";

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
          <small>{selected.provider?.label || "AI"}</small>
          <strong>{buttonLabel}</strong>
        </span>
        <Icon name="chevronDown" size={13} />
      </button>

      {open && (
        <div className="model-menu" role="menu">
          <div className="selector-heading">AI Provider & Model</div>

          {providers.map((provider) => (
            <section className="provider-group" key={provider.id}>
              <div className="provider-heading">
                <span>
                  <strong>{provider.label}</strong>
                  <small>{provider.status}</small>
                </span>
                <span
                  className={`provider-status ${
                    provider.available ? "online" : "offline"
                  }`}
                />
              </div>

              {provider.models?.length ? (
                <div className="provider-models">
                  {provider.models.map((model) => {
                    const active =
                      provider.id === selectedProvider &&
                      model.id === selectedModel;

                    return (
                      <button
                        className={active ? "active" : ""}
                        disabled={!provider.available}
                        key={`${provider.id}-${model.id}`}
                        onClick={() => {
                          onSelect(provider.id, model.id);
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
                <p className="provider-empty">No model is available.</p>
              )}
            </section>
          ))}
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
