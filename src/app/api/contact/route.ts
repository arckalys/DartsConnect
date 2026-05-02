import { Resend } from "resend";
import { emailLayout } from "@/lib/email-template";

export const runtime = "edge";

const FROM = "DartsTournois <noreply@dartstournois.fr>";
const TO = "contact@dartstournois.fr";

export async function POST(req: Request) {
  try {
    console.log("[api/contact] Route called");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { prenom, nom, email, sujet, message } = await req.json();

    if (!email || !sujet || !message) {
      return Response.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const fullName = [prenom, nom].filter(Boolean).join(" ") || "Anonyme";

    const html = emailLayout(`
      <h1 style="margin:0 0 16px;font-size:20px;color:#111;">Nouveau message de contact</h1>
      <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;">
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#999;width:100px;vertical-align:top;">Nom</td>
          <td style="padding:8px 0;font-size:14px;color:#333;font-weight:500;">${fullName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#999;vertical-align:top;">Email</td>
          <td style="padding:8px 0;font-size:14px;color:#333;font-weight:500;"><a href="mailto:${email}" style="color:#b91c0a;">${email}</a></td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#999;vertical-align:top;">Sujet</td>
          <td style="padding:8px 0;font-size:14px;color:#333;font-weight:500;">${sujet}</td>
        </tr>
      </table>
      <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin:0 0 8px;">
        <div style="font-size:12px;color:#999;margin-bottom:8px;font-weight:600;text-transform:uppercase;">Message</div>
        <div style="font-size:14px;color:#333;line-height:1.7;white-space:pre-line;">${message}</div>
      </div>
    `);

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: TO,
      replyTo: email,
      subject: `[Contact] ${sujet} — ${fullName}`,
      html,
    });

    if (error) {
      console.error("[api/contact] Resend error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }
    console.log("[api/contact] Sent OK, id:", data?.id);
    return Response.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[api/contact] Exception:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
