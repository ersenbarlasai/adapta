import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/tenant";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ThemeProvider } from "@/components/providers/theme-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getTenantContext();

  // If no context (not logged in or no profile), redirect to login
  if (!context) {
    redirect("/login");
  }

  const { terminology, branding, tenant } = context;

  return (
    <ThemeProvider primaryColor={branding.primaryColor}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar terminology={terminology} />
        <main className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
            <h2 className="text-lg font-semibold text-slate-800">
              {tenant.name}
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">
                Oturum: {context.user.email}
              </span>
            </div>
          </header>
          {/* Content Area */}
          <div className="p-8 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
