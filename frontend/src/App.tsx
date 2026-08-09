import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { createDocument, ApiError, getDocument } from "./api/documents";
import { CodeView } from "./components/CodeView";
import { Editor } from "./components/Editor";
import { EmptyState } from "./components/EmptyState";
import { Toast } from "./components/Toast";
import { Toolbar } from "./components/Toolbar";
import { highlightSource } from "./highlighting/highlight";
import {
  extensionToFormatChoice,
  extensionToHighlightLanguage,
  extensionToPreviewFormat,
  formatChoiceToExtension,
  normalizeExtension,
} from "./routing/extensions";
import { documentPath, parseRoute, type Route } from "./routing/route";
import type { AppState, FormatChoice, ViewMode } from "./types/document";
import { Preview } from "./components/Preview";
import { usesSolarizedTheme } from "./preview/html";

function createNewState(extension?: string): AppState {
  const normalizedExtension = normalizeExtension(extension);
  return {
    content: "",
    locked: false,
    extension: normalizedExtension,
    language: extensionToHighlightLanguage(normalizedExtension),
    formatChoice: extensionToFormatChoice(normalizedExtension),
    previewFormat: extensionToPreviewFormat(normalizedExtension),
    view: "edit",
    loading: false,
    saving: false,
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    return "This paste does not exist or has expired.";
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Something went wrong. Try again.";
}

function isTextInput(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && ["INPUT", "SELECT", "BUTTON"].includes(target.tagName);
}

function currentLocation(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function viewForDocument(route: Extract<Route, { type: "document" }>, previewFormat: AppState["previewFormat"]): ViewMode {
  if (route.view === "code") {
    return "code";
  }
  return previewFormat !== null ? "preview" : "code";
}

export function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute(currentLocation()));
  const [state, setState] = useState<AppState>(() => createNewState());
  const [toast, setToast] = useState<string>();
  const [htmlThemeOverride, setHtmlThemeOverride] = useState<boolean | null>(null);
  const pendingNewState = useRef<AppState | null>(null);
  const pendingRouteState = useRef<AppState | null>(null);
  const loadRequest = useRef(0);

  useEffect(() => {
    const handleLocationChange = () => setRoute(parseRoute(currentLocation()));
    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("hashchange", handleLocationChange);
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("hashchange", handleLocationChange);
    };
  }, []);

  const routeIdentity = route.type === "document"
    ? `${route.type}:${route.key}:${route.extension ?? ""}`
    : route.type;

  useEffect(() => {
    setHtmlThemeOverride(null);
  }, [routeIdentity]);

  useEffect(() => {
    document.title = state.key ? `kiwibin · ${state.key}` : "kiwibin";
  }, [state.key]);

  useEffect(() => {
    if (route.type === "new") {
      const nextState = pendingNewState.current ?? createNewState();
      pendingNewState.current = null;
      setState(nextState);
      setToast(undefined);
      return;
    }

    if (route.type === "raw") {
      return;
    }

    if (route.type === "unsupported") {
      setState({ ...createNewState(), error: "That address is not a Kiwibin paste." });
      return;
    }

    const pendingState = pendingRouteState.current;
    if (pendingState?.key === route.key && pendingState.extension === route.extension) {
      pendingRouteState.current = null;
      setState(pendingState);
      return;
    }

    const requestId = ++loadRequest.current;
    const routeState = createNewState(route.extension);
    const loadingState: AppState = {
      ...routeState,
      key: route.key,
      locked: true,
      loading: true,
      view: viewForDocument(route, routeState.previewFormat),
    };
    setState(loadingState);
    setToast(undefined);

    void getDocument(route.key)
      .then((document) => {
        if (requestId !== loadRequest.current) {
          return;
        }
        const loadedState = createNewState(route.extension);
        setState({
          ...loadedState,
          content: document.data,
          key: document.key,
          locked: true,
          view: viewForDocument(route, loadedState.previewFormat),
        });
      })
      .catch((error: unknown) => {
        if (requestId !== loadRequest.current) {
          return;
        }
        setState({
          ...loadingState,
          loading: false,
          error: getErrorMessage(error),
        });
      });
  }, [route]);

  const navigate = (path: string) => {
    window.history.pushState(null, "", path);
    setRoute(parseRoute(path));
  };

  const startNewDocument = (preset?: AppState) => {
    pendingNewState.current = preset ?? null;
    navigate("/");
  };

  const handleDuplicate = () => {
    if (!state.locked) {
      return;
    }
    pendingNewState.current = {
      ...createNewState(state.extension),
      content: state.content,
      formatChoice: state.formatChoice,
      previewFormat: state.previewFormat,
      language: state.language,
      view: "edit",
    };
    navigate("/");
  };

  const handleFormatChange = (formatChoice: FormatChoice) => {
    if (state.locked) {
      return;
    }
    const extension = formatChoiceToExtension(formatChoice);
    setState((current) => ({
      ...current,
      formatChoice,
      extension,
      language: extensionToHighlightLanguage(extension),
      previewFormat: extensionToPreviewFormat(extension),
      view: "edit",
    }));
  };

  const handleSave = async () => {
    if (state.locked || state.saving || !state.content.trim()) {
      return;
    }

    const content = state.content;
    const extension = state.formatChoice === "auto"
      ? state.extension
      : formatChoiceToExtension(state.formatChoice);
    setState((current) => ({ ...current, saving: true }));
    setToast(undefined);

    try {
      const created = await createDocument(content);
      const path = documentPath(created.key, extension);
      const savedState: AppState = {
        ...state,
        key: created.key,
        locked: true,
        extension,
        language: extensionToHighlightLanguage(extension),
        formatChoice: extensionToFormatChoice(extension),
        previewFormat: extensionToPreviewFormat(extension),
        view: extensionToPreviewFormat(extension) !== null ? "preview" : "code",
        loading: false,
        saving: false,
        error: undefined,
      };
      pendingRouteState.current = savedState;
      navigate(path);
    } catch (error) {
      setState((current) => ({ ...current, saving: false }));
      setToast(getErrorMessage(error));
    }
  };

  const handleRaw = () => {
    if (state.key) {
      window.location.assign(`/raw/${encodeURIComponent(state.key)}`);
    }
  };

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || isTextInput(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "s") {
        event.preventDefault();
        void handleSave();
      } else if (key === "n") {
        event.preventDefault();
        startNewDocument();
      } else if (key === "d" && state.locked) {
        event.preventDefault();
        handleDuplicate();
      } else if (key === "r" && event.shiftKey && state.key) {
        event.preventDefault();
        handleRaw();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [state]);

  const highlighted = useMemo(
    () => highlightSource(state.content, state.extension),
    [state.content, state.extension],
  );
  const canSave = !state.locked && !state.loading && Boolean(state.content.trim());
  const showEditor = state.view === "edit" && !state.error;
  const showPreview = state.view === "preview" && !state.error && state.previewFormat !== null;
  const showCode = state.view === "code" && !state.error;
  const htmlThemeDefault = useMemo(
    () => usesSolarizedTheme(state.content),
    [state.content],
  );
  const htmlThemeEnabled = htmlThemeOverride ?? htmlThemeDefault;
  const renderedHtmlPath = state.locked && state.key && state.previewFormat === "html"
    ? `/html/${encodeURIComponent(state.key)}`
    : undefined;

  const handleViewChange = (view: ViewMode) => {
    if (view === "preview" && !state.previewFormat) {
      return;
    }

    if (state.locked && state.key) {
      const hash = view === "preview" ? "#preview" : "#code";
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
    }
    setState((current) => ({ ...current, view }));
  };

  return (
    <div className="app-shell">
      <Toolbar
        locked={state.locked}
        saving={state.saving}
        canSave={canSave}
        hasKey={Boolean(state.key)}
        view={state.view}
        previewFormat={state.previewFormat}
        formatChoice={state.formatChoice}
        htmlThemeEnabled={htmlThemeEnabled}
        renderedHtmlPath={renderedHtmlPath}
        onNew={() => startNewDocument()}
        onSave={() => void handleSave()}
        onDuplicate={handleDuplicate}
        onRaw={handleRaw}
        onViewChange={handleViewChange}
        onHtmlThemeChange={setHtmlThemeOverride}
        onFormatChange={handleFormatChange}
      />

      <main className={`workspace workspace-${state.view}`}>
        {state.loading && <div className="loading-line" role="status">Loading paste…</div>}
        {state.error && <EmptyState message={state.error} actionLabel="New paste" onAction={() => startNewDocument()} />}
        {showEditor && <Editor value={state.content} onChange={(content) => setState((current) => ({ ...current, content }))} />}
        {showCode && <CodeView content={state.content} highlighted={highlighted} />}
        {showPreview && (
          <Preview
            content={state.content}
            format={state.previewFormat}
            htmlThemeEnabled={htmlThemeEnabled}
          />
        )}
      </main>

      <Toast message={toast} onDismiss={() => setToast(undefined)} />
    </div>
  );
}
