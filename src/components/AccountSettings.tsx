"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

interface AccountSettingsProps {
  userEmail: string;
  showBlogSettings?: boolean;
}

export default function AccountSettings({ userEmail, showBlogSettings = false }: AccountSettingsProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Blog settings state
  const [blogAuthorName, setBlogAuthorName] = useState("");
  const [blogAuthorBio, setBlogAuthorBio] = useState("");
  const [blogSettingsLoading, setBlogSettingsLoading] = useState(false);
  const [blogSettingsError, setBlogSettingsError] = useState<string | null>(null);
  const [blogSettingsSuccess, setBlogSettingsSuccess] = useState(false);

  useEffect(() => {
    if (!showBlogSettings) return;
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (!res.ok) return;
        const data = await res.json();
        setBlogAuthorName(data.settings?.blog_default_author_name || "");
        setBlogAuthorBio(data.settings?.blog_author_bio || "");
      } catch {
        // Silently fail on load
      }
    }
    loadSettings();
  }, [showBlogSettings]);

  async function handleBlogSettingsSave(e: React.FormEvent) {
    e.preventDefault();
    setBlogSettingsError(null);
    setBlogSettingsSuccess(false);
    setBlogSettingsLoading(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            blog_default_author_name: blogAuthorName,
            blog_author_bio: blogAuthorBio,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Kunne ikke lagre innstillinger");
      }

      setBlogSettingsSuccess(true);
      setTimeout(() => setBlogSettingsSuccess(false), 3000);
    } catch (err) {
      setBlogSettingsError(err instanceof Error ? err.message : "Noe gikk galt");
    } finally {
      setBlogSettingsLoading(false);
    }
  }

  // Password strength checks
  const hasLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("Passordene stemmer ikke overens");
      return;
    }

    if (!hasLength || !hasUpper || !hasLower || !hasNumber) {
      setError("Passordet oppfyller ikke kravene");
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("Nåværende passord er feil");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Email Display */}
      <div>
        <label className="block text-sm font-medium text-preik-text-muted mb-2">
          E-postadresse
        </label>
        <div className="flex items-center gap-3 bg-preik-bg border border-preik-border rounded-xl px-4 py-3">
          <svg className="w-4 h-4 text-preik-text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-preik-text text-sm">{userEmail}</span>
        </div>
      </div>

      {/* Password Change Form */}
      <form onSubmit={handlePasswordChange} className="space-y-4 pt-5 border-t border-preik-border">
        <h3 className="text-sm font-semibold text-preik-text uppercase tracking-wide">Endre passord</h3>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-3 rounded-xl text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-600 px-4 py-3 rounded-xl text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Passordet er oppdatert!
          </div>
        )}

        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-preik-text-muted mb-2">
            Nåværende passord
          </label>
          <div className="relative">
            <input
              type={showCurrentPw ? "text" : "password"}
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-preik-bg border border-preik-border rounded-xl px-4 py-3 pr-11 text-sm text-preik-text focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent transition-all"
              required
            />
            <PasswordToggle show={showCurrentPw} onToggle={() => setShowCurrentPw(!showCurrentPw)} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-preik-text-muted mb-2">
              Nytt passord
            </label>
            <div className="relative">
              <input
                type={showNewPw ? "text" : "password"}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-preik-bg border border-preik-border rounded-xl px-4 py-3 pr-11 text-sm text-preik-text focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent transition-all"
                required
                minLength={8}
              />
              <PasswordToggle show={showNewPw} onToggle={() => setShowNewPw(!showNewPw)} />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-preik-text-muted mb-2">
              Bekreft nytt passord
            </label>
            <div className="relative">
              <input
                type={showConfirmPw ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-preik-bg border border-preik-border rounded-xl px-4 py-3 pr-11 text-sm text-preik-text focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent transition-all"
                required
              />
              <PasswordToggle show={showConfirmPw} onToggle={() => setShowConfirmPw(!showConfirmPw)} />
            </div>
          </div>
        </div>

        {/* Password requirements */}
        {newPassword.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <RequirementCheck met={hasLength} label="Minst 8 tegn" />
            <RequirementCheck met={hasUpper} label="Stor bokstav (A-Z)" />
            <RequirementCheck met={hasLower} label="Liten bokstav (a-z)" />
            <RequirementCheck met={hasNumber} label="Tall (0-9)" />
            {confirmPassword.length > 0 && (
              <RequirementCheck met={passwordsMatch} label="Passordene matcher" />
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-xl text-white bg-preik-accent hover:bg-preik-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-preik-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Oppdaterer...
            </>
          ) : (
            "Oppdater passord"
          )}
        </button>
      </form>

      {/* Blog Settings — admin only */}
      {showBlogSettings && (
        <form onSubmit={handleBlogSettingsSave} className="space-y-4 pt-5 border-t border-preik-border">
          <h3 className="text-sm font-semibold text-preik-text uppercase tracking-wide">Blogg-innstillinger</h3>

          {blogSettingsError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-3 rounded-xl text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {blogSettingsError}
            </div>
          )}

          {blogSettingsSuccess && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-600 px-4 py-3 rounded-xl text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Blogg-innstillingene er lagret!
            </div>
          )}

          <div>
            <label htmlFor="blogAuthorName" className="block text-sm font-medium text-preik-text-muted mb-2">
              Standard forfatternavn
            </label>
            <input
              type="text"
              id="blogAuthorName"
              value={blogAuthorName}
              onChange={(e) => setBlogAuthorName(e.target.value)}
              disabled={blogSettingsLoading}
              className="w-full bg-preik-bg border border-preik-border rounded-xl px-4 py-3 text-sm text-preik-text focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent transition-all disabled:opacity-50"
              placeholder="Forhåndsutfylt navn ved nye innlegg"
            />
          </div>

          <div>
            <label htmlFor="blogAuthorBio" className="block text-sm font-medium text-preik-text-muted mb-2">
              Forfatter-bio
            </label>
            <textarea
              id="blogAuthorBio"
              value={blogAuthorBio}
              onChange={(e) => setBlogAuthorBio(e.target.value)}
              rows={3}
              disabled={blogSettingsLoading}
              className="w-full bg-preik-bg border border-preik-border rounded-xl px-4 py-3 text-sm text-preik-text focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent transition-all resize-none disabled:opacity-50"
              placeholder="Kort biografi som vises på blogginnlegg"
            />
          </div>

          <button
            type="submit"
            disabled={blogSettingsLoading}
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-xl text-white bg-preik-accent hover:bg-preik-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-preik-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {blogSettingsLoading ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Lagrer...
              </>
            ) : (
              "Lagre blogg-innstillinger"
            )}
          </button>
        </form>
      )}
    </div>
  );
}

function PasswordToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-preik-text-muted hover:text-preik-text transition-colors"
      aria-label={show ? "Skjul passord" : "Vis passord"}
    >
      {show ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )}
    </button>
  );
}

function RequirementCheck({ met, label }: { met: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${met ? "text-green-600" : "text-preik-text-muted"}`}>
      {met ? (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      )}
      <span>{label}</span>
    </div>
  );
}
