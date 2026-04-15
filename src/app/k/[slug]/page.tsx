import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { ThemeProvider } from "@/components/providers/theme-provider";
import Link from "next/link";

export default async function PublicTenantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const context = await getTenantBySlug(slug);

  if (!context) {
    notFound();
  }

  const { tenant, terminology, branding } = context;
  const supabase = await createClient();

  // Fetch public services for this tenant
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("name", { ascending: true });

  return (
    <ThemeProvider primaryColor={branding.primaryColor}>
      <div className="min-h-screen bg-slate-50">
        {/* Navbar */}
        <nav className="h-20 bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">{tenant.name}</h1>
            <div className="flex items-center gap-4">
              <Link
                href={`/login`}
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Giriş Yap
              </Link>
              <Link
                href={`/register`}
                className="px-5 py-2.5 bg-[var(--primary-color)] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all"
              >
                Kayıt Ol
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-4xl mx-auto py-16 px-6 text-center">
            <div 
              className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center text-white text-3xl font-bold shadow-lg"
              style={{ backgroundColor: "var(--primary-color)" }}
            >
              {tenant.name.charAt(0)}
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
              {tenant.name} Randevu Sistemi
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Müsait olduğumuz saatleri görüntüleyin ve size uygun {terminology.provider} ile randevunuzu hemen oluşturun.
            </p>
          </div>
        </div>

        {/* Services Section */}
        <main className="max-w-6xl mx-auto py-16 px-6">
          <header className="mb-10">
            <h3 className="text-2xl font-bold text-slate-900">Hizmetlerimiz</h3>
            <p className="text-slate-500 mt-1">İhtiyacınıza en uygun hizmeti seçerek devam edin.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services?.map((service) => (
              <div 
                key={service.id} 
                className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div className="p-8 flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                      style={{ backgroundColor: `${branding.primaryColor}10`, color: branding.primaryColor }}
                    >
                      {service.name.charAt(0)}
                    </div>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full uppercase tracking-wider">
                      {service.duration} Dakika
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-[var(--primary-color)] transition-colors">
                    {service.name}
                  </h4>
                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">
                    {service.description || "Bu hizmet için bir açıklama bulunmuyor."}
                  </p>
                </div>
                
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[var(--primary-color)] text-xl font-black">
                      {service.credit_cost}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Kredi</span>
                  </div>
                  <Link
                    href={`/k/${slug}/book/${service.id}`}
                    className="px-6 py-3 bg-[var(--primary-color)] text-white text-sm font-bold rounded-xl hover:opacity-90 transform active:scale-95 transition-all shadow-md active:shadow-sm"
                  >
                    Randevu Al
                  </Link>
                </div>
              </div>
            ))}
            
            {(!services || services.length === 0) && (
              <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400 text-lg font-medium">Bu kurum henüz bir hizmet tanımlamamış.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
