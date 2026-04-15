import { notFound, redirect } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SlotPicker } from "@/components/booking/slot-picker";
import Link from "next/link";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string; serviceId: string }>;
}) {
  const { slug, serviceId } = await params;
  const context = await getTenantBySlug(slug);

  if (!context) {
    notFound();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect(`/login?callbackUrl=/k/${slug}/book/${serviceId}`);
  }

  const { tenant, terminology, branding } = context;

  // Fetch service details
  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("id", serviceId)
    .single();

  if (!service) {
    notFound();
  }

  // Fetch user's wallet
  const { data: wallet } = await supabase
    .from("wallets")
    .select("balance")
    .eq("profile_id", user.id)
    .single();

  return (
    <ThemeProvider primaryColor={branding.primaryColor}>
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100">
          <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
            <Link 
              href={`/k/${slug}`}
              className="group flex items-center text-slate-500 hover:text-slate-900 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-slate-100 flex items-center justify-center mr-3 transition-colors">
                <ChevronLeftIcon className="w-5 h-5" />
              </div>
              <span className="font-semibold text-sm">Geri</span>
            </Link>
            
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mevcut Bakiyeniz</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-slate-900">{wallet?.balance || 0}</span>
                <span className="text-xs font-bold text-[var(--primary-color)]">Kredi</span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto pt-32 pb-40 px-6">
          <section className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold"
                style={{ backgroundColor: `${branding.primaryColor}10`, color: branding.primaryColor }}
              >
                {service.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900">{service.name}</h1>
                <div className="flex items-center gap-3 text-slate-500 text-sm mt-1 font-medium">
                  <span>{service.duration} Dakika</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span>{service.credit_cost} Kredi</span>
                </div>
              </div>
            </div>
            {service.description && (
              <p className="text-slate-500 leading-relaxed max-w-2xl">{service.description}</p>
            )}
          </section>

          {/* Slot Selection logic */}
          <SlotPicker 
            tenantId={tenant.id} 
            serviceId={service.id} 
            serviceDuration={service.duration} 
          />
        </main>
      </div>
    </ThemeProvider>
  );
}
