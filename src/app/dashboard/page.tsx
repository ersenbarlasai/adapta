import { getTenantContext } from "@/lib/tenant";
import { StatsBar } from "@/components/dashboard/stats-bar";

export default async function DashboardPage() {
  const context = await getTenantContext();
  if (!context) return null;

  const { terminology, tenant } = context;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">
          Genel Bakış
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {tenant.name} platformunun güncel durumu ve hızlı aksiyonlar.
        </p>
      </header>

      <StatsBar tenantId={tenant.id} terminology={terminology} />
    </div>
  );
}

