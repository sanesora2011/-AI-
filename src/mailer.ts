import nodemailer from 'nodemailer';
import dns from 'dns/promises';
import { config } from './config';
import { formatEmail } from './formatter';
import type { Article } from './types';

/** 解析 SMTP 主机域名为 IP 地址（解决部分环境 DNS 超时问题） */
async function resolveSmtpHost(host: string): Promise<string> {
  try {
    const addrs = await dns.lookup(host, { all: true });
    const ip = addrs[0]?.address;
    if (ip) {
      console.log(`[邮件] DNS 解析: ${host} → ${ip}`);
      return ip;
    }
  } catch {
    // fallback: 直接用域名
  }
  return host;
}

/** 创建 SMTP 传输器 */
async function createTransporter() {
  const { host, port, secure, user, pass } = config.smtp;

  if (!user || !pass) {
    throw new Error('SMTP 未配置：请检查 SMTP_USER 和 SMTP_PASS 环境变量');
  }

  // 解析域名为 IP（规避 dns.resolve4 超时问题）
  const ip = await resolveSmtpHost(host);

  return nodemailer.createTransport({
    host: ip,
    port,
    secure,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
      // 告诉 TLS 握手时用哪个域名（IP 直连但证书验证用原域名）
      servername: host,
    },
  });
}

/**
 * 发送 AI 每日简报邮件
 * @param articles 文章列表
 * @returns 是否成功
 */
export async function sendDigest(articles: Article[]): Promise<boolean> {
  try {
    const transporter = await createTransporter();
    const html = formatEmail(articles);

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const totalCount = articles.length;

    const info = await transporter.sendMail({
      from: `"AI 每日简报" <${config.fromEmail}>`,
      to: config.toEmail,
      subject: `🤖 AI 每日简报 ${dateStr} — ${totalCount} 条最新动态`,
      html,
      // 纯文本备用
      text: `AI 每日简报 — ${dateStr}\n共 ${totalCount} 条 AI 相关动态\n\n详情请查看 HTML 版本邮件或访问原文链接。`,
    });

    console.log(`[邮件] 发送成功: ${info.messageId}`);
    return true;
  } catch (err: any) {
    console.error('[邮件] 发送失败:', err.message);
    if (err.code === 'EAUTH') {
      console.error('[邮件] ⚠️ SMTP 认证失败，请检查授权码是否正确');
    } else if (err.code === 'ESOCKET') {
      console.error('[邮件] ⚠️ 无法连接 SMTP 服务器，请检查网络和端口设置');
    }
    return false;
  }
}
