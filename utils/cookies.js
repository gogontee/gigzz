import Cookies from "js-cookie";

export const CONSENT_COOKIE = "gigzz_cookie_consent";
export const CONSENT_VERSION = "1"; // bump this if your cookie policy changes
export const CONSENT_DAYS = 180;

const commonOptions = {
  expires: CONSENT_DAYS,
  path: "/",
  sameSite: "Lax",
  secure: process.env.NODE_ENV === "production",
};

export function getConsent() {
  return Cookies.get(CONSENT_COOKIE) || null;
}

export function setConsent(value) {
  // value: "all" | "necessary"
  Cookies.set(CONSENT_COOKIE, `${value}:v${CONSENT_VERSION}`, commonOptions);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("gigzz-consent-changed"));
  }
}

export function hasValidConsent() {
  const raw = getConsent();
  if (!raw) return false;
  return raw.endsWith(`:v${CONSENT_VERSION}`);
}
export function clearConsent() {
  Cookies.remove(CONSENT_COOKIE, { path: "/" });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("gigzz-consent-changed"));
  }
}

export function reopenBanner() {
  // Dispatch a custom event that CookieBanner listens to
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("gigzz-open-banner"));
  }
}