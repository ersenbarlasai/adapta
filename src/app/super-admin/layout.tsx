import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { 
  Squares2X2Icon, 
  UserGroupIcon, 
  QueueListIcon,
  ShieldCheckIcon,
  GlobeAltIcon
} from "@heroicons/react/24/outline";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?callbackUrl=/super-admin");
  }

  // Strict Super Admin Check
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_super_admin) {
    redirect("/dashboard"); // Redirect unauthorized users to standard dashboard
  }

  const navItems = [
    { name: "Overview", href: "/super-admin", icon: Squares2X2Icon },
    { name: "Tenants", href: "/super-admin/tenants", icon: GlobeAltIcon },
    { name: "Global Audit", href: "/super-admin/audit", icon: QueueListIcon },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 flex font-sans selection:bg-cyan-500/30">
      {/* High-Tech Sidebar */}
      <aside className="w-72 bg-[#020617] border-r border-cyan-500/10 flex flex-col sticky top-0 h-screen">
        <header className="p-8 pb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)]">
              <ShieldCheckIcon className="w-6 h-6 text-[#020617]" />
            </div>
            <div>
              <h1 className="text-white font-black tracking-tight leading-none text-xl">ADAPTA</h1>
              <p className="text-cyan-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Command Center</p>
            </div>
          </div>
        </header>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-cyan-500/5 hover:text-cyan-400 font-medium"
            >
              <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
              {item.name}
            </Link>
          ))}
        </nav>

        <footer className="p-8 border-t border-cyan-500/5">
          <div className="flex items-center gap-3 p-3 bg-cyan-500/5 rounded-xl border border-cyan-500/10">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-500 font-bold text-xs">
              SA
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Superuser Account</p>
              <p className="text-[10px] text-cyan-500/60 font-medium truncate uppercase tracking-widest">Global Root</p>
            </div>
          </div>
        </footer>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-[#020617] relative">
        {/* Modern Neon Glow Background */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] pointer-events-none rounded-full" />
        
        <div className="relative p-12 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
