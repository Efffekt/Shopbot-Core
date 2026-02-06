"use client";

import { useState, useEffect } from "react";

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
}

interface TenantUser {
  id: string;
  email: string;
  role: string;
}

export default function CustomerManagement() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateTenant, setShowCreateTenant] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);

  // Form states
  const [newTenant, setNewTenant] = useState({
    id: "",
    name: "",
    allowed_domains: "",
    persona: "",
  });
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
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
          password: newUser.password,
          tenantId: selectedTenant.id,
          role: newUser.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      setStatus({ type: "success", message: `Bruker ${newUser.email} opprettet!` });
      setNewUser({ email: "", password: "", role: "admin" });
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status message */}
      {status.type && (
        <div
          className={`p-4 rounded-md ${
            status.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {status.message}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Tenant List */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Kunder</h2>
            <button
              onClick={() => setShowCreateTenant(true)}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              + Ny kunde
            </button>
          </div>

          {tenants.length === 0 ? (
            <p className="text-gray-500 text-sm">Ingen kunder ennå</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {tenants.map((tenant) => (
                <li
                  key={tenant.id}
                  onClick={() => fetchTenantDetails(tenant.id)}
                  className={`py-3 px-2 cursor-pointer rounded transition-colors ${
                    selectedTenant?.id === tenant.id
                      ? "bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <p className="font-medium text-gray-900">{tenant.name}</p>
                  <p className="text-sm text-gray-500">{tenant.id}</p>
                  {tenant.credit_limit > 0 && (
                    <div className="mt-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
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
                        <span className="text-xs text-gray-500">
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
        <div className="bg-white shadow rounded-lg p-6">
          {selectedTenant ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{selectedTenant.name}</h2>
                <button
                  onClick={() => handleDeleteTenant(selectedTenant.id)}
                  className="px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200"
                >
                  Slett
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Store ID</p>
                  <p className="text-gray-900 font-mono">{selectedTenant.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Tillatte domener</p>
                  <p className="text-gray-900">
                    {selectedTenant.allowed_domains?.length > 0
                      ? selectedTenant.allowed_domains.join(", ")
                      : "Ingen konfigurert"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Opprettet</p>
                  <p className="text-gray-900">
                    {new Date(selectedTenant.created_at).toLocaleDateString("no-NO")}
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
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Brukere</h3>
                  <button
                    onClick={() => setShowCreateUser(true)}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
                  >
                    + Ny bruker
                  </button>
                </div>

                {tenantUsers.length === 0 ? (
                  <p className="text-gray-500 text-sm">Ingen brukere</p>
                ) : (
                  <ul className="space-y-2">
                    {tenantUsers.map((user) => (
                      <li key={user.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                        <span className="text-gray-900">{user.email}</span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          {user.role}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Embed code */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium text-gray-900 mb-2">Embed-kode</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<script
  src="https://preik.no/widget.js"
  data-store-id="${selectedTenant.id}"
  async
></script>`}
                </pre>
              </div>
            </>
          ) : (
            <p className="text-gray-500">Velg en kunde for å se detaljer</p>
          )}
        </div>
      </div>

      {/* Create Tenant Modal */}
      {showCreateTenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Opprett ny kunde</h2>
            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store ID *
                </label>
                <input
                  type="text"
                  value={newTenant.id}
                  onChange={(e) => setNewTenant({ ...newTenant, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                  placeholder="min-butikk"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Brukes i embed-koden. Kun små bokstaver og bindestrek.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bedriftsnavn *
                </label>
                <input
                  type="text"
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                  placeholder="Min Butikk AS"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tillatte domener
                </label>
                <input
                  type="text"
                  value={newTenant.allowed_domains}
                  onChange={(e) => setNewTenant({ ...newTenant, allowed_domains: e.target.value })}
                  placeholder="example.com, www.example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Kommaseparert liste over domener som kan bruke chatboten.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beskrivelse / Persona
                </label>
                <textarea
                  value={newTenant.persona}
                  onChange={(e) => setNewTenant({ ...newTenant, persona: e.target.value })}
                  placeholder="Kundeservice for nettbutikk..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTenant(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Opprett bruker for {selectedTenant.name}
            </h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-post *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="bruker@example.com"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passord *
                </label>
                <input
                  type="text"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Minst 6 tegn"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Send dette til kunden så de kan logge inn.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rolle
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="admin">Admin</option>
                  <option value="viewer">Leser</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateUser(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Opprett
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
    <div className="border-t pt-4 mb-4">
      <h3 className="font-medium text-gray-900 mb-3">Kreditter</h3>
      <div className="space-y-3">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">{tenant.credits_used} / {tenant.credit_limit} brukt</span>
            <span className={`font-medium ${
              percentUsed > 80 ? "text-red-600" : percentUsed > 60 ? "text-yellow-600" : "text-green-600"
            }`}>{percentUsed}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
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
          <label className="text-sm text-gray-600 whitespace-nowrap">Grense:</label>
          <input
            type="number"
            min={0}
            value={editLimit}
            onChange={(e) => setEditLimit(e.target.value)}
            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleSaveLimit}
            disabled={saving || editLimit === String(tenant.credit_limit)}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {saving ? "..." : "Lagre"}
          </button>
        </div>

        {/* Reset button */}
        <button
          onClick={handleReset}
          disabled={resetting || tenant.credits_used === 0}
          className="px-3 py-1.5 bg-yellow-100 text-yellow-800 text-sm font-medium rounded hover:bg-yellow-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {resetting ? "Nullstiller..." : "Nullstill kreditter"}
        </button>

        {tenant.billing_cycle_start && (
          <p className="text-xs text-gray-500">
            Syklus startet: {new Date(tenant.billing_cycle_start).toLocaleDateString("nb-NO")}
          </p>
        )}
      </div>
    </div>
  );
}
