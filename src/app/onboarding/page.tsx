"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    schoolName: "",
    contactEmail: "",
    providerTerm: "Öğretmen",
    clientTerm: "Öğrenci",
    primaryColor: "#4f46e5", // Default Indigo 600
  });

  // Live Preview: Update CSS variable on change
  useEffect(() => {
    document.documentElement.style.setProperty("--primary-color", formData.primaryColor);
  }, [formData.primaryColor]);

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error("Oturum bulunamadı. Lütfen giriş yapın.");
      }

      const themeConfig = {
        branding: {
          primary_color: formData.primaryColor,
        },
        terminology: {
          provider: formData.providerTerm,
          client: formData.clientTerm,
        },
      };

      const { error: rpcError } = await supabase.rpc("onboard_tenant", {
        p_name: formData.schoolName,
        p_slug: generateSlug(formData.schoolName) || `school-${Math.random().toString(36).slice(2, 7)}`,
        p_contact_email: formData.contactEmail,
        p_theme_config: themeConfig,
        p_first_name: "Admin",
        p_last_name: "User",
      });

      if (rpcError) throw rpcError;

      router.push("/dashboard");
    } catch (err: any) {
      console.error("Onboarding Error:", err);
      setError(err.message || "Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Progress Bar */}
        <div className="h-2 bg-slate-100 w-full">
          <div 
            className="h-full transition-all duration-500 ease-out"
            style={{ 
              width: `${(step / 4) * 100}%`,
              backgroundColor: "var(--primary-color)" 
            }}
          />
        </div>

        <div className="p-8">
          <header className="mb-8 text-center border-b border-slate-50 pb-4">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Platform Kurulumu</h1>
            <p className="text-slate-500 text-sm">Adım {step} / 4</p>
          </header>

          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 animate-pulse">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: School Name */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <label className="block text-sm font-medium text-slate-700">
                  Okul / Kurum Adı
                  <span className="block text-xs font-normal text-slate-400 mt-1">
                    Bu isim platform genelinde ve faturalarda kullanılacaktır.
                  </span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent outline-none transition-all"
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  placeholder="Örn: Kaplan Koleji"
                />
                <label className="block text-sm font-medium text-slate-700">
                  İletişim E-postası
                  <span className="block text-xs font-normal text-slate-400 mt-1">
                    Bildirimlerin gönderileceği merkezi e-posta adresi.
                  </span>
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent outline-none transition-all"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="Örn: iletisim@kaplan.com"
                />
                <button
                  type="button"
                  disabled={!formData.schoolName}
                  onClick={handleNext}
                  className="w-full py-3 px-4 rounded-xl font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30"
                  style={{ backgroundColor: "var(--primary-color)" }}
                >
                  Sonraki Adım
                </button>
              </div>
            )}

            {/* Step 2: Provider Terminology */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <label className="block text-sm font-medium text-slate-700">
                  Hizmet Veren Rolü
                  <span className="block text-xs font-normal text-slate-400 mt-1">
                    Örneğin: Öğretmen, Danışman, Uzman
                  </span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent outline-none transition-all"
                  value={formData.providerTerm}
                  onChange={(e) => setFormData({ ...formData, providerTerm: e.target.value })}
                  placeholder="Örn: Öğretmen"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 py-3 px-4 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all active:scale-[0.98]"
                  >
                    Geri
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 py-3 px-4 rounded-xl font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ backgroundColor: "var(--primary-color)" }}
                  >
                    Devam Et
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Client Terminology */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <label className="block text-sm font-medium text-slate-700">
                  Hizmet Alan Rolü
                  <span className="block text-xs font-normal text-slate-400 mt-1">
                    Örneğin: Öğrenci, Danışan, Veli
                  </span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent outline-none transition-all"
                  value={formData.clientTerm}
                  onChange={(e) => setFormData({ ...formData, clientTerm: e.target.value })}
                  placeholder="Örn: Öğrenci"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 py-3 px-4 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all active:scale-[0.98]"
                  >
                    Geri
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 py-3 px-4 rounded-xl font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ backgroundColor: "var(--primary-color)" }}
                  >
                    Devam Et
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Brand Color */}
            {step === 4 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <label className="block text-sm font-medium text-slate-700">
                  Marka Renginiz
                </label>
                
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <input
                    type="color"
                    className="w-12 h-12 rounded-lg cursor-pointer border-none bg-transparent"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-mono text-slate-600 uppercase">{formData.primaryColor}</p>
                    <p className="text-xs text-slate-400">Canlı önizleme aktif</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-medium text-slate-900 mb-3">Önizleme:</h3>
                  <div className="space-y-3">
                    <div 
                      className="h-10 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                      style={{ backgroundColor: "var(--primary-color)" }}
                    >
                      {formData.schoolName || "Okul Adı"}
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: "var(--primary-color)" }}
                      />
                      <span className="text-xs text-slate-500">Ana Renk Teması</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 py-3 px-4 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all active:scale-[0.98]"
                    disabled={loading}
                  >
                    Geri
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 rounded-xl font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: "var(--primary-color)" }}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Hesabı Tamamla"
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
