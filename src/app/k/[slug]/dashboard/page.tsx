import { getTenantBySlug } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { WalletSummary } from "@/components/booking/wallet-summary";
import { format, isAfter } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { 
  CalendarIcon, 
  MapPinIcon, 
  ClockIcon,
  ChevronRightIcon 
} from "@heroicons/react/24/outline";

export default async function ClientDashboardPage({
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

  // 1. Fetch Wallet
  const { data: wallet } = await supabase
    .from("wallets")
    .select("balance")
    .eq("profile_id", user.id)
    .single();

  // 2. Fetch Next Appointment
  const { data: nextAppointment } = await supabase
    .from("appointments")
    .select(`
      *,
      services (
        name,
        duration
      )
    `)
    .eq("profile_id", user.id)
    .eq("status", "confirmed")
    .gt("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(1)
    .single();

  const { tenant, terminology } = context;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl font-black text-slate-900">Hoş Geldiniz</h1>
        <p className="text-slate-500 font-medium mt-1">
          {tenant.name} bünyesindeki hesabınızın genel durumu.
        </p>
      </header>

      {/* Wallet Area */}
      <WalletSummary balance={wallet?.balance || 0} tenantName={tenant.name} />

      {/* Next Appointment Card */}
      <section>
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
            Sıradaki {terminology.appointment}
          </h2>
          <Link 
            href={`/k/${slug}/dashboard/appointments`}
            className="text-xs font-bold text-[var(--primary-color)] hover:underline flex items-center gap-1"
          >
            Tümünü Gör <ChevronRightIcon className="w-3 h-3" />
          </Link>
        </div>

        {nextAppointment ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row items-center gap-8 group">
            <div 
              className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg transition-transform group-hover:rotate-3"
              style={{ backgroundColor: "var(--primary-color)" }}
            >
              <span className="text-[10px] font-bold uppercase opacity-80">
                {format(new Date(nextAppointment.start_time), "MMM", { locale: tr })}
              </span>
              <span className="text-2xl font-black">
                {format(new Date(nextAppointment.start_time), "dd")}
              </span>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-black text-slate-900 mb-2">
                {nextAppointment.services.name}
              </h3>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <ClockIcon className="w-4 h-4" />
                  {format(new Date(nextAppointment.start_time), "HH:mm")}
                </div>
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4" />
                  {format(new Date(nextAppointment.start_time), "EEEE", { locale: tr })}
                </div>
              </div>
            </div>

            <Link
              href={`/k/${slug}/dashboard/appointments`}
              className="px-8 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all active:scale-95"
            >
              Detaylar
            </Link>
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl py-12 flex flex-col items-center justify-center text-center px-6">
            <CalendarIcon className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-400 font-medium italic">
              Yaklaşan bir randevunuz bulunmuyor.
            </p>
            <Link
              href={`/k/${slug}`}
              className="mt-6 text-[var(--primary-color)] font-bold text-sm hover:underline"
            >
              Hemen yeni bir randevu oluşturun
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
