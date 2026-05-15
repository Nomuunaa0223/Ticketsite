import nodemailer from "nodemailer";
import { env } from "@/lib/env";

function createTransport() {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

type OrganizerCredentialsEmailInput = {
  to: string;
  contactName: string;
  companyName: string;
  loginEmail: string;
  registrationCode: string;
  oneTimePassword: string;
};

type PasswordResetEmailInput = {
  to: string;
  fullName: string;
  resetUrl: string;
};

export async function sendPasswordResetEmail(input: PasswordResetEmailInput) {
  const transport = createTransport();

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#07090f;color:#e8eaf0;border-radius:12px;padding:32px 28px">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#ff7224">TIXORA</p>
      <h1 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#ffffff">Нууц үг шинэчлэх</h1>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#9ba3b5">
        Сайн байна уу, <strong style="color:#ffffff">${input.fullName}</strong>!<br/>
        Нууц үг шинэчлэх хүсэлт ирсэн тул доорх товчийг дарна уу. Холбоос <strong style="color:#ffffff">1 цаг</strong> хүчинтэй.
      </p>
      <a href="${input.resetUrl}" style="display:inline-block;background:#ff7224;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px;letter-spacing:0.06em">
        НУУЦ ҮГ ШИНЭЧЛЭХ
      </a>
      <p style="margin:24px 0 0;font-size:12px;color:#4b5563">
        Хэрэв та энэ хүсэлт илгээгээгүй бол үл тоомсорлоно уу.
      </p>
    </div>
  `;

  if (transport) {
    await transport.sendMail({
      from: `"TIXORA" <${env.SMTP_USER}>`,
      to: input.to,
      subject: "TIXORA — Нууц үг шинэчлэх холбоос",
      html,
    });
  } else {
    console.log("[mail:password-reset]", { to: input.to, resetUrl: input.resetUrl });
  }
}

export async function sendOrganizerCredentialsEmail(input: OrganizerCredentialsEmailInput) {
  const transport = createTransport();

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#07090f;color:#e8eaf0;border-radius:12px;padding:32px 28px">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#ff7224">TIXORA</p>
      <h1 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#ffffff">Тавтай морил, ${input.contactName}!</h1>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#9ba3b5">
        <strong style="color:#ffffff">${input.companyName}</strong> байгууллагын органайзер бүртгэл амжилттай үүслээ.
        Дараах мэдээллээр <strong style="color:#ffffff">tixora.mn</strong> сайтад нэвтрэн орно уу.
      </p>

      <div style="background:#111827;border-radius:10px;padding:20px 24px;margin-bottom:24px">
        <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#6b7280">Нэвтрэх мэдээлэл</p>
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#9ba3b5;width:140px">Имэйл хаяг:</td>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#ffffff">${input.loginEmail}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#9ba3b5;vertical-align:middle">Байгуулаллын бүртгэлийн код:</td>
            <td style="padding:6px 0">
              <span style="font-size:26px;font-weight:800;letter-spacing:0.22em;color:#ff7224">${input.registrationCode}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#9ba3b5;vertical-align:middle">Нэг удаагийн нууц үг:</td>
            <td style="padding:6px 0">
              <span style="font-size:26px;font-weight:800;letter-spacing:0.22em;color:#ff7224">${input.oneTimePassword}</span>
            </td>
          </tr>
        </table>
      </div>

      <p style="margin:0 0 8px;font-size:13px;color:#9ba3b5">
        Анх нэвтэрсний дараа нууц үгээ заавал өөрчилнө үү.
      </p>
      <p style="margin:0;font-size:12px;color:#4b5563">
        Хэрэв энэ имэйл танд буруу ирсэн бол үл тоомсорлоно уу.
      </p>
    </div>
  `;

  if (transport) {
    await transport.sendMail({
      from: `"TIXORA" <${env.SMTP_USER}>`,
      to: input.to,
      subject: `TIXORA — Органайзер бүртгэл нэвтрэх мэдээлэл`,
      html,
    });
  } else {
    console.log("[mail:organizer-credentials]", {
      to: input.to,
      loginEmail: input.loginEmail,
      registrationCode: input.registrationCode,
      oneTimePassword: input.oneTimePassword,
    });
  }
}
