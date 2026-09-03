import { renderStandardEmailLayout } from "../layout/standard-email-layout.template";
import { EMAIL_BRAND } from "../layout/email-brand";

interface UserOnboardingTemplateInput {
  name: string;
  username: string;
  temporaryPassword: string;
  appUrl: string;
}

function buildPlainTextContent({
  name,
  username,
  temporaryPassword,
  appUrl,
}: UserOnboardingTemplateInput): string {
  return [
    `Olá, ${name}.`,
    "",
    "Sua conta na Amore Mio foi criada com sucesso.",
    `Usuário: ${username}`,
    `Senha temporária: ${temporaryPassword}`,
    "",
    "No primeiro acesso, a troca da senha será obrigatória.",
    `Acesse: ${appUrl}`,
  ].join("\n");
}

export function buildUserOnboardingEmail(input: UserOnboardingTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = input.name.split(" ")[0] || input.name;

  const contentHtml = `
    <p style="margin:0 0 12px 0;color:${EMAIL_BRAND.textMuted};">Sua conta na plataforma foi criada e já está pronta para acesso.</p>
    <p style="margin:0 0 12px 0;color:${EMAIL_BRAND.textMuted};">Use as credenciais abaixo no primeiro login:</p>
    <div style="background:${EMAIL_BRAND.cardBackground};border:1px solid ${EMAIL_BRAND.border};border-radius:10px;padding:14px 16px;margin:8px 0 16px 0;">
      <p style="margin:0 0 8px 0;color:${EMAIL_BRAND.text};"><strong style="color:${EMAIL_BRAND.accentDark};">Usuário:</strong> ${input.username}</p>
      <p style="margin:0;color:${EMAIL_BRAND.text};"><strong style="color:${EMAIL_BRAND.accentDark};">Senha temporária:</strong> ${input.temporaryPassword}</p>
    </div>
    <p style="margin:0;color:${EMAIL_BRAND.textMuted};">Por segurança, a troca de senha será obrigatória no primeiro acesso.</p>
  `;

  const html = renderStandardEmailLayout({
    title: "Bem-vindo(a) à Amore Mio",
    preheader: "Sua conta foi criada com sucesso.",
    heading: "Bem-vindo(a) à Amore Mio",
    greeting: `Olá, ${firstName}!`,
    contentHtml,
    ctaLabel: "Acessar plataforma",
    ctaUrl: input.appUrl,
    logoUrl: `${input.appUrl.replace(/\/$/, "")}/amoremio-logo-96.png`,
    footerNote:
      "Este email contém dados de primeiro acesso. Não compartilhe esta mensagem.",
  });

  return {
    subject: "Sua conta foi criada - Amore Mio",
    html,
    text: buildPlainTextContent(input),
  };
}
