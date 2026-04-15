"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateSchedule(formData: any[]) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Yetkisiz erişim" };

    const { data: profile } = await supabase
      .from("profiles_lookup")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile) return { success: false, error: "Profil bulunamadı" };

    const sanitizedData = formData.map((row) => ({
      tenant_id: profile.tenant_id,
      day_of_week: parseInt(row.day_of_week || 0),
      start_time: row.start_time || "09:00",
      end_time: row.end_time || "17:00",
      is_active: row.is_active === undefined ? false : !!row.is_active,
    }));

    const { error } = await supabase
      .from("schedules")
      .upsert(sanitizedData, { onConflict: "tenant_id, day_of_week" });

    if (error) {
      console.error("DB_UPSERT_ERROR:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (err: any) {
    console.error("UPDATE_SCHEDULE_CRASH:", err);
    return { success: false, error: "Sistem hatası oluştu" };
  }
}




export async function addService(service: { name: string; duration: number; credit_cost: number; description?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  const { error } = await supabase
    .from("services")
    .insert({
      tenant_id: profile.tenant_id,
      ...service,
    });

  if (error) throw error;
  revalidatePath("/dashboard/settings");
}

export async function deleteService(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard/settings");
}

import { sendBrandedEmail, getTopUpEmailTemplate } from "@/lib/notifications";

export async function addClientCredit(profileId: string, amount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Check if current user is admin
  const { data: admin } = await supabase
    .from("profiles")
    .select("profile_type, tenant_id")
    .eq("id", user.id)
    .single();

  if (admin?.profile_type !== "admin") throw new Error("Only admins can add credit");

  const { error } = await supabase.rpc("increment_wallet_balance", {
    p_profile_id: profileId,
    p_tenant_id: admin.tenant_id,
    p_amount: amount
  });

  if (error) throw error;

  // Background Notification (Async)
  (async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select(`
          email,
          tenants (
            id,
            name,
            contact_email,
            theme_config
          ),
          wallets (
            balance
          )
        `)
        .eq("id", profileId)
        .single();
      
      if (!profile) return;

      const tenant = profile.tenants as any;
      const wallet = (profile.wallets as any)[0];
      const tContext = {
        id: tenant.id,
        name: tenant.name,
        contact_email: tenant.contact_email,
        branding: tenant.theme_config.branding,
        terminology: tenant.theme_config.terminology
      };

      const emailBody = getTopUpEmailTemplate(
        amount,
        wallet.balance,
        tContext.terminology
      );

      await sendBrandedEmail({
        to: profile.email!,
        subject: `Yeni Kredi Yüklendi`,
        tenant: tContext,
        bodyContent: emailBody,
        ctaText: "Bakiyemi Görüntüle",
        ctaLink: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`
      });
    } catch (err) {
      console.error("TOPUP_NOTIFICATION_ERROR:", err);
    }
  })();

  revalidatePath("/dashboard/clients");
}


