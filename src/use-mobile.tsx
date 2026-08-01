import { useEffect, useState } from "react";

const CONSENT_KEY = "beistand.cookies.v1";

export type ConsentValue = "all" | "essential" | null;

export function getStoredConsent(): ConsentValue {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "all" || v === "essential" ? v : null;
  } catch {
    return null;
  }
}

export function setStoredConsent(v: Exclude<ConsentValue, null>) {
  try {
    localStorage.setItem(CONSENT_KEY, v);
  } catch {
    // ignore
  }
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentValue>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setConsent(getStoredConsent());
    setReady(true);
  }, []);

  const accept = (v: Exclude<ConsentValue, null>) => {
    setStoredConsent(v);
    setConsent(v);
  };

  return { consent, ready, accept };
}
