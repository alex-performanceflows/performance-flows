"use client";

import { useEffect, useState } from "react";
import { PasswordGate } from "./_components/PasswordGate";
import { Dashboard } from "./_components/Dashboard";

const AUTH_KEY = "pf.coorie.auth";
const AUTH_VALUE = "ok";

export default function CooriePage() {
  const [hydrated, setHydrated] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    try { setAuthorized(sessionStorage.getItem(AUTH_KEY) === AUTH_VALUE); }
    catch { setAuthorized(false); }
    setHydrated(true);
  }, []);

  function handleAuthorized() {
    try { sessionStorage.setItem(AUTH_KEY, AUTH_VALUE); } catch {}
    setAuthorized(true);
  }

  if (!hydrated) return <div style={{ minHeight: "100dvh", background: "#0a0f0c" }} />;
  if (!authorized) return <PasswordGate onAuthorized={handleAuthorized} />;
  return <Dashboard />;
}
