import { EMAIL_BRAND } from "./email-brand";

interface StandardEmailLayoutInput {
  title: string;
  preheader: string;
  heading: string;
  greeting: string;
  contentHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
  logoUrl?: string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderStandardEmailLayout({
  title,
  preheader,
  heading,
  greeting,
  contentHtml,
  ctaLabel,
  ctaUrl,
  footerNote,
  logoUrl,
}: StandardEmailLayoutInput): string {
  const year = new Date().getFullYear();
  const ctaHtml =
    ctaLabel && ctaUrl
      ? `
      <div style="margin: 28px 0 10px 0; text-align: center;">
        <a href="${escapeHtml(ctaUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:${EMAIL_BRAND.accent};border:1px solid ${EMAIL_BRAND.accentDark};color:${EMAIL_BRAND.text};text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;box-shadow:0 6px 18px rgba(9,9,15,0.18);">
          ${escapeHtml(ctaLabel)}
        </a>
      </div>
    `
      : "";

  return `
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${EMAIL_BRAND.pageBackground};font-family:Arial,sans-serif;color:${EMAIL_BRAND.text};">
    <span style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${escapeHtml(preheader)}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_BRAND.pageBackground};padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="max-width:620px;background:${EMAIL_BRAND.surface};border:1px solid ${EMAIL_BRAND.border};border-radius:14px;overflow:hidden;box-shadow:0 14px 34px rgba(9,9,15,0.1);">
            <tr>
              <td style="padding:0;background:${EMAIL_BRAND.headerBackground};color:${EMAIL_BRAND.white};">
                <div style="height:6px;background:${EMAIL_BRAND.accent};font-size:0;line-height:0;">&nbsp;</div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding:22px 28px;vertical-align:middle;">
                      <table role="presentation" cellspacing="0" cellpadding="0">
                        <tr>
                          ${
                            logoUrl
                              ? `<td style="padding-right:12px;vertical-align:middle;">
                                  <img src="${escapeHtml(logoUrl)}" width="44" height="44" alt="Amore Mio" style="display:block;border-radius:50%;" />
                                </td>`
                              : ""
                          }
                          <td style="vertical-align:middle;">
                            <div style="font-size:16px;font-weight:800;letter-spacing:2.5px;color:${EMAIL_BRAND.white};">AMORE MIO</div>
                            <div style="margin-top:3px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${EMAIL_BRAND.accent};">Finance Platform</div>
                          </td>
                        </tr>
                      </table>
                      <h1 style="margin:16px 0 0 0;font-size:22px;line-height:1.3;color:${EMAIL_BRAND.white};">${escapeHtml(heading)}</h1>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:26px 28px;background:${EMAIL_BRAND.surface};">
                <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;">${escapeHtml(greeting)}</p>
                <div style="font-size:15px;line-height:1.65;color:${EMAIL_BRAND.textMuted};">${contentHtml}</div>
                ${ctaHtml}
                <p style="margin:24px 0 0 0;font-size:12px;line-height:1.5;color:${EMAIL_BRAND.textSoft};">
                  ${escapeHtml(
                    footerNote ||
                      "Se você não reconhece este email, ignore esta mensagem.",
                  )}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 28px;background:${EMAIL_BRAND.cardBackground};border-top:1px solid ${EMAIL_BRAND.border};font-size:11px;color:${EMAIL_BRAND.textSoft};text-align:center;">
                Amore Mio © ${year}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
}
