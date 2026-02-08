"use client";

import { useState, useEffect } from "react";
import type { GlobalUser } from "@/types/admin";

export default function GlobalUserManagement() {
  const [users, setUsers] = useState<GlobalUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [removingAccess, setRemovingAccess] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers(searchQuery?: string) {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(data.users || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemoveAccess(userId: string, tenantId: string) {
    if (!confirm("Fjern brukerens tilgang til denne kunden?")) return;
    const key = `${userId}-${tenantId}`;
    setRemovingAccess(key);
    try {
      const res = await fetch(`/api/admin/users/${userId}/access`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });
      if (!res.ok) throw new Error("Failed to remove access");
      // Update local state
      setUsers(prev => prev.map(u => {
        if (u.id !== userId) return u;
        return {
          ...u,
          memberships: u.memberships.filter(m => m.tenant_id !== tenantId),
        };
      }));
    } catch (error) {
      console.error("Failed to remove access:", error);
    } finally {
      setRemovingAccess(null);
    }
  }

  function handleSearch() {
    fetchUsers(search);
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-preik-surface rounded-2xl border border-preik-border p-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Søk etter e-post..."
            className="flex-1 px-3 py-2 bg-preik-bg border border-preik-border rounded-xl text-sm text-preik-text placeholder:text-preik-text-muted focus:ring-preik-accent focus:border-preik-accent"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-preik-accent text-white rounded-xl text-sm font-medium hover:bg-preik-accent-hover transition-colors"
          >
            Søk
          </button>
        </div>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-preik-accent"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-preik-surface rounded-2xl border border-preik-border p-8 text-center">
          <p className="text-preik-text-muted">Ingen brukere funnet</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-preik-text-muted">{users.length} brukere</p>
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-preik-surface rounded-2xl border border-preik-border p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-preik-text">{user.email}</p>
                  <p className="text-xs text-preik-text-muted">
                    Opprettet: {new Date(user.created_at).toLocaleDateString("nb-NO")}
                  </p>
                </div>
              </div>

              {user.memberships.length > 0 ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-preik-text-muted">Kundetilgang:</p>
                  {user.memberships.map((m) => (
                    <div
                      key={m.tenant_id}
                      className="flex items-center justify-between py-1.5 px-3 bg-preik-bg rounded-xl"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-preik-text">{m.tenant_name}</span>
                        <span className="text-xs bg-preik-accent/10 text-preik-accent px-2 py-0.5 rounded-full">
                          {m.role}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveAccess(user.id, m.tenant_id)}
                        disabled={removingAccess === `${user.id}-${m.tenant_id}`}
                        className="text-xs text-red-600 hover:text-red-700 disabled:opacity-40"
                      >
                        {removingAccess === `${user.id}-${m.tenant_id}` ? "..." : "Fjern"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-preik-text-muted mt-2">Ingen kundetilgang</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
