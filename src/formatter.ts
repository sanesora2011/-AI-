import type { Article } from './types';

/** 格式化日期为中文格式 */
function formatDate(date?: string): string {
  const d = date ? new Date(date) : new Date();
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 转义 HTML 特殊字符 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 生成文章卡片 HTML */
function renderArticleCard(
  article: Article,
  accentColor: string,
  bgColor: string,
): string {
  const summary = article.summary
    ? escapeHtml(article.summary)
    : '暂无摘要';

  const metaParts: string[] = [];
  if (article.authors && article.authors.length > 0) {
    metaParts.push(`👤 ${escapeHtml(article.authors.slice(0, 3).join(', '))}${article.authors.length > 3 ? ' 等' : ''}`);
  }
  if (article.points !== undefined) {
    metaParts.push(`⭐ ${article.points} points`);
  }

  return `
    <div style="margin-bottom: 18px; padding: 16px 18px; background: ${bgColor}; border-radius: 10px; border-left: 4px solid ${accentColor};">
      <h3 style="font-size: 15px; margin: 0 0 6px; line-height: 1.4;">
        <a href="${escapeHtml(article.url)}" style="color: #333; text-decoration: none; font-weight: 600;">${escapeHtml(article.title)}</a>
      </h3>
      ${metaParts.length > 0 ? `<p style="font-size: 12px; color: ${accentColor}; margin: 0 0 8px;">${metaParts.join(' · ')}</p>` : ''}
      <p style="font-size: 14px; color: #444; line-height: 1.7; margin: 0; word-break: break-word;">${summary}</p>
    </div>`;
}

/**
 * 生成邮件 HTML 正文
 */
export function formatEmail(articles: Article[]): string {
  const today = formatDate();

  const arxivArticles = articles.filter((a) => a.source === 'arxiv');
  const hnArticles = articles.filter((a) => a.source === 'hackernews');
  const totalCount = articles.length;

  const arxivHtml = arxivArticles
    .map((a) => renderArticleCard(a, '#667eea', '#f8f9ff'))
    .join('\n');

  const hnHtml = hnArticles
    .map((a) => renderArticleCard(a, '#ff6600', '#fff8f0'))
    .join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI 每日简报 ${formatDate()}</title>
</head>
<body style="margin: 0; padding: 0; background: #f0f2f5; font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f0f2f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="max-width: 640px; width: 100%; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">

          <!-- ═══ Header ═══ -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 36px 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 2px;">🤖 AI 每日简报</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 10px 0 0; font-size: 14px; line-height: 1.5;">
                ${today} · 共 ${totalCount} 条<br>
                精选 ArXiv 论文与 Hacker News 热门讨论
              </p>
            </td>
          </tr>

          <!-- ═══ ArXiv Section ═══ -->
          ${arxivArticles.length > 0 ? `
          <tr>
            <td style="padding: 28px 32px 8px;">
              <h2 style="font-size: 18px; color: #333; margin: 0 0 16px; padding-bottom: 10px; border-bottom: 2px solid #667eea;">
                📄 ArXiv 最新论文 <span style="font-size: 13px; color: #999; font-weight: 400;">（${arxivArticles.length} 篇）</span>
              </h2>
              ${arxivHtml}
            </td>
          </tr>
          ` : ''}

          <!-- ═══ HN Section ═══ -->
          ${hnArticles.length > 0 ? `
          <tr>
            <td style="padding: ${arxivArticles.length > 0 ? '8px 32px 24px' : '28px 32px 24px'};">
              <h2 style="font-size: 18px; color: #333; margin: 0 0 16px; padding-bottom: 10px; border-bottom: 2px solid #ff6600;">
                💬 Hacker News 热门讨论 <span style="font-size: 13px; color: #999; font-weight: 400;">（${hnArticles.length} 条）</span>
              </h2>
              ${hnHtml}
            </td>
          </tr>
          ` : ''}

          <!-- ═══ Empty State ═══ -->
          ${articles.length === 0 ? `
          <tr>
            <td style="padding: 60px 32px; text-align: center;">
              <p style="font-size: 48px; margin: 0 0 16px;">📭</p>
              <p style="font-size: 16px; color: #666; margin: 0;">今日暂无新的 AI 动态更新</p>
              <p style="font-size: 13px; color: #999; margin: 8px 0 0;">明天同一时间将再次为您检索</p>
            </td>
          </tr>
          ` : ''}

          <!-- ═══ Footer ═══ -->
          <tr>
            <td style="padding: 20px 32px; background: #f9fafb; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee;">
              <p style="margin: 0;">本邮件由 AI 简报系统自动生成 · 每日上午 9:00 发送</p>
              <p style="margin: 4px 0 0; color: #bbb;">数据来源：<a href="https://arxiv.org/list/cs.AI/recent" style="color: #999;">ArXiv</a> · <a href="https://news.ycombinator.com/" style="color: #999;">Hacker News</a></p>
              <p style="margin: 4px 0 0;">🤖 摘要由 Claude API 生成 · 如有疑问请回复本邮件</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
