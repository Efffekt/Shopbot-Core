"use client";

import { useState } from "react";

interface DataExportButtonProps {
  tenantId: string;
}

export default function DataExportButton({ tenantId }: DataExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/tenant/${tenantId}/export`);
      if (!res.ok) {
        throw new Error("Export failed");
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `preik-export-${tenantId}.json`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Kunne ikke eksportere data. Prov igjen.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="px-4 py-2.5 bg-preik-accent text-white text-sm font-medium rounded-xl hover:bg-preik-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {exporting ? "Eksporterer..." : "Last ned eksport"}
    </button>
  );
}
