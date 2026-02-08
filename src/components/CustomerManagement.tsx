"use client";

import { useState, useEffect } from "react";
import AdminPromptEditor from "@/components/AdminPromptEditor";

interface Tenant {
  id: string;
  name: string;
  allowed_domains: string[];
  language: string;
  persona: string;
  created_at: string;
  credit_limit: number;
  credits_used: number;
  billing_cycle_start: string;
  features: Record<string, boolean>;
}

interface TenantUser {
  id: string;
  email: string;
  role: string;
}

interface CustomerManagementProps {
  onSelectTenant: (id: string, name: string) => void;
  onNavigateToContent: () => void;
}

export default function CustomerManagement({ onSelectTenant, onNavigateToContent }: CustomerManagementProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateTenant, setShowCreateTenant] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [justCreatedTenantId, setJustCreatedTenantId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedTenant, setEditedTenant] = useState<Partial<Tenant>>({});

  // Form states
  const [newTenant, setNewTenant] = useState({
    id: "",
    name: "",
    allowed_domains: "",
    persona: "",
  });
  const [newUser, setNewUser] = useState({
    email: "",
    role: "admin",
  });
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });

  // Fetch tenants
  useEffect(() => {
    fetchTenants();
  }, []);

  async function fetchTenants() {
    try {
      const res = await fetch("/api/admin/tenants");
      const data = await res.json();
      setTenants(data.tenants || []);
    } catch (error) {
      console.error("Failed to fetch tenants:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchTenantDetails(tenantId: string) {
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`);
      const data = await res.json();
      setSelectedTenant(data.tenant);
      setTenantUsers(data.users || []);
      onSelectTenant(data.tenant.id, data.tenant.name);
    } catch (error) {
      console.error("Failed to fetch tenant details:", error);
    }
  }

  async function handleCreateTenant(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ type: null, message: "" });

    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newTenant.id,
          name: newTenant.name,
          allowed_domains: newTenant.allowed_domains
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean),
          persona: newTenant.persona,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create tenant");
      }

      setStatus({ type: "success", message: "Kunde opprettet!" });
      setJustCreatedTenantId(newTenant.id);
      setNewTenant({ id: "", name: "", allowed_domains: "", persona: "" });
      setShowCreateTenant(false);
      fetchTenants();
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "En feil oppstod",
      });
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTenant) return;
    setStatus({ type: null, message: "" });

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUser.email,
          tenantId: selectedTenant.id,
          role: newUser.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      setStatus({ type: "success", message: `Invitasjon sendt til ${newUser.email}!` });
      setNewUser({ email: "", role: "admin" });
      setShowCreateUser(false);
      fetchTenantDetails(selectedTenant.id);
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "En feil oppstod",
      });
    }
  }

  async function handleDeleteTenant(tenantId: string) {
    if (!confirm(`Er du sikker på at du vil slette ${tenantId}? Dette kan ikke angres.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete tenant");
      }

      setSelectedTenant(null);
      setTenantUsers([]);
      fetchTenants();
      setStatus({ type: "success", message: "Kunde slettet" });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Kunne ikke slette",
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-preik-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status message */}
      {status.type && (
        <div
          className={`p-4 rounded-xl ${
            status.type === "success"
              ? "bg-green-500/10 text-green-600 border border-green-500/20"
              : "bg-red-500/10 text-red-600 border border-red-500/20"
          }`}
        >
          {status.message}
        </div>
      )}

      {/* Next step workflow card after creating tenant */}
      {justCreatedTenantId && (
        <div className="bg-preik-accent/10 border border-preik-accent/20 rounded-2xl p-6">
          <h3 className="text-lg font-medium text-preik-text mb-2">Neste steg</h3>
          <p className="text-preik-text-muted text-sm mb-4">
            Kunden <span className="font-medium text-preik-text">{justCreatedTenantId}</span> er opprettet. Legg til innhold slik at chatboten har noe å svare med.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                onSelectTenant(justCreatedTenantId, justCreatedTenantId);
                onNavigateToContent();
              }}
              className="px-5 py-2.5 bg-preik-accent text-white rounded-xl hover:bg-preik-accent-hover transition-colors text-sm font-medium"
            >
              Legg til innhold
            </button>
            <button
              onClick={() => setJustCreatedTenantId(null)}
              className="px-5 py-2.5 border border-preik-border text-preik-text-muted rounded-xl hover:bg-preik-bg transition-colors text-sm"
            >
              Senere
            </button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Tenant List */}
        <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-preik-text">Kunder</h2>
            <button
              onClick={() => setShowCreateTenant(true)}
              className="px-3 py-1.5 bg-preik-accent text-white text-sm font-medium rounded-xl hover:bg-preik-accent-hover transition-colors"
            >
              + Ny kunde
            </button>
          </div>

          {tenants.length === 0 ? (
            <p className="text-preik-text-muted text-sm">Ingen kunder ennå</p>
          ) : (
            <ul className="divide-y divide-preik-border">
              {tenants.map((tenant) => (
                <li
                  key={tenant.id}
                  onClick={() => fetchTenantDetails(tenant.id)}
                  className={`py-3 px-2 cursor-pointer rounded-xl transition-colors ${
                    selectedTenant?.id === tenant.id
                      ? "bg-preik-accent/10"
                      : "hover:bg-preik-bg"
                  }`}
                >
                  <p className="font-medium text-preik-text">{tenant.name}</p>
                  <p className="text-sm text-preik-text-muted">{tenant.id}</p>
                  {tenant.credit_limit > 0 && (
                    <div className="mt-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-preik-bg rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              (tenant.credits_used / tenant.credit_limit) * 100 > 80
                                ? "bg-red-500"
                                : (tenant.credits_used / tenant.credit_limit) * 100 > 60
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min((tenant.credits_used / tenant.credit_limit) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-preik-text-muted">
                          {tenant.credits_used}/{tenant.credit_limit}
                        </span>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Tenant Details */}
        <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
          {selectedTenant ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-preik-text">{selectedTenant.name}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (editMode) {
                        setEditMode(false);
                        setEditedTenant({});
                      } else {
                        setEditMode(true);
                        setEditedTenant({
                          name: selectedTenant.name,
                          allowed_domains: selectedTenant.allowed_domains,
                          language: selectedTenant.language,
                          persona: selectedTenant.persona,
                        });
                      }
                    }}
                    className="px-3 py-1.5 bg-preik-accent/10 text-preik-accent text-sm font-medium rounded-xl hover:bg-preik-accent/20 transition-colors"
                  >
                    {editMode ? "Avbryt redigering" : "Rediger"}
                  </button>
                  <a
                    href={`/api/admin/export/${selectedTenant.id}`}
                    download
                    className="px-3 py-1.5 bg-preik-surface border border-preik-border text-preik-text-muted text-sm font-medium rounded-xl hover:text-preik-text transition-colors"
                  >
                    Eksporter data
                  </a>
                  <button
                    onClick={() => handleDeleteTenant(selectedTenant.id)}
                    className="px-3 py-1.5 bg-red-500/10 text-red-600 text-sm font-medium rounded-xl hover:bg-red-500/20 transition-colors"
                  >
                    Slett
                  </button>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-preik-text-muted">Store ID</p>
                  <p className="text-preik-text font-mono">{selectedTenant.id}</p>
                </div>

                {editMode ? (
                  <EditTenantForm
                    editedTenant={editedTenant}
                    onChange={setEditedTenant}
                    onSave={async () => {
                      try {
                        const res = await fetch(`/api/admin/tenants/${selectedTenant.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            name: editedTenant.name,
                            allowed_domains: editedTenant.allowed_domains,
                            language: editedTenant.language,
                            persona: editedTenant.persona,
                          }),
                        });
                        if (!res.ok) throw new Error("Failed to update");
                        setEditMode(false);
                        setEditedTenant({});
                        fetchTenantDetails(selectedTenant.id);
                        fetchTenants();
                        setStatus({ type: "success", message: "Kunde oppdatert" });
                      } catch {
                        setStatus({ type: "error", message: "Kunne ikke oppdatere" });
                      }
                    }}
                  />
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-medium text-preik-text-muted">Tillatte domener</p>
                      <p className="text-preik-text">
                        {selectedTenant.allowed_domains?.length > 0
                          ? selectedTenant.allowed_domains.join(", ")
                          : "Ingen konfigurert"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-preik-text-muted">Språk</p>
                      <p className="text-preik-text">{selectedTenant.language || "no"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-preik-text-muted">Persona</p>
                      <p className="text-preik-text text-sm">{selectedTenant.persona || "Ikke satt"}</p>
                    </div>
                  </>
                )}

                <div>
                  <p className="text-sm font-medium text-preik-text-muted">Opprettet</p>
                  <p className="text-preik-text">
                    {new Date(selectedTenant.created_at).toLocaleDateString("nb-NO")}
                  </p>
                </div>
              </div>

              {/* Credit Management */}
              <CreditManagement
                tenant={selectedTenant}
                onUpdate={() => {
                  fetchTenantDetails(selectedTenant.id);
                  fetchTenants();
                }}
              />

              {/* Users */}
              <div className="border-t border-preik-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-preik-text">Brukere</h3>
                  <button
                    onClick={() => setShowCreateUser(true)}
                    className="px-3 py-1.5 bg-preik-accent text-white text-sm font-medium rounded-xl hover:bg-preik-accent-hover transition-colors"
                  >
                    + Ny bruker
                  </button>
                </div>

                {tenantUsers.length === 0 ? (
                  <p className="text-preik-text-muted text-sm">Ingen brukere</p>
                ) : (
                  <ul className="space-y-2">
                    {tenantUsers.map((user) => (
                      <li key={user.id} className="flex items-center justify-between py-2 px-3 bg-preik-bg rounded-xl">
                        <span className="text-preik-text">{user.email}</span>
                        <span className="text-xs bg-preik-accent/10 text-preik-accent px-2 py-0.5 rounded-full">
                          {user.role}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Feature Toggles */}
              <FeatureToggles
                tenant={selectedTenant}
                onUpdate={() => {
                  fetchTenantDetails(selectedTenant.id);
                  fetchTenants();
                }}
              />

              {/* Prompt Editor */}
              <div className="border-t border-preik-border pt-4 mt-4">
                <h3 className="font-medium text-preik-text mb-3">Systemprompt</h3>
                <AdminPromptEditor tenantId={selectedTenant.id} />
              </div>

              {/* Embed code */}
              <div className="border-t border-preik-border pt-4 mt-4">
                <h3 className="font-medium text-preik-text mb-2">Embed-kode</h3>
                <pre className="bg-preik-bg p-3 rounded-xl text-sm overflow-x-auto text-preik-text">
{`<script
  src="https://preik.no/widget.js"
  data-store-id="${selectedTenant.id}"
  async
></script>`}
                </pre>
              </div>
            </>
          ) : (
            <p className="text-preik-text-muted">Velg en kunde for å se detaljer</p>
          )}
        </div>
      </div>

      {/* Create Tenant Modal */}
      {showCreateTenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-preik-surface rounded-2xl border border-preik-border p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-preik-text mb-4">Opprett ny kunde</h2>
            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-preik-text mb-1">
                  Store ID *
                </label>
                <input
                  type="text"
                  value={newTenant.id}
                  onChange={(e) => setNewTenant({ ...newTenant, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                  placeholder="min-butikk"
                  required
                  className="w-full px-3 py-2 bg-preik-bg border border-preik-border rounded-xl focus:ring-preik-accent focus:border-preik-accent text-preik-text placeholder:text-preik-text-muted"
                />
                <p className="text-xs text-preik-text-muted mt-1">Brukes i embed-koden. Kun små bokstaver og bindestrek.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-preik-text mb-1">
                  Bedriftsnavn *
                </label>
                <input
                  type="text"
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                  placeholder="Min Butikk AS"
                  required
                  className="w-full px-3 py-2 bg-preik-bg border border-preik-border rounded-xl focus:ring-preik-accent focus:border-preik-accent text-preik-text placeholder:text-preik-text-muted"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-preik-text mb-1">
                  Tillatte domener
                </label>
                <input
                  type="text"
                  value={newTenant.allowed_domains}
                  onChange={(e) => setNewTenant({ ...newTenant, allowed_domains: e.target.value })}
                  placeholder="example.com, www.example.com"
                  className="w-full px-3 py-2 bg-preik-bg border border-preik-border rounded-xl focus:ring-preik-accent focus:border-preik-accent text-preik-text placeholder:text-preik-text-muted"
                />
                <p className="text-xs text-preik-text-muted mt-1">Kommaseparert liste over domener som kan bruke chatboten.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-preik-text mb-1">
                  Beskrivelse / Persona
                </label>
                <textarea
                  value={newTenant.persona}
                  onChange={(e) => setNewTenant({ ...newTenant, persona: e.target.value })}
                  placeholder="Kundeservice for nettbutikk..."
                  rows={2}
                  className="w-full px-3 py-2 bg-preik-bg border border-preik-border rounded-xl focus:ring-preik-accent focus:border-preik-accent text-preik-text placeholder:text-preik-text-muted"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTenant(false)}
                  className="flex-1 px-4 py-2 border border-preik-border text-preik-text-muted rounded-xl hover:bg-preik-bg transition-colors"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-preik-accent text-white rounded-xl hover:bg-preik-accent-hover transition-colors"
                >
                  Opprett
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUser && selectedTenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-preik-surface rounded-2xl border border-preik-border p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-preik-text mb-4">
              Inviter bruker til {selectedTenant.name}
            </h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-preik-text mb-1">
                  E-post *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="bruker@example.com"
                  required
                  className="w-full px-3 py-2 bg-preik-bg border border-preik-border rounded-xl focus:ring-preik-accent focus:border-preik-accent text-preik-text placeholder:text-preik-text-muted"
                />
              </div>
              <p className="text-sm text-preik-text-muted">Brukeren mottar en e-post med invitasjonslenke for å sette passord.</p>
              <div>
                <label className="block text-sm font-medium text-preik-text mb-1">
                  Rolle
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 bg-preik-bg border border-preik-border rounded-xl focus:ring-preik-accent focus:border-preik-accent text-preik-text"
                >
                  <option value="admin">Admin</option>
                  <option value="viewer">Leser</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateUser(false)}
                  className="flex-1 px-4 py-2 border border-preik-border text-preik-text-muted rounded-xl hover:bg-preik-bg transition-colors"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-preik-accent text-white rounded-xl hover:bg-preik-accent-hover transition-colors"
                >
                  Send invitasjon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CreditManagement({ tenant, onUpdate }: { tenant: Tenant; onUpdate: () => void }) {
  const [editLimit, setEditLimit] = useState(String(tenant.credit_limit));
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const percentUsed = tenant.credit_limit > 0
    ? Math.round((tenant.credits_used / tenant.credit_limit) * 100)
    : 0;

  async function handleSaveLimit() {
    const newLimit = parseInt(editLimit, 10);
    if (isNaN(newLimit) || newLimit < 0) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credit_limit: newLimit }),
      });
      if (!res.ok) throw new Error("Failed to update");
      onUpdate();
    } catch (error) {
      console.error("Failed to update credit limit:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!confirm("Nullstill kreditter for denne kunden? Dette kan ikke angres.")) return;
    setResetting(true);
    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_credits" }),
      });
      if (!res.ok) throw new Error("Failed to reset");
      onUpdate();
    } catch (error) {
      console.error("Failed to reset credits:", error);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="border-t border-preik-border pt-4 mb-4">
      <h3 className="font-medium text-preik-text mb-3">Kreditter</h3>
      <div className="space-y-3">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-preik-text-muted">{tenant.credits_used} / {tenant.credit_limit} brukt</span>
            <span className={`font-medium ${
              percentUsed > 80 ? "text-red-600" : percentUsed > 60 ? "text-yellow-600" : "text-green-600"
            }`}>{percentUsed}%</span>
          </div>
          <div className="w-full bg-preik-bg rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                percentUsed > 80 ? "bg-red-500" : percentUsed > 60 ? "bg-yellow-500" : "bg-green-500"
              }`}
              style={{ width: `${Math.min(percentUsed, 100)}%` }}
            />
          </div>
        </div>

        {/* Edit limit */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-preik-text-muted whitespace-nowrap">Grense:</label>
          <input
            type="number"
            min={0}
            value={editLimit}
            onChange={(e) => setEditLimit(e.target.value)}
            className="w-24 px-2 py-1 bg-preik-bg border border-preik-border rounded-xl text-sm focus:ring-preik-accent focus:border-preik-accent text-preik-text"
          />
          <button
            onClick={handleSaveLimit}
            disabled={saving || editLimit === String(tenant.credit_limit)}
            className="px-3 py-1 bg-preik-accent text-white text-sm rounded-xl hover:bg-preik-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "..." : "Lagre"}
          </button>
        </div>

        {/* Reset button */}
        <button
          onClick={handleReset}
          disabled={resetting || tenant.credits_used === 0}
          className="px-3 py-1.5 bg-yellow-500/10 text-yellow-700 text-sm font-medium rounded-xl hover:bg-yellow-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {resetting ? "Nullstiller..." : "Nullstill kreditter"}
        </button>

        {tenant.billing_cycle_start && (
          <p className="text-xs text-preik-text-muted">
            Syklus startet: {new Date(tenant.billing_cycle_start).toLocaleDateString("nb-NO")}
          </p>
        )}
      </div>
    </div>
  );
}

function EditTenantForm({
  editedTenant,
  onChange,
  onSave,
}: {
  editedTenant: Partial<Tenant>;
  onChange: (t: Partial<Tenant>) => void;
  onSave: () => void;
}) {
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-preik-text-muted">Navn</label>
        <input
          type="text"
          value={editedTenant.name || ""}
          onChange={(e) => onChange({ ...editedTenant, name: e.target.value })}
          className="w-full mt-1 px-3 py-2 bg-preik-bg border border-preik-border rounded-xl text-sm text-preik-text focus:ring-preik-accent focus:border-preik-accent"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-preik-text-muted">Tillatte domener</label>
        <input
          type="text"
          value={editedTenant.allowed_domains?.join(", ") || ""}
          onChange={(e) => onChange({
            ...editedTenant,
            allowed_domains: e.target.value.split(",").map(d => d.trim()).filter(Boolean),
          })}
          placeholder="example.com, www.example.com"
          className="w-full mt-1 px-3 py-2 bg-preik-bg border border-preik-border rounded-xl text-sm text-preik-text focus:ring-preik-accent focus:border-preik-accent"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-preik-text-muted">Språk</label>
        <select
          value={editedTenant.language || "no"}
          onChange={(e) => onChange({ ...editedTenant, language: e.target.value })}
          className="w-full mt-1 px-3 py-2 bg-preik-bg border border-preik-border rounded-xl text-sm text-preik-text focus:ring-preik-accent focus:border-preik-accent"
        >
          <option value="no">Norsk</option>
          <option value="en">Engelsk</option>
          <option value="sv">Svensk</option>
          <option value="da">Dansk</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-preik-text-muted">Persona</label>
        <textarea
          value={editedTenant.persona || ""}
          onChange={(e) => onChange({ ...editedTenant, persona: e.target.value })}
          rows={3}
          className="w-full mt-1 px-3 py-2 bg-preik-bg border border-preik-border rounded-xl text-sm text-preik-text focus:ring-preik-accent focus:border-preik-accent"
        />
      </div>
      <button
        onClick={async () => {
          setSaving(true);
          await onSave();
          setSaving(false);
        }}
        disabled={saving}
        className="px-4 py-2 bg-preik-accent text-white text-sm font-medium rounded-xl hover:bg-preik-accent-hover transition-colors disabled:opacity-40"
      >
        {saving ? "Lagrer..." : "Lagre endringer"}
      </button>
    </div>
  );
}

const FEATURE_FLAGS = [
  { key: "synonym_mapping", label: "Synonymmapping", description: "Automatisk synonym-gjenkjenning for bedre treff" },
  { key: "code_formatting", label: "Kodeblokk-formatering", description: "Formater kodesvar med syntax highlighting" },
  { key: "boat_expertise", label: "Båtekspertise", description: "Spesialisert kunnskap om båtprodukter" },
] as const;

function FeatureToggles({ tenant, onUpdate }: { tenant: Tenant; onUpdate: () => void }) {
  const features = tenant.features || {};

  async function handleToggle(key: string, enabled: boolean) {
    try {
      const updated = { ...features, [key]: enabled };
      const res = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: updated }),
      });
      if (!res.ok) throw new Error("Failed to update");
      onUpdate();
    } catch (error) {
      console.error("Failed to toggle feature:", error);
    }
  }

  return (
    <div className="border-t border-preik-border pt-4 mt-4">
      <h3 className="font-medium text-preik-text mb-3">Funksjoner</h3>
      <div className="space-y-3">
        {FEATURE_FLAGS.map((flag) => (
          <div key={flag.key} className="flex items-center justify-between py-2 px-3 bg-preik-bg rounded-xl">
            <div>
              <p className="text-sm font-medium text-preik-text">{flag.label}</p>
              <p className="text-xs text-preik-text-muted">{flag.description}</p>
            </div>
            <button
              onClick={() => handleToggle(flag.key, !features[flag.key])}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                features[flag.key] ? "bg-preik-accent" : "bg-preik-border"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  features[flag.key] ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
