"use client";

import { useState } from "react";
import { addClientCredit } from "@/app/dashboard/actions";
import { PlusIcon } from "@heroicons/react/24/outline";

interface CreditManagerProps {
  profileId: string;
}

export function CreditManager({ profileId }: CreditManagerProps) {
  const [loading, setLoading] = useState(false);

  const handleAddCredit = async () => {
    const amountStr = prompt("Eklemek istediğiniz kredi miktarını girin:", "10");
    if (!amountStr) return;
    
    const amount = parseInt(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert("Lütfen geçerli bir sayı girin.");
      return;
    }

    setLoading(true);
    try {
      await addClientCredit(profileId, amount);
      alert("Kredi başarıyla eklendi.");
    } catch (err: any) {
      alert("Hata: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAddCredit}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary-color)] text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-sm active:scale-95"
    >
      {loading ? (
        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <PlusIcon className="w-3.5 h-3.5" />
      )}
      Kredi Ekle
    </button>
  );
}
