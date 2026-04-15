import { createClient } from "@/lib/supabase/server";
import { 
  GlobeAltIcon, 
  UserGroupIcon, 
  CalendarDaysIcon, 
  CircleStackIcon 
} from "@heroicons/react/24/outline";

export default async function SuperAdminDashboard() {
  const supabase = await createClient();

  // Fetch Global Stats
  const { count: tenantCount } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true });

  const { count: userCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: appointmentCount } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true });

  const { data: wallets } = await supabase
    .from("wallets")
    .select("balance");

  const totalCredits = wallets?.reduce((sum, w) => sum + w.balance, 0) || 0;

  const kpis = [
    { 
      name: "Active Tenants", 
      value: tenantCount || 0, 
      icon: GlobeAltIcon, 
      color: "text-cyan-400",
      desc: "Schools & businesses on platform"
    },
    { 
      name: "Total Users", 
      value: userCount || 0, 
      icon: UserGroupIcon, 
      color: "text-blue-400",
      desc: "Platform-wide registrations"
    },
    { 
      name: "Total Appointments", 
      value: appointmentCount || 0, 
      icon: CalendarDaysIcon, 
      color: "text-indigo-400",
      desc: "Cumulative lifecycle bookings"
    },
    { 
      name: "System Liquidity", 
      value: `${totalCredits.toLocaleString()}`, 
      icon: CircleStackIcon, 
      color: "text-emerald-400",
      desc: "Total credits in circulation"
    },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <header>
        <h2 className="text-3xl font-black text-white">Platform Overview</h2>
        <p className="text-slate-500 mt-2 font-medium">Real-time aggregate data across the entire multi-tenant ecosystem.</p>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.name} className="bg-slate-900/50 backdrop-blur-sm border border-cyan-500/10 p-8 rounded-3xl group hover:border-cyan-500/30 transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className={`p-4 rounded-2xl bg-cyan-500/5 ${kpi.color}`}>
                <kpi.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-3xl font-black text-white mb-1 group-hover:scale-110 transition-transform origin-left">{kpi.value}</p>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{kpi.name}</p>
            <p className="text-[10px] text-slate-600 mt-4 font-bold uppercase tracking-tighter">{kpi.desc}</p>
          </div>
        ))}
      </div>

      {/* System Health Section (Placeholder) */}
      <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-3xl p-12 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center text-cyan-500 mx-auto animate-pulse">
            <ShieldCheckIcon className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white uppercase tracking-widest">Core Engine Stable</h3>
          <p className="text-slate-500 text-sm italic">Multi-tenant isolation and atomic credit deductions are operating within normal parameters.</p>
        </div>
      </div>
    </div>
  );
}

// Inline fallback icon since we only imported a few
function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}
