"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

import { sendBrandedEmail, getCancellationEmailTemplate } from "@/lib/notifications";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export async function cancelAppointment(appointmentId: string) {
  const supabase = await createClient();
  
  // 1. Fetch details before cancellation for the email
  const { data: appointment } = await supabase
    .from("appointments")
    .select(`
      start_time,
      profiles (email),
      services (name, credit_cost),
      tenants (
        id,
        name,
        contact_email,
        theme_config
      )
    `)
    .eq("id", appointmentId)
    .single();

  // 2. Execute atomic cancellation/refund
  const { error } = await supabase.rpc("cancel_appointment_with_refund", {
    p_appointment_id: appointmentId
  });

  if (error) throw error;

  // 3. Background Notification (Async)
  if (appointment) {
    (async () => {
      try {
        const tenant = appointment.tenants as any;
        const profile = appointment.profiles as any;
        const service = appointment.services as any;

        const tContext = {
          id: tenant.id,
          name: tenant.name,
          contact_email: tenant.contact_email,
          branding: tenant.theme_config.branding,
          terminology: tenant.theme_config.terminology
        };

        const dateStr = format(new Date(appointment.start_time), "d MMMM yyyy HH:mm", { locale: tr });
        const emailBody = getCancellationEmailTemplate(
          service.name,
          dateStr,
          service.credit_cost,
          tContext.terminology
        );

        const recipients = [profile.email!];
        if (tContext.contact_email) recipients.push(tContext.contact_email);

        await sendBrandedEmail({
          to: recipients,
          subject: `${tContext.terminology.appointment} İptal Edildi`,
          tenant: tContext,
          bodyContent: emailBody,
        });
      } catch (err) {
        console.error("CANCELLATION_NOTIFICATION_ERROR:", err);
      }
    })();
  }
  
  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/audit");
  revalidatePath("/dashboard");
}

