// Local-first tour state.
//
// Tracks whether the user has seen the first-run walkthrough. Persists
// to localStorage so the tour doesn't re-trigger on every page load,
// but resets when the schema version changes (so we can ship a v2 tour
// to users who already saw v1).
//
// Pattern follows the existing Pasona localStorage keys
// (`pasona.reminder.*`, `pasona.apk.download.dismissed`).

const TOUR_ENABLED = false;

const STORAGE_KEY = "pasona.tour.v1";
const TOUR_VERSION = 1;

export type TourStatus = "pending" | "completed" | "skipped";

type StoredState = {
  status: TourStatus;
  step: number;
  version: number;
};

const DEFAULT_STATE: StoredState = {
  status: "pending",
  step: 0,
  version: TOUR_VERSION,
};

function readState(): StoredState {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return DEFAULT_STATE;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    if (parsed.version !== TOUR_VERSION) {
      return DEFAULT_STATE;
    }
    return {
      status: parsed.status ?? "pending",
      step: typeof parsed.step === "number" ? parsed.step : 0,
      version: TOUR_VERSION,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function writeState(state: StoredState): void {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be unavailable (private mode, quota). Best-effort.
  }
}

export function getTourState(): StoredState {
  return readState();
}

export function isTourActive(): boolean {
  if (!TOUR_ENABLED) return false;
  return readState().status === "pending";
}

export function setTourStep(step: number): void {
  const current = readState();
  if (current.status !== "pending") return;
  writeState({ ...current, step });
}

export function completeTour(): void {
  writeState({ status: "completed", step: 0, version: TOUR_VERSION });
}

export function skipTour(): void {
  writeState({ status: "skipped", step: 0, version: TOUR_VERSION });
}

export function resetTour(): void {
  writeState(DEFAULT_STATE);
}
