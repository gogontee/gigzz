"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { getConsent, CONSENT_VERSION } from "../utils/cookies";

export default function AnalyticsGate() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = () =>
      setAllowed(getConsent() === `all:v${CONSENT_VERSION}`);

    check();
    window.addEventListener("gigzz-consent-changed", check);
    return () =>
      window.removeEventListener("gigzz-consent-changed", check);
  }, []);

  if (!allowed) return null;
  return <Analytics />;
}