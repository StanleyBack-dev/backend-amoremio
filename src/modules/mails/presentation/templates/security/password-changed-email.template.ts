import { renderStandardEmailLayout } from "../layout/standard-email-layout.template";
import { EMAIL_BRAND } from "../layout/email-brand";

interface PasswordChangedTemplateInput {
  name: string;
  changedAt: Date;
  appUrl: string;
}

function formatChangedAt(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function buildPlainTextContent({
  name,
  changedAt,
  appUrl,
}: PasswordChangedTemplateInput): string {
  return [
    `Olá, ${name}.`,
    "",
    `A senha da sua conta na Amore Mio foi alterada em ${formatChangedAt(changedAt)}.`,
    "",
    "Se foi você, não é preciso fazer nada.",
    "Se não reconhece esta alteração, acesse sua conta e troque a senha imediatamente, ou entre em contato com o suporte.",
    `Acesse: ${appUrl}`,
  ].join("\n");
}

export function buildPasswordChangedEmail(
  input: PasswordChangedTemplateInput,
): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = input.name.split(" ")[0] || input.name;
  const changedAtLabel = formatChangedAt(input.changedAt);

  const contentHtml = `
    <p style="margin:0 0 12px 0;color:${EMAIL_BRAND.textMuted};">A senha da sua conta na Amore Mio foi alterada em <strong style="color:${EMAIL_BRAND.text};">${changedAtLabel}</strong>.</p>
    <p style="margin:0 0 12px 0;color:${EMAIL_BRAND.textMuted};">Se foi você, não é preciso fazer nada.</p>
    <p style="margin:0;color:${EMAIL_BRAND.textMuted};">Se <strong style="color:${EMAIL_BRAND.text};">não reconhece</strong> esta alteração, acesse sua conta e troque a senha imediatamente.</p>
  `;

  const html = renderStandardEmailLayout({
    title: "Sua senha foi alterada",
    preheader: "Confirmação de alteração de senha na Amore Mio.",
    heading: "Sua senha foi alterada",
    greeting: `Olá, ${firstName}!`,
    contentHtml,
    ctaLabel: "Acessar plataforma",
    ctaUrl: input.appUrl,
    logoUrl: `${input.appUrl.replace(/\/$/, "")}/amoremio-logo-96.png`,
    footerNote:
      "Se você não reconhece esta alteração, troque sua senha imediatamente ou contate o suporte.",
  });

  return {
    subject: "Sua senha foi alterada - Amore Mio",
    html,
    text: buildPlainTextContent(input),
  };
}
