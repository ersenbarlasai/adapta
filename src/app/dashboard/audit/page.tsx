import { getTenantContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default async function AuditPage() {
  const context = await getTenantContext();
  if (!context) return null;

  const supabase = await createClient();

  const { data: transactions } = await supabase
    .from("credit_transactions")
    .select(`
      *,
      profiles (
        first_name,
        last_name,
        email
      )
    `)
    .eq("tenant_id", context.tenant.id)
    .order("created_at", { ascending: false });

  const typeLabels: any = {
    topup: "Kredi Yükleme",
    booking: "Randevu Ödemesi",
    refund: "İptal İadesi",
    adjustment: "Düzeltme",
  };

  const typeColors: any = {
    topup: "text-emerald-600 bg-emerald-50",
    booking: "text-rose-600 bg-rose-50",
    refund: "text-blue-600 bg-blue-50",
    adjustment: "text-slate-600 bg-slate-50",
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">
          Finansal İşlem Geçmişi
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Tüm kredi hareketlerini ve bakiye değişimlerini buradan takip edebilirsiniz.
        </p>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Tarih</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">İlgili Kişi</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">İşlem</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Tutar</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Yeni Bakiye</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions?.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {format(new Date(tx.created_at), "d MMMM yyyy HH:mm", { locale: tr })}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900 text-sm">
                      {tx.profiles.first_name} {tx.profiles.last_name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">{tx.profiles.email}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${typeColors[tx.type]}`}>
                      {typeLabels[tx.type]}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">{tx.description}</p>
                  </td>
                  <td className={`px-6 py-4 text-center font-bold text-sm ${tx.amount > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                  </td>
                  <td className="px-6 py-4 text-center font-black text-slate-900 text-sm">
                    {tx.balance_after}
                  </td>
                </tr>
              ))}
              {(!transactions || transactions.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">
                    Henüz bir finansal işlem kaydı bulunmamaktadır.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
