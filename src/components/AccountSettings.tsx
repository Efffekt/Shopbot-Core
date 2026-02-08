"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

interface AccountSettingsProps {
  userEmail: string;
}

export default function AccountSettings({ userEmail }: AccountSettingsProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("Passordene stemmer ikke overens");
      return;
    }

    if (newPassword.length < 8) {
      setError("Passordet må være minst 8 tegn");
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();

      // First verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("Nåværende passord er feil");
      }

      // Update to new password
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
    <div className="space-y-6 max-w-md">
      {/* Email Display */}
      <div>
        <label className="block text-sm font-medium text-preik-text-muted mb-2">
          E-postadresse
        </label>
        <div className="bg-preik-bg border border-preik-border rounded-xl px-4 py-3 text-preik-text">
          {userEmail}
        </div>
        <p className="text-xs text-preik-text-muted mt-2">
          Kontakt support for å endre e-postadresse
        </p>
      </div>

      {/* Password Change Form */}
      <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
        <h3 className="text-base font-medium text-preik-text">Endre passord</h3>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-600 px-4 py-3 rounded-xl text-sm">
            Passordet er oppdatert!
          </div>
        )}

        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-preik-text-muted mb-2">
            Nåværende passord
          </label>
          <input
            type="password"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full bg-preik-bg border border-preik-border rounded-xl px-4 py-3 text-preik-text focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent transition-all"
            required
          />
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-preik-text-muted mb-2">
            Nytt passord
          </label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-preik-bg border border-preik-border rounded-xl px-4 py-3 text-preik-text focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent transition-all"
            required
            minLength={8}
          />
          <p className="text-xs text-preik-text-muted mt-1">Minst 8 tegn</p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-preik-text-muted mb-2">
            Bekreft nytt passord
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-preik-bg border border-preik-border rounded-xl px-4 py-3 text-preik-text focus:outline-none focus:ring-2 focus:ring-preik-accent focus:border-transparent transition-all"
            required
          />
        </div>

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
    </div>
  );
}
