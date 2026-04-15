import { getTenantBySlug } from "@/lib/tenant";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { notFound } from "next/navigation";

export default async function PublicTenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const context = await getTenantBySlug(slug);

  if (!context) {
    notFound();
  }

  const { tenant, branding } = context;

  // Maintenance Mode Check
  if (!tenant.is_active) {
    return (
      <ThemeProvider primaryColor={branding.primaryColor}>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-12 text-center border border-slate-100">
            <div 
              className="w-24 h-24 rounded-3xl mx-auto mb-8 flex items-center justify-center text-white text-4xl font-black shadow-lg animate-pulse"
              style={{ backgroundColor: "var(--primary-color)" }}
            >
              !
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tight">
              {tenant.name}
            </h1>
            <div className="h-1 w-12 bg-[var(--primary-color)] mx-auto mb-8 rounded-full" />
            <h2 className="text-xl font-bold text-slate-800 mb-3">Geçici Olarak Kapalı</h2>
            <p className="text-slate-500 font-medium leading-relaxed mb-10">
              Şu anda sistemde bakım çalışması yapıyoruz. En kısa sürede tekrar yayında olacağız. Anlayışınız için teşekkür ederiz.
            </p>
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest border-t border-slate-50 pt-8">
              AdaptA Tarafından Desteklenmektedir
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider primaryColor={branding.primaryColor}>
      {children}
    </ThemeProvider>
  );
}
