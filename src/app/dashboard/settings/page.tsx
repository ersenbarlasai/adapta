import { getTenantContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/dashboard/settings-form";

export default async function SettingsPage() {
  const context = await getTenantContext();
  if (!context) return null;

  const supabase = await createClient();

  // Fetch current schedule
  const { data: schedule } = await supabase
    .from("schedules")
    .select("*")
    .eq("tenant_id", context.tenant.id)
    .order("day_of_week", { ascending: true });

  // Fetch services
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("tenant_id", context.tenant.id)
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Ayarlar</h1>
        <p className="text-slate-500 mt-1">
          Hizmetlerinizi, {context.terminology.client} yönetimini ve çalışma saatlerinizi yapılandırın.
        </p>
      </header>

      <SettingsForm 
        initialSchedule={schedule || []} 
        initialServices={services || []}
        terminology={context.terminology}
      />
    </div>
  );
}
