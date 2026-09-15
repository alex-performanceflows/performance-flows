export const CONSENT_KEY = "pf_cookie_consent";
export const CONSENT_EVENT = "pf-consent-change";
/** Dopo 12 mesi la scelta scade e il banner viene riproposto. */
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

export type ConsentChoice = "granted" | "denied";

type StoredConsent = { choice: ConsentChoice; at: number };

export function readConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (parsed.choice !== "granted" && parsed.choice !== "denied") return null;
    if (!parsed.at || Date.now() - parsed.at > MAX_AGE_MS) return null;
    return parsed.choice;
  } catch {
    return null;
  }
}

export function writeConsent(choice: ConsentChoice) {
  try {
    const payload: StoredConsent = { choice, at: Date.now() };
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
  } catch {
    // localStorage non disponibile (private mode): la scelta vale per la sessione
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice }));
}

export function clearConsent() {
  try {
    window.localStorage.removeItem(CONSENT_KEY);
  } catch {
    // niente da fare
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: null }));
}
