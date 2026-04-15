import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface TenantContext {
  id: string;
  name: string;
  contact_email?: string;
  branding: { primaryColor: string };
  terminology: { client: string; provider: string; appointment: string };
}

export async function sendBrandedEmail({
  to,
  subject,
  tenant,
  bodyContent,
  ctaText,
  ctaLink,
}: {
  to: string | string[];
  subject: string;
  tenant: TenantContext;
  bodyContent: string;
  ctaText?: string;
  ctaLink?: string;
}) {
  if (!resend) {
    console.warn("NOTIFICATION_SKIPPED: RESEND_API_KEY missing.");
    return;
  }

  const primaryColor = tenant.branding.primaryColor || "#4f46e5";
  
  const htmlLayout = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: sans-serif; color: #1e293b; line-height: 1.5; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; }
          .header { background-color: ${primaryColor}; color: white; padding: 40px 20px; text-align: center; }
          .content { padding: 40px 30px; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
          .button { display: inline-block; padding: 12px 30px; background-color: ${primaryColor}; color: white; text-decoration: none; border-radius: 12px; font-weight: bold; margin-top: 20px; }
          h1 { margin: 0; font-size: 24px; font-weight: 800; }
          p { margin-top: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <p style="text-transform: uppercase; font-size: 10px; font-weight: 800; letter-spacing: 2px; margin-bottom: 8px; opacity: 0.8;">${tenant.name}</p>
            <h1>ADAPTA Özet</h1>
          </div>
          <div class="content">
            ${bodyContent}
            ${ctaLink ? `<a href="${ctaLink}" class="button">${ctaText || "Görüntüle"}</a>` : ""}
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} ${tenant.name} - AdaptA Tarafından Desteklenmektedir.
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: `${tenant.name} <onboarding@resend.dev>`,
      to,
      subject: `${tenant.name}: ${subject}`,
      html: htmlLayout,
    });
  } catch (err) {
    console.error("NOTIFICATION_ERROR:", err);
    // Silent fail as per Phase 7 Strategy
  }
}

// === Specific Template Helpers ===

export function getBookingEmailTemplate(clientName: string, serviceName: string, dateTime: string, cost: number, t: any) {
  return `
    <p>Merhaba,</p>
    <p>Yeni bir <strong>${t.appointment}</strong> başarıyla oluşturuldu.</p>
    <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;"><strong>${t.client}:</strong> ${clientName}</p>
      <p style="margin: 5px 0; font-size: 14px;"><strong>Hizmet:</strong> ${serviceName}</p>
      <p style="margin: 5px 0; font-size: 14px;"><strong>Tarih:</strong> ${dateTime}</p>
      <p style="margin: 5px 0; font-size: 14px;"><strong>Bedel:</strong> ${cost} Kredi</p>
    </div>
    <p>Detayları kontrol etmek için aşağıdaki butonu kullanabilirsiniz.</p>
  `;
}

export function getCancellationEmailTemplate(serviceName: string, dateTime: string, cost: number, t: any) {
  return `
    <p>Bilgilendirme,</p>
    <p>Mevcut bir <strong>${t.appointment}</strong> iptal edildi ve ödenen krediler iade edildi.</p>
    <div style="background: #fff1f2; padding: 20px; border-radius: 12px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;"><strong>İptal Edilen Hizmet:</strong> ${serviceName}</p>
      <p style="margin: 5px 0; font-size: 14px;"><strong>Tarih:</strong> ${dateTime}</p>
      <p style="margin: 5px 0; font-size: 14px;"><strong>İade Edilen Tutar:</strong> ${cost} Kredi</p>
    </div>
    <p>Hesabınız güncellenmiştir.</p>
  `;
}

export function getTopUpEmailTemplate(amount: number, newBalance: number, t: any) {
  return `
    <p>Merhaba,</p>
    <p>Hesabınıza yeni bir kredi yüklemesi yapıldığını bildirmek isteriz.</p>
    <p style="font-size: 18px; font-weight: bold; color: #059669;">+${amount} Kredi</p>
    <p>Güncel bakiyeniz şu an <strong>${newBalance} Kredi</strong> olarak görünmektedir.</p>
    <p>Keyifli ${t.appointment}lar dileriz!</p>
  `;
}
