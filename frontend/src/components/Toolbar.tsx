import type { FormatChoice, PreviewFormat, ViewMode } from "../types/document";
import { Icon } from "./Icon";

interface ToolbarProps {
  locked: boolean;
  saving: boolean;
  canSave: boolean;
  hasKey: boolean;
  view: ViewMode;
  previewFormat: PreviewFormat;
  formatChoice: FormatChoice;
  onNew: () => void;
  onSave: () => void;
  onDuplicate: () => void;
  onRaw: () => void;
  onViewChange: (view: ViewMode) => void;
  onFormatChange: (choice: FormatChoice) => void;
}

export function Toolbar({
  locked,
  saving,
  canSave,
  hasKey,
  view,
  previewFormat,
  formatChoice,
  onNew,
  onSave,
  onDuplicate,
  onRaw,
  onViewChange,
  onFormatChange,
}: ToolbarProps) {
  const showPreviewToggle = previewFormat !== null;
  const showEditPreviewToggle = !locked && showPreviewToggle;

  return (
    <header className="toolbar">
      <a className="brand" href="/" onClick={(event) => { event.preventDefault(); onNew(); }}>
        <span className="brand-mark" aria-hidden="true"><Icon name="leaf" size={20} /></span>
        <span className="brand-name">kiwibin</span>
        <span className="brand-tag">paste / share</span>
      </a>

      <div className="toolbar-actions" aria-label="Paste actions">
        {!locked ? (
          <label className="format-control">
            <span>Format</span>
            <select aria-label="Paste format" value={formatChoice} onChange={(event) => onFormatChange(event.currentTarget.value as FormatChoice)}>
              <option value="auto">Auto</option>
              <option value="text">Plain text</option>
              <option value="markdown">Markdown</option>
              <option value="html">HTML</option>
            </select>
          </label>
        ) : (
          <span className="format-badge">{formatChoice === "auto" ? "Auto" : formatChoice}</span>
        )}

        {showPreviewToggle && (
          <div className="segmented-control" role="group" aria-label="View mode">
            <button
              type="button"
              aria-label={showEditPreviewToggle ? "Edit paste" : "View source"}
              className={view === (showEditPreviewToggle ? "edit" : "code") ? "selected" : ""}
              onClick={() => onViewChange(showEditPreviewToggle ? "edit" : "code")}
              aria-pressed={view === (showEditPreviewToggle ? "edit" : "code")}
            >
              <Icon name="code" />
              <span>{showEditPreviewToggle ? "Edit" : "Source"}</span>
            </button>
            <button
              type="button"
              aria-label="Preview paste"
              className={view === "preview" ? "selected" : ""}
              onClick={() => onViewChange("preview")}
              aria-pressed={view === "preview"}
            >
              <Icon name="eye" /> <span>Preview</span>
            </button>
          </div>
        )}

        <button className="toolbar-button" type="button" aria-label="Raw text" onClick={onRaw} disabled={!hasKey} title="Raw text · Ctrl/Cmd+Shift+R">
          <Icon name="raw" /> <span>Raw</span>
        </button>
        <button className="toolbar-button" type="button" aria-label="Duplicate and edit" onClick={onDuplicate} disabled={!locked} title="Duplicate and edit · Ctrl/Cmd+D">
          <Icon name="copy" /> <span>Duplicate</span>
        </button>
        <button className="toolbar-button" type="button" aria-label="New paste" onClick={onNew} title="New paste · Ctrl/Cmd+N">
          <Icon name="plus" /> <span>New</span>
        </button>
        <button className="toolbar-button primary" type="button" aria-label={saving ? "Saving paste" : "Save paste"} onClick={onSave} disabled={!canSave || saving} title="Save paste · Ctrl/Cmd+S">
          <Icon name="save" /> <span>{saving ? "Saving…" : "Save"}</span>
        </button>
      </div>
    </header>
  );
}
