import { renderStandardEmailLayout } from "../layout/standard-email-layout.template";
import { EMAIL_BRAND } from "../layout/email-brand";

interface PasswordRecoveryEmailTemplateInput {
  appUrl: string;
  code: string;
  expiresAt: Date;
  name: string;
  username: string;
}

function formatExpiration(expiresAt: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(expiresAt);
}

export function buildPasswordRecoveryEmail({
  appUrl,
  code,
  expiresAt,
  name,
  username,
}: PasswordRecoveryEmailTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const formattedExpiration = formatExpiration(expiresAt);
  const text = [
    `Ola, ${name}.`,
    "",
    "Recebemos uma solicitacao para recuperar a senha da sua conta na Amore Mio.",
    `Usuario: ${username}`,
    `Codigo de verificacao: ${code}`,
    `Validade: ${formattedExpiration}`,
    "",
    "Se voce nao solicitou esta recuperacao, ignore este email.",
    `Acesse: ${appUrl}/recuperar-senha`,
  ].join("\n");

  const html = renderStandardEmailLayout({
    title: "Recuperacao de senha",
    preheader: "Use o codigo enviado para recuperar o acesso a sua conta.",
    heading: "Recuperacao de senha",
    greeting: `Ola, ${name}.`,
    contentHtml: `
      <p style="margin:0 0 14px 0;color:${EMAIL_BRAND.textMuted};font-size:15px;line-height:1.6;">
        Recebemos uma solicitacao para recuperar a senha da sua conta na Amore Mio.
      </p>
      <p style="margin:0 0 14px 0;color:${EMAIL_BRAND.textMuted};font-size:15px;line-height:1.6;">
        Usuario: <strong>${username}</strong>
      </p>
      <div style="margin:22px 0;padding:18px;border-radius:14px;background:${EMAIL_BRAND.cardBackground};border:1px solid ${EMAIL_BRAND.border};text-align:center;">
        <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:${EMAIL_BRAND.accentDark};margin-bottom:8px;">Codigo de verificacao</div>
        <div style="font-size:32px;font-weight:700;letter-spacing:0.3em;color:${EMAIL_BRAND.text};">${code}</div>
      </div>
      <p style="margin:0 0 14px 0;color:${EMAIL_BRAND.textMuted};font-size:15px;line-height:1.6;">
        Este codigo expira em <strong>${formattedExpiration}</strong>.
      </p>
      <p style="margin:0;color:${EMAIL_BRAND.textSoft};font-size:14px;line-height:1.6;">
        Se voce nao solicitou esta recuperacao, ignore este email.
      </p>
    `,
    ctaLabel: "Recuperar senha",
    ctaUrl: `${appUrl}/recuperar-senha`,
    logoUrl: `${appUrl.replace(/\/$/, "")}/amoremio-logo-96.png`,
    footerNote:
      "Por seguranca, o codigo e de uso unico e ficara invalido apos a redefinicao da senha.",
  });

  return {
    subject: "Codigo para recuperar sua senha",
    html,
    text,
  };
}
