"use client";

import { useState, useEffect } from "react";
import { format, addDays, startOfToday, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";
import { getAvailableSlots, bookAppointment } from "@/app/k/[slug]/book/[serviceId]/actions";
import { useRouter } from "next/navigation";

interface SlotPickerProps {
  tenantId: string;
  serviceId: string;
  serviceDuration: number;
}

export function SlotPicker({ tenantId, serviceId, serviceDuration }: SlotPickerProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate next 30 days
  const calendarDays = Array.from({ length: 30 }, (_, i) => addDays(startOfToday(), i));

  useEffect(() => {
    async function fetchSlots() {
      setLoading(true);
      setError(null);
      setSelectedSlot(null);
      try {
        const available = await getAvailableSlots(tenantId, serviceId, selectedDate.toISOString());
        setSlots(available);
      } catch (err) {
        setError("Randevu saatleri yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    }
    fetchSlots();
  }, [selectedDate, tenantId, serviceId]);

  const handleBooking = async () => {
    if (!selectedSlot) return;
    
    setBooking(true);
    setError(null);

    try {
      const [hours, mins] = selectedSlot.split(":").map(Number);
      const start = new Date(selectedDate);
      start.setHours(hours, mins, 0, 0);

      const end = new Date(start);
      end.setMinutes(end.getMinutes() + serviceDuration);

      const result = await bookAppointment(serviceId, start.toISOString(), end.toISOString());
      
      if (result.success) {
        alert("Randevunuz başarıyla oluşturuldu!");
        router.push("/dashboard"); // Redirect to user's dashboard to see the appointment
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Randevu oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Date Selector */}
      <section>
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 px-2">
          Gelecek 30 Gün
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-4 px-2 no-scrollbar">
          {calendarDays.map((date) => {
            const isSelected = isSameDay(date, selectedDate);
            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center transition-all ${
                  isSelected 
                    ? "bg-[var(--primary-color)] text-white shadow-lg scale-105" 
                    : "bg-white border border-slate-100 text-slate-600 hover:border-[var(--primary-color)]"
                }`}
              >
                <span className="text-[10px] font-bold uppercase opacity-60">
                  {format(date, "EEE", { locale: tr })}
                </span>
                <span className="text-xl font-black">
                  {format(date, "d")}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Slots Selector */}
      <section>
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 px-2">
          Müsait Saatler
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-[var(--primary-color)] rounded-full animate-spin" />
          </div>
        ) : slots.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 px-2">
            {slots.map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot)}
                className={`py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                  selectedSlot === slot
                    ? "bg-[var(--primary-color)] text-white shadow-md"
                    : "bg-white border border-slate-200 text-slate-700 hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-100 rounded-3xl py-12 text-center px-4">
            <p className="text-slate-400 font-medium italic italic">
              Seçilen tarihte müsait randevu bulunmamaktadır.
            </p>
          </div>
        )}
      </section>

      {/* Confirmation Area */}
      {selectedSlot && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-6 animate-in slide-in-from-bottom-full duration-500">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase mb-1">Seçilen Randevu</p>
              <h4 className="text-slate-900 font-bold">
                {format(selectedDate, "d MMMM yyyy", { locale: tr })} • {selectedSlot}
              </h4>
            </div>
            <button
              onClick={handleBooking}
              disabled={booking}
              className="px-10 py-4 bg-[var(--primary-color)] text-white font-bold rounded-2xl shadow-xl hover:opacity-95 transform active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {booking ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Randevuyu Onayla"
              )}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-sm font-medium">
          {error}
        </div>
      )}
    </div>
  );
}
