"use client";

import { useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cancelAppointment } from "@/app/dashboard/appointments/actions";
import { XMarkIcon, CalendarIcon, UserIcon, ClockIcon } from "@heroicons/react/24/outline";

interface AppointmentModalProps {
  appointment: any;
  onClose: () => void;
  terminology: { client: string };
}

export function AppointmentModal({ appointment, onClose, terminology }: AppointmentModalProps) {
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!confirm("Bu randevuyu iptal etmek istediğinizden emin misiniz? Ödenen krediler iade edilecektir.")) return;

    setLoading(true);
    try {
      await cancelAppointment(appointment.id);
      alert("Randevu iptal edildi ve kredi iadesi yapıldı.");
      onClose();
    } catch (err: any) {
      alert("Hata: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900">Randevu Detayı</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5 text-slate-400" />
          </button>
        </header>

        <div className="p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tarih & Saat</p>
              <p className="font-semibold text-slate-900">
                {format(new Date(appointment.start_time), "d MMMM yyyy", { locale: tr })}
              </p>
              <p className="text-sm text-slate-500 font-medium">
                {format(new Date(appointment.start_time), "HH:mm")} - {format(new Date(appointment.end_time), "HH:mm")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{terminology.client} Bilgileri</p>
              <p className="font-semibold text-slate-900">
                {appointment.profiles.first_name} {appointment.profiles.last_name}
              </p>
              <p className="text-sm text-slate-500 font-medium">{appointment.profiles.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <ClockIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hizmet ve Bedel</p>
              <p className="font-semibold text-slate-900">{appointment.services.name}</p>
              <p className="text-sm font-bold text-[var(--primary-color)]">
                {appointment.services.credit_cost} Kredi
              </p>
            </div>
          </div>
        </div>

        <footer className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-all"
          >
            Kapat
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {loading ? "İptal Ediliyor..." : "Randevuyu İptal Et"}
          </button>
        </footer>
      </div>
    </div>
  );
}
