import { createClient } from "@/lib/supabase/server";
import { TenantStatusToggle } from "./status-toggle";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default async function SuperAdminTenants() {
  const supabase = await createClient();

  const { data: tenants } = await supabase
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white">Tenant Registry</h2>
          <p className="text-slate-500 mt-2 font-medium">Manage and monitor all schools and businesses on the platform.</p>
        </div>
      </header>

      <div className="bg-slate-900/50 backdrop-blur-md rounded-3xl border border-cyan-500/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#020617] border-b border-cyan-500/10">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-cyan-500/60 uppercase tracking-[0.2em]">Tenant Identity</th>
                <th className="px-8 py-6 text-[10px] font-black text-cyan-500/60 uppercase tracking-[0.2em]">Scale</th>
                <th className="px-8 py-6 text-[10px] font-black text-cyan-500/60 uppercase tracking-[0.2em]">Registered</th>
                <th className="px-8 py-6 text-[10px] font-black text-cyan-500/60 uppercase tracking-[0.2em] text-right">System Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-500/5">
              {tenants?.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-cyan-500/[0.02] transition-colors group">
                  <td className="px-8 py-8">
                    <div className="flex flex-col">
                      <span className="text-white font-black text-lg group-hover:text-cyan-400 transition-colors uppercase italic tracking-tight">{tenant.name}</span>
                      <span className="text-xs font-mono text-cyan-500/50 mt-1">/{tenant.slug}</span>
                    </div>
                  </td>
                  <td className="px-8 py-8">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-cyan-500/10">
                        <span className="text-xs font-bold text-slate-300">
                          {tenant.theme_config?.terminology?.client ?? "Hizmet Alan"} Focused
                        </span>

                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-8">
                    <span className="text-sm font-bold text-slate-500">
                      {format(new Date(tenant.created_at), "MMM d, yyyy", { locale: tr })}
                    </span>
                  </td>
                  <td className="px-8 py-8 text-right">
                    <TenantStatusToggle tenantId={tenant.id} isActive={tenant.is_active} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
