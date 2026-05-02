const SITE_URL = "https://dartstournois.fr";

export function emailLayout(content: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:#b91c0a;padding:24px 32px;text-align:center;">
            <span style="font-size:24px;font-weight:900;color:#ffffff;letter-spacing:1px;text-transform:uppercase;">DartsTournois</span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;background:#fafafa;border-top:1px solid #eee;text-align:center;">
            <span style="font-size:12px;color:#999;">&copy; 2026 DartsTournois | <a href="${SITE_URL}" style="color:#b91c0a;text-decoration:none;">dartstournois.fr</a></span>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function emailButton(text: string, href: string) {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
  <tr><td style="background:#b91c0a;border-radius:8px;padding:14px 32px;text-align:center;">
    <a href="${href}" style="color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;display:inline-block;">${text}</a>
  </td></tr>
</table>`;
}

export function infoRow(label: string, value: string) {
  return `<tr>
  <td style="padding:6px 0;font-size:13px;color:#999;width:120px;vertical-align:top;">${label}</td>
  <td style="padding:6px 0;font-size:14px;color:#333;font-weight:500;">${value}</td>
</tr>`;
}

export function tournoiInfoTable(t: {
  nom: string;
  date_tournoi: string;
  heure?: string;
  ville: string;
  adresse?: string;
  format: string;
}) {
  const date = new Date(t.date_tournoi).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `<table cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;">
  ${infoRow("Tournoi", t.nom)}
  ${infoRow("Date", date)}
  ${t.heure ? infoRow("Heure", t.heure) : ""}
  ${infoRow("Lieu", t.adresse ? `${t.adresse}, ${t.ville}` : t.ville)}
  ${infoRow("Format", t.format)}
</table>`;
}

export { SITE_URL };
