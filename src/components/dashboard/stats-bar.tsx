import { createClient } from "@/lib/supabase/server";
import { 
  UserGroupIcon, 
  CalendarDaysIcon, 
  BanknotesIcon 
} from "@heroicons/react/24/outline";

interface StatsBarProps {
  tenantId: string;
  terminology: { client: string; provider: string };
}

export async function StatsBar({ tenantId, terminology }: StatsBarProps) {
  const supabase = await createClient();

  // 1. Total Clients
  const { count: totalClients } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .neq("profile_type", "admin");

  // 2. Upcoming Appointments (Next 7 days)
  const now = new Date().toISOString();
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const { count: upcomingAppointments } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "confirmed")
    .gte("start_time", now)
    .lte("start_time", nextWeek);

  // 3. Credits in Circulation
  const { data: wallets } = await supabase
    .from("wallets")
    .select("balance")
    .eq("tenant_id", tenantId);
  
  const totalCredits = wallets?.reduce((sum, w) => sum + w.balance, 0) || 0;

  const stats = [
    {
      name: `Toplam ${terminology.client}`,
      value: totalClients || 0,
      icon: UserGroupIcon,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      name: "Gelecek Randevular (7 Gün)",
      value: upcomingAppointments || 0,
      icon: CalendarDaysIcon,
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      name: "Dolaşımdaki Kredi",
      value: totalCredits,
      icon: BanknotesIcon,
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      {stats.map((stat) => (
        <div key={stat.name} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
              {stat.name}
            </p>
            <p className="text-3xl font-black text-slate-900">
              {stat.value.toLocaleString()}
            </p>
          </div>
          <div className={`p-4 rounded-xl ${stat.bgColor} ${stat.iconColor}`}>
            <stat.icon className="w-6 h-6" />
          </div>
        </div>
      ))}
    </div>
  );
}
