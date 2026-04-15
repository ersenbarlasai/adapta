import { getTenantContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { CreditManager } from "@/components/dashboard/credit-manager";

export default async function ClientsPage() {
  const context = await getTenantContext();
  if (!context) return null;

  const supabase = await createClient();

  // Fetch all profiles in this tenant (excluding admins for simplicity in MVP)
  const { data: clients } = await supabase
    .from("profiles")
    .select(`
      id,
      first_name,
      last_name,
      email,
      wallets (
        balance
      )
    `)
    .eq("tenant_id", context.tenant.id)
    .neq("profile_type", "admin")
    .order("first_name", { ascending: true });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">
          {context.terminology.client} Yönetimi
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {context.terminology.client} listesi ve kredi bakiyelerini yönetin.
        </p>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Ad Soyad</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">E-Posta</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Bakiye</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Aksiyon</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients?.map((client: any) => (
              <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">
                  {client.first_name} {client.last_name}
                </td>
                <td className="px-6 py-4 text-slate-500 text-sm">
                  {client.email}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                    {client.wallets?.[0]?.balance || 0} Kredi
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <CreditManager profileId={client.id} />
                </td>
              </tr>
            ))}
            {(!clients || clients.length === 0) && (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic">
                  Henüz kayıtlı bir {context.terminology.client} bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
