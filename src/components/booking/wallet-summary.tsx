"use client";

import { useState } from "react";
import { BanknotesIcon, QuestionMarkCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface WalletSummaryProps {
  balance: number;
  tenantName: string;
}

export function WalletSummary({ balance, tenantName }: WalletSummaryProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 transition-transform group-hover:scale-110">
            <BanknotesIcon className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Mevcut Bakiyeniz</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900">{balance}</span>
              <span className="text-sm font-bold text-[var(--primary-color)]">Kredi</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold transition-all active:scale-95"
        >
          <QuestionMarkCircleIcon className="w-5 h-5 text-slate-400" />
          Nasıl Kredi Alırım?
        </button>
      </div>

      {/* Info Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Kredi Yükleme</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Kapat"
              >
                <XMarkIcon className="w-5 h-5 text-slate-400" />
              </button>
            </header>
            
            <div className="p-8 space-y-6">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mx-auto">
                <BanknotesIcon className="w-8 h-8" />
              </div>
              <div className="text-center space-y-3">
                <p className="text-slate-600 leading-relaxed font-medium">
                  Bakiyenizi artırmak ve yeni randevular oluşturmak için lütfen 
                  <strong className="text-slate-900 ml-1">{tenantName}</strong> yetkilileri ile iletişime geçin.
                </p>
                <p className="text-sm text-slate-400">
                  Ödemeniz onaylandığında kredileriniz anında hesabınıza yüklenecektir.
                </p>
              </div>
            </div>

            <footer className="px-8 py-6 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:opacity-90 transition-all shadow-lg active:scale-95"
              >
                Anladım
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
