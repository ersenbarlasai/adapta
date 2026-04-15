"use client";

import { useState } from "react";
import { format, isAfter } from "date-fns";
import { tr } from "date-fns/locale";
import { cancelAppointment } from "@/app/dashboard/appointments/actions";
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  TrashIcon 
} from "@heroicons/react/24/outline";

interface ClientAppointmentListProps {
  initialAppointments: any[];
  terminology: { appointment: string };
}

export function ClientAppointmentList({ initialAppointments, terminology }: ClientAppointmentListProps) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancel = async (id: string) => {
    if (!confirm("Bu randevuyu iptal etmek istediğinizden emin misiniz? Krediniz iade edilecektir.")) return;

    setCancellingId(id);
    try {
      await cancelAppointment(id);
      setAppointments(prev => 
        prev.map(app => app.id === id ? { ...app, status: 'cancelled' } : app)
      );
      alert("Randevu başarıyla iptal edildi.");
    } catch (err: any) {
      alert("Hata: " + err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const upcomingRows = appointments.filter(a => a.status === 'confirmed' && isAfter(new Date(a.start_time), new Date()));
  const pastRows = appointments.filter(a => a.status === 'cancelled' || !isAfter(new Date(a.start_time), new Date()));

  return (
    <div className="space-y-12">
      {/* Upcoming */}
      <section>
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 px-2">
          Gelecek {terminology.appointment}larım
        </h2>
        <div className="space-y-4">
          {upcomingRows.map((app) => (
            <div key={app.id} className="bg-white rounded-3xl border border-slate-200 p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-6">
                <div 
                  className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white"
                  style={{ backgroundColor: "var(--primary-color)" }}
                >
                  <span className="text-[10px] font-bold uppercase opacity-80">{format(new Date(app.start_time), "MMM", { locale: tr })}</span>
                  <span className="text-lg font-black">{format(new Date(app.start_time), "dd")}</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{app.services.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" />
                      {format(new Date(app.start_time), "HH:mm")}
                    </span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                    <span>{app.services.credit_cost} Kredi</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleCancel(app.id)}
                disabled={cancellingId === app.id}
                className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all disabled:opacity-50"
                title="İptal Et"
              >
                {cancellingId === app.id ? (
                  <div className="w-5 h-5 border-2 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
                ) : (
                  <TrashIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          ))}
          {upcomingRows.length === 0 && (
            <p className="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100 text-slate-400 text-sm italic">
              Yaklaşan bir randevunuz bulunmuyor.
            </p>
          )}
        </div>
      </section>

      {/* Past / Cancelled */}
      {pastRows.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 px-2">
            Geçmiş & İptal Edilenler
          </h2>
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden divide-y divide-slate-50">
            {pastRows.map((app) => (
              <div key={app.id} className="p-6 flex items-center justify-between opacity-60 grayscale-[0.5]">
                <div className="flex items-center gap-4">
                  <div className="text-center w-12">
                    <p className="text-[10px] font-bold uppercase text-slate-400">{format(new Date(app.start_time), "MMM", { locale: tr })}</p>
                    <p className="text-lg font-bold text-slate-600 leading-none">{format(new Date(app.start_time), "dd")}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{app.services.name}</h4>
                    <p className="text-xs text-slate-400">{format(new Date(app.start_time), "HH:mm")} • {app.services.credit_cost} Kredi</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {app.status === 'cancelled' ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 uppercase tracking-tighter bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                      <XCircleIcon className="w-3 h-3" /> İptal Edildi
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-tighter bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                      <CheckCircleIcon className="w-3 h-3" /> Tamamlandı
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
