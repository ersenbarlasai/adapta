import { createClient } from "./supabase/server";
import { addDays, format, startOfDay, addMinutes, isAfter, parse } from "date-fns";

/**
 * Calculates available time slots for a specific service on a specific date.
 * Takes into account the weekly schedule and existing appointments.
 */
export async function calculateAvailability(
  tenantId: string,
  serviceDuration: number,
  targetDate: Date
) {
  const supabase = await createClient();
  const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, ...
  const psqlDay = (dayOfWeek + 6) % 7; // Convert to Mon=0, Sun=6 for our DB if using that, 
                                       // actually standard JS is 0=Sun. Let's check our check constraint.
                                       // day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6)
                                       // I'll assume 0=Monday, 6=Sunday for ease of UI mapping 
                                       // let's adjust: JS 0=Sun, 1=Mon...6=Sat.

  const jsToPsql = [6, 0, 1, 2, 3, 4, 5]; // 0(Sun)->6, 1(Mon)->0 ...
  const targetDayOfWeek = jsToPsql[dayOfWeek];

  // 1. Fetch Weekly Schedule for this day
  const { data: schedule } = await supabase
    .from("schedules")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("day_of_week", targetDayOfWeek)
    .eq("is_active", true)
    .single();

  if (!schedule) return [];

  // 2. Fetch Existing Appointments for this day
  const start = startOfDay(targetDate).toISOString();
  const end = addDays(startOfDay(targetDate), 1).toISOString();

  const { data: appointments } = await supabase
    .from("appointments")
    .select("start_time, end_time")
    .eq("tenant_id", tenantId)
    .eq("status", "confirmed")
    .gte("start_time", start)
    .lt("start_time", end);

  // 3. Generate Potential Slots
  const slots: string[] = [];
  const [startHour, startMin] = schedule.start_time.split(":").map(Number);
  const [endHour, endMin] = schedule.end_time.split(":").map(Number);

  let currentSlot = new Date(targetDate);
  currentSlot.setHours(startHour, startMin, 0, 0);

  const endTime = new Date(targetDate);
  endTime.setHours(endHour, endMin, 0, 0);

  const now = new Date();

  while (isAfter(endTime, addMinutes(currentSlot, serviceDuration))) {
    // Check if slot is in the future
    if (isAfter(currentSlot, now)) {
      // Check for overlap with existing appointments
      const isOverlap = appointments?.some((app) => {
        const appStart = new Date(app.start_time);
        const appEnd = new Date(app.end_time);
        const slotEnd = addMinutes(currentSlot, serviceDuration);
        
        return (
          (currentSlot >= appStart && currentSlot < appEnd) ||
          (slotEnd > appStart && slotEnd <= appEnd) ||
          (appStart >= currentSlot && appStart < slotEnd)
        );
      });

      if (!isOverlap) {
        slots.push(format(currentSlot, "HH:mm"));
      }
    }
    currentSlot = addMinutes(currentSlot, serviceDuration);
  }

  return slots;
}
