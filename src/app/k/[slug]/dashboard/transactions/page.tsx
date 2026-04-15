import { getTenantBySlug } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { BanknotesIcon, ArrowUpCircleIcon, ArrowDownCircleIcon } from "@heroicons/react/24/outline";

export default async function ClientTransactionsPage({
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

  // Fetch only this user's transactions in this tenant
  const { data: transactions } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("profile_id", user.id)
    .eq("tenant_id", context.tenant.id)
    .order("created_at", { ascending: false });

  const typeLabels: any = {
    topup: "Kredi Yükleme",
    booking: "Harcama",
    refund: "İade",
    adjustment: "Düzeltme",
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl font-black text-slate-900">İşlem Geçmişi</h1>
        <p className="text-slate-500 font-medium mt-1">
          Kredi bakiyenizdeki tüm değişimlerin dökümü.
        </p>
      </header>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-100">
          {transactions?.map((tx) => (
            <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.amount > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                  {tx.amount > 0 ? <ArrowUpCircleIcon className="w-6 h-6" /> : <ArrowDownCircleIcon className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{typeLabels[tx.type]}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{tx.description}</p>
                  <p className="text-[10px] font-bold text-slate-300 uppercase mt-1 tracking-widest">
                    {format(new Date(tx.created_at), "d MMMM yyyy HH:mm", { locale: tr })}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className={`text-lg font-black ${tx.amount > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Kalan: {tx.balance_after}
                </p>
              </div>
            </div>
          ))}

          {(!transactions || transactions.length === 0) && (
            <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
              <BanknotesIcon className="w-12 h-12 text-slate-200" />
              <p className="text-slate-400 font-medium italic">Henüz bir işlem kaydınız bulunmuyor.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
