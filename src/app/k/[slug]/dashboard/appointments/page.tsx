import { getTenantBySlug } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { format, isAfter } from "date-fns";
import { tr } from "date-fns/locale";
import { ClientAppointmentList } from "@/components/booking/client-appointment-list";

export default async function ClientAppointmentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const context = await getTenantBySlug(slug);
  if (!context) return null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch all appointments for this user in this tenant
  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      *,
      services (
        name,
        duration,
        credit_cost
      )
    `)
    .eq("profile_id", user.id)
    .eq("tenant_id", context.tenant.id)
    .order("start_time", { ascending: false });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl font-black text-slate-900">Randevularım</h1>
        <p className="text-slate-500 font-medium mt-1">
          Geçmiş ve gelecek tüm {context.terminology.appointment}larınızın listesi.
        </p>
      </header>

      <ClientAppointmentList 
        initialAppointments={appointments || []} 
        terminology={context.terminology}
      />
    </div>
  );
}
