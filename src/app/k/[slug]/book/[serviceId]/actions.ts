"use server";

import { calculateAvailability } from "@/lib/availability";
import { createClient } from "@/lib/supabase/server";

export async function getAvailableSlots(tenantId: string, serviceId: string, date: string) {
  const supabase = await createClient();
  
  // Get service duration
  const { data: service } = await supabase
    .from("services")
    .select("duration")
    .eq("id", serviceId)
    .single();

  if (!service) return [];

  return await calculateAvailability(tenantId, service.duration, new Date(date));
}

import { sendBrandedEmail, getBookingEmailTemplate } from "@/lib/notifications";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export async function bookAppointment(serviceId: string, startTime: string, endTime: string) {
  const supabase = await createClient();
  
  // Call the atomic RPC function
  const { data, error } = await supabase.rpc("book_appointment_with_credit", {
    p_service_id: serviceId,
    p_start_time: startTime,
    p_end_time: endTime
  });

  if (error) throw error;

  // Background Notification (Async)
  (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get profile and tenant info
      const { data: profile } = await supabase
        .from("profiles")
        .select(`
          first_name, 
          last_name, 
          email,
          tenants (
            id,
            name,
            contact_email,
            theme_config
          )
        `)
        .eq("id", user.id)
        .single();
      
      const { data: service } = await supabase
        .from("services")
        .select("name, credit_cost")
        .eq("id", serviceId)
        .single();

      if (!profile || !service) return;

      const tenant = profile.tenants as any;
      const tContext = {
        id: tenant.id,
        name: tenant.name,
        contact_email: tenant.contact_email,
        branding: tenant.theme_config.branding,
        terminology: tenant.theme_config.terminology
      };

      const dateStr = format(new Date(startTime), "d MMMM yyyy HH:mm", { locale: tr });
      const emailBody = getBookingEmailTemplate(
        `${profile.first_name} ${profile.last_name}`,
        service.name,
        dateStr,
        service.credit_cost,
        tContext.terminology
      );

      const recipients = [profile.email!];
      if (tContext.contact_email) recipients.push(tContext.contact_email);

      await sendBrandedEmail({
        to: recipients,
        subject: `Yeni ${tContext.terminology.appointment} Onaylandı`,
        tenant: tContext,
        bodyContent: emailBody,
        ctaText: "Randevularımı Görüntüle",
        ctaLink: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`
      });
    } catch (err) {
      console.error("NOTIFICATION_TRIGGER_ERROR:", err);
    }
  })();

  return data;
}

