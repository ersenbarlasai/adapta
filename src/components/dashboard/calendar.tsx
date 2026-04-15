"use client";

import { useState } from "react";
import { 
  format, 
  startOfWeek, 
  addDays, 
  isSameDay, 
  startOfToday,
  setHours,
  setMinutes,
  isSameHour,
  isSameMinute
} from "date-fns";
import { tr } from "date-fns/locale";
import { AppointmentModal } from "./appointment-modal";

interface CalendarProps {
  initialAppointments: any[];
  terminology: { client: string };
}

export function Calendar({ initialAppointments, terminology }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(startOfToday());
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);

  // Weekly view: Get days of the current week
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // 30-minute time slots (08:00 to 20:00)
  const timeSlots = Array.from({ length: 25 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8;
    const minute = (i % 2) * 30;
    return { hour, minute };
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl flex flex-col overflow-hidden">
      {/* Calendar Header */}
      <header className="p-8 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900">
          {format(weekStart, "MMMM yyyy", { locale: tr })}
        </h2>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setCurrentDate(addDays(currentDate, -7))}
            className="px-4 py-2 hover:bg-white rounded-lg transition-all text-sm font-bold text-slate-600 shadow-sm"
          >
            Geri
          </button>
          <button 
            onClick={() => setCurrentDate(startOfToday())}
            className="px-4 py-2 bg-white rounded-lg text-sm font-bold text-[var(--primary-color)] shadow-sm"
          >
            Bugün
          </button>
          <button 
            onClick={() => setCurrentDate(addDays(currentDate, 7))}
            className="px-4 py-2 hover:bg-white rounded-lg transition-all text-sm font-bold text-slate-600 shadow-sm"
          >
            İleri
          </button>
        </div>
      </header>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto max-h-[700px]">
        <div className="grid grid-cols-8 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div className="p-4 border-r border-slate-100" /> {/* Corner */}
          {weekDays.map((day) => (
            <div key={day.toISOString()} className={`p-4 text-center border-r border-slate-100 ${isSameDay(day, startOfToday()) ? "bg-slate-50" : ""}`}>
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                {format(day, "EEEE", { locale: tr })}
              </p>
              <p className={`text-xl font-black ${isSameDay(day, startOfToday()) ? "text-[var(--primary-color)]" : "text-slate-900"}`}>
                {format(day, "d")}
              </p>
            </div>
          ))}
        </div>

        {/* Time Rows */}
        <div className="grid grid-cols-8 relative">
          {timeSlots.map(({ hour, minute }) => {
            const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
            return (
              <div key={timeStr} className="contents">
                <div className="p-4 text-right border-r border-slate-100 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-400">{timeStr}</span>
                </div>
                {weekDays.map((day) => {
                  const cellTime = setHours(setMinutes(day, minute), hour);
                  
                  // Find appointments that start in this 30-min block
                  const apps = initialAppointments.filter((app) => {
                    const appStart = new Date(app.start_time);
                    return isSameDay(appStart, day) && 
                           appStart.getHours() === hour && 
                           appStart.getMinutes() >= minute && 
                           appStart.getMinutes() < (minute + 30);
                  });

                  return (
                    <div 
                      key={`${day.toISOString()}-${timeStr}`} 
                      className={`relative border-r border-b border-slate-50 min-h-[60px] ${isSameDay(day, startOfToday()) ? "bg-slate-50/30" : ""}`}
                    >
                      {apps.map((app) => (
                        <button
                          key={app.id}
                          onClick={() => setSelectedAppointment(app)}
                          className="absolute inset-x-1 top-1 p-2 rounded-xl text-left bg-[var(--primary-color)] text-white shadow-lg shadow-[var(--primary-color)]/20 hover:scale-[1.02] transition-all z-20 group"
                          style={{ height: "calc(200% - 8px)" }} // Simple 60min span assumption for UI
                        >
                          <p className="text-[10px] font-black uppercase opacity-70 truncate">
                            {app.services.name}
                          </p>
                          <p className="text-xs font-bold truncate">
                            {app.profiles.first_name} {app.profiles.last_name}
                          </p>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {selectedAppointment && (
        <AppointmentModal 
          appointment={selectedAppointment} 
          onClose={() => setSelectedAppointment(null)}
          terminology={terminology}
        />
      )}
    </div>
  );
}
