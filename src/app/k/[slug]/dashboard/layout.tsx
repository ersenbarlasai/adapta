import { redirect } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { ThemeProvider } from "@/components/providers/theme-provider";
import Link from "next/link";
import { 
  HomeIcon, 
  CalendarIcon, 
  ArrowPathIcon,
  PlusIcon
} from "@heroicons/react/24/outline";

export default async function ClientDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const context = await getTenantBySlug(slug);

  if (!context) redirect("/");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?callbackUrl=/k/${slug}/dashboard`);
  }

  // Fetch client details to verify they belong to this tenant
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.tenant_id !== context.tenant.id) {
    redirect("/dashboard"); // Redirect to their "native" dashboard if they try to access another tenant
  }

  // Fetch wallet for the "Book Now" context
  const { data: wallet } = await supabase
    .from("wallets")
    .select("balance")
    .eq("profile_id", user.id)
    .single();

  const balance = wallet?.balance || 0;
  const { tenant, terminology, branding } = context;

  const navItems = [
    { name: "Pano", href: `/k/${slug}/dashboard`, icon: HomeIcon },
    { name: `Randevularım`, href: `/k/${slug}/dashboard/appointments`, icon: CalendarIcon },
    { name: "İşlemlerim", href: `/k/[slug]/dashboard/transactions`, icon: ArrowPathIcon },
  ];

  return (
    <ThemeProvider primaryColor={branding.primaryColor}>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Sticky Top Nav */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href={`/k/${slug}`} className="font-black text-xl text-slate-900 tracking-tight">
                {tenant.name}
              </Link>
              <nav className="hidden md:flex items-center gap-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {/* Growth Loop: Book Now Button */}
              <Link
                href={`/k/${slug}`}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 ${
                  balance === 0 
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                  : "bg-[var(--primary-color)] text-white hover:opacity-90"
                }`}
                title={balance === 0 ? "Önce kredi yüklemeniz gerekmektedir." : `Yeni ${terminology.appointment} oluştur`}
              >
                <PlusIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Randevu Al</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Centered Content Container */}
        <main className="flex-1 w-full max-w-4xl mx-auto p-6 pb-24">
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between z-50">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 text-slate-400 active:text-[var(--primary-color)] transition-all"
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] font-bold">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </ThemeProvider>
  );
}
