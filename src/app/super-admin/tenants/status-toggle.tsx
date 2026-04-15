"use client";

import { useState } from "react";
import { toggleTenantStatus } from "./actions";
import { PowerIcon } from "@heroicons/react/24/solid";

interface TenantStatusToggleProps {
  tenantId: string;
  isActive: boolean;
}

export function TenantStatusToggle({ tenantId, isActive }: TenantStatusToggleProps) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!confirm(`Are you sure you want to ${isActive ? 'DEACTIVATE' : 'ACTIVATE'} this tenant?`)) return;

    setLoading(true);
    try {
      await toggleTenantStatus(tenantId, isActive);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 ${
        isActive 
          ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
          : "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]"
      }`}
    >
      <PowerIcon className="w-4 h-4" />
      {isActive ? "ACTIVE" : "MAINTENANCE"}
    </button>
  );
}
