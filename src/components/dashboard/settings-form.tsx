"use client";

import { useState } from "react";
import { updateSchedule, addService, deleteService } from "@/app/dashboard/actions";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";

interface SettingsFormProps {
  initialSchedule: any[];
  initialServices: any[];
  terminology: { client: string; provider: string };
}

export function SettingsForm({ initialSchedule, initialServices, terminology }: SettingsFormProps) {
  const [schedule, setSchedule] = useState(initialSchedule);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [newService, setNewService] = useState({ name: "", duration: 60, credit_cost: 1, description: "" });
  const [loadingService, setLoadingService] = useState(false);

  const days = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

  const handleScheduleChange = (dayIndex: number, field: string, value: any) => {
    const newSchedule = [...schedule];
    const index = newSchedule.findIndex((s) => s.day_of_week === dayIndex);
    if (index > -1) {
      newSchedule[index] = { ...newSchedule[index], [field]: value };
    } else {
      newSchedule.push({ day_of_week: dayIndex, start_time: "09:00", end_time: "17:00", is_active: true, [field]: value });
    }
    setSchedule(newSchedule);
  };

  const saveSchedule = async () => {
    setLoadingSchedule(true);
    try {
      const result = await updateSchedule(schedule);
      if (result?.success) {
        alert("Çalışma saatleri güncellendi.");
      } else {
        alert("Hata: " + (result?.error || "Bilinmeyen bir hata oluştu."));
      }
    } catch (err) {
      console.error("SAVE_SCHEDULE_CLIENT_ERROR:", err);
      alert("Bağlantı hatası oluştu. Konsol loglarını kontrol edin.");
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingService(true);
    try {
      await addService(newService);
      setNewService({ name: "", duration: 60, credit_cost: 1, description: "" });
    } catch (err) {
      alert("Hata oluştu.");
    } finally {
      setLoadingService(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Weekly Schedule Settings */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <header className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Haftalık Çalışma Takvimi</h2>
            <p className="text-sm text-slate-500">Hangi günlerde randevu kabul ettiğinizi belirleyin.</p>
          </div>
          <button
            onClick={saveSchedule}
            disabled={loadingSchedule}
            className="px-6 py-2 bg-[var(--primary-color)] text-white rounded-xl font-medium transition-all hover:opacity-90 disabled:opacity-50"
          >
            {loadingSchedule ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </header>
        <div className="divide-y divide-slate-50">
          {days.map((day, idx) => {
            const dayData = schedule.find((s) => s.day_of_week === idx) || { is_active: false, start_time: "09:00", end_time: "17:00" };
            return (
              <div key={day} className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4 w-1/3">
                  <input
                    type="checkbox"
                    checked={dayData.is_active}
                    onChange={(e) => handleScheduleChange(idx, "is_active", e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                  />
                  <span className={`font-medium ${dayData.is_active ? "text-slate-900" : "text-slate-400"}`}>{day}</span>
                </div>
                
                <div className={`flex items-center gap-4 transition-opacity ${dayData.is_active ? "opacity-100" : "opacity-30 pointer-events-none"}`}>
                  <input
                    type="time"
                    value={dayData.start_time}
                    onChange={(e) => handleScheduleChange(idx, "start_time", e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                  <span className="text-slate-400 text-sm">ila</span>
                  <input
                    type="time"
                    value={dayData.end_time}
                    onChange={(e) => handleScheduleChange(idx, "end_time", e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Services Settings */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <header className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Hizmet Programlarınız</h2>
          <p className="text-sm text-slate-500">Sunduğunuz hizmetleri ve kredi maliyetlerini tanımlayın.</p>
        </header>

        <div className="p-6 space-y-6">
          {/* New Service Form */}
          <form onSubmit={handleAddService} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Hizmet Adı</label>
              <input
                type="text"
                required
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                placeholder="Örn: 60 Dakika Danışmanlık"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Süre (Dk)</label>
              <input
                type="number"
                required
                value={newService.duration}
                onChange={(e) => setNewService({ ...newService, duration: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Kredi Bedeli</label>
              <input
                type="number"
                required
                value={newService.credit_cost}
                onChange={(e) => setNewService({ ...newService, credit_cost: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div className="md:col-span-4 flex justify-end">
              <button
                type="submit"
                disabled={loadingService}
                className="flex items-center gap-2 px-6 py-2 bg-[var(--primary-color)] text-white rounded-xl font-medium transition-all hover:opacity-90 disabled:opacity-50"
              >
                <PlusIcon className="w-5 h-5" />
                Hizmet Ekle
              </button>
            </div>
          </form>

          {/* Services List */}
          <div className="divide-y divide-slate-100">
            {initialServices.map((service) => (
              <div key={service.id} className="py-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">{service.name}</h4>
                  <p className="text-sm text-slate-500">
                    {service.duration} dk • {service.credit_cost} Kredi
                  </p>
                </div>
                <button 
                  onClick={() => deleteService(service.id)}
                  className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
            {initialServices.length === 0 && (
              <p className="text-center py-8 text-slate-400 italic">Henüz bir hizmet tanımlanmamış.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
