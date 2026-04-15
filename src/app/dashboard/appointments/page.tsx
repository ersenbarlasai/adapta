import { getTenantContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { Calendar } from "@/components/dashboard/calendar";

export default async function AppointmentsPage() {
  const context = await getTenantContext();
  if (!context) return null;

  const supabase = await createClient();

  // Fetch all confirmed appointments for the next 30 days
  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      *,
      profiles (
        first_name,
        last_name,
        email
      ),
      services (
        name,
        credit_cost,
        duration
      )
    `)
    .eq("tenant_id", context.tenant.id)
    .eq("status", "confirmed")
    .order("start_time", { ascending: true });

  return (
    <div className="space-y-8 h-full flex flex-col">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Randevu Takvimi</h1>
        <p className="text-slate-500 text-sm mt-1">
          Tüm randevuları görüntüleyin ve gerektiğinde iptal işlemlerini gerçekleştirin.
        </p>
      </header>

      <div className="flex-1">
        <Calendar 
          initialAppointments={appointments || []} 
          terminology={context.terminology} 
        />
      </div>
    </div>
  );
}
