import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default async function SuperAdminAudit() {
  const supabase = await createClient();

  const { data: transactions } = await supabase
    .from("credit_transactions")
    .select(`
      *,
      tenants (name),
      profiles (first_name, last_name, email)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <header>
        <h2 className="text-3xl font-black text-white">Global Ledger</h2>
        <p className="text-slate-500 mt-2 font-medium">Cross-tenant monitoring of every credit movement in the ecosystem.</p>
      </header>

      <div className="bg-slate-900/50 backdrop-blur-md rounded-3xl border border-cyan-500/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#020617] border-b border-cyan-500/10">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-cyan-500/60 uppercase tracking-[0.2em]">Timestamp</th>
                <th className="px-8 py-6 text-[10px] font-black text-cyan-500/60 uppercase tracking-[0.2em]">Tenant Context</th>
                <th className="px-8 py-6 text-[10px] font-black text-cyan-500/60 uppercase tracking-[0.2em]">Identity</th>
                <th className="px-8 py-6 text-[10px] font-black text-cyan-500/60 uppercase tracking-[0.2em] text-center">Type</th>
                <th className="px-8 py-6 text-[10px] font-black text-cyan-500/60 uppercase tracking-[0.2em] text-center">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-500/5 text-sm">
              {transactions?.map((tx) => (
                <tr key={tx.id} className="hover:bg-cyan-500/[0.02] transition-colors">
                  <td className="px-8 py-6 text-slate-500 font-mono text-[10px]">
                    {format(new Date(tx.created_at), "HH:mm:ss d MMM yyyy", { locale: tr })}
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-cyan-400 font-bold uppercase tracking-wider text-xs">
                      {tx.tenants?.name || "System"}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-white font-bold">{tx.profiles?.first_name} {tx.profiles?.last_name}</p>
                    <p className="text-[10px] text-slate-600 font-medium truncate">{tx.profiles?.email}</p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                      tx.type === 'topup' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' :
                      tx.type === 'booking' ? 'text-rose-400 border-rose-500/20 bg-rose-500/5' :
                      'text-cyan-400 border-cyan-500/20 bg-cyan-500/5'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className={`px-8 py-6 text-center font-black ${tx.amount > 0 ? "text-emerald-500" : "text-rose-400"}`}>
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
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
