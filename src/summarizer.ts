import axios from 'axios';
import { config } from './config';
import type { Article, SummaryItem } from './types';

/** 构建给 DeepSeek 的 prompt */
function buildPrompt(articles: Article[]): string {
  const sections: string[] = [
    '你是一位专业的 AI 新闻分析师。请为以下 AI 相关的文章和论文生成详细的中文摘要。',
    '',
    '## 要求',
    '- 每条摘要 3-5 句中文',
    '- 涵盖文章/论文的核心内容、关键发现和实际意义',
    '- 技术术语保留英文原文',
    '- 重点关注创新点和实用价值',
    '',
    '## 文章列表',
  ];

  const arxivArticles = articles.filter((a) => a.source === 'arxiv');
  const hnArticles = articles.filter((a) => a.source === 'hackernews');

  if (arxivArticles.length > 0) {
    sections.push('', '### 📄 ArXiv 论文');
    arxivArticles.forEach((a, i) => {
      sections.push(
        '',
        `**${i + 1}. ${a.title}**`,
        `   ID: ${a.id}`,
        `   链接: ${a.url}`,
        `   作者: ${a.authors?.join(', ') || '未知'}`,
        `   摘要: ${a.abstract?.slice(0, 800) || '无'}`,
      );
    });
  }

  if (hnArticles.length > 0) {
    sections.push('', '### 💬 Hacker News 讨论');
    hnArticles.forEach((a, i) => {
      sections.push(
        '',
        `**${i + 1}. ${a.title}**`,
        `   ID: ${a.id}`,
        `   链接: ${a.url}`,
        `   热度: ${a.points || 0} points`,
      );
    });
  }

  sections.push(
    '',
    '请以 JSON 格式输出结果，格式如下：',
    '```json',
    JSON.stringify(
      {
        summaries: [
          {
            id: '文章 ID',
            title: '文章标题',
            summary: '详细中文摘要（3-5句）',
          },
        ],
      },
      null,
      2,
    ),
    '```',
    '务必输出合法的 JSON 数组，不要包含多余文字。',
  );

  return sections.join('\n');
}

/**
 * 使用 DeepSeek API 批量生成文章摘要
 */
export async function generateSummaries(
  articles: Article[],
): Promise<Article[]> {
  if (articles.length === 0) return [];

  if (!config.llm.apiKey) {
    console.warn('[摘要] 未配置 DEEPSEEK_API_KEY，跳过摘要生成');
    return articles.map((a) => ({
      ...a,
      summary: a.abstract ? a.abstract.slice(0, 300) : a.title,
    }));
  }

  try {
    console.log(
      `[摘要] 正在调用 DeepSeek (${config.llm.model}) 为 ${articles.length} 篇文章生成摘要...`,
    );

    const response = await axios.post(
      `${config.llm.baseUrl}/chat/completions`,
      {
        model: config.llm.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的 AI 新闻摘要助手。只输出 JSON，不要包含 markdown 代码块标记或其他文字。',
          },
          { role: 'user', content: buildPrompt(articles) },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 4096,
      },
      {
        headers: {
          Authorization: `Bearer ${config.llm.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60_000,
      },
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) {
      console.warn('[摘要] DeepSeek 返回为空');
      return articles.map((a) => ({ ...a, summary: a.abstract?.slice(0, 300) || a.title }));
    }

    // 清理可能的 markdown 代码块标记
    const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*$/gm, '').trim();
    const parsed = JSON.parse(cleaned);
    const { summaries } = parsed as { summaries: SummaryItem[] };

    if (!Array.isArray(summaries)) {
      console.warn('[摘要] 返回格式异常，跳过');
      return articles.map((a) => ({ ...a, summary: a.abstract?.slice(0, 300) || a.title }));
    }

    console.log(`[摘要] 成功获取 ${summaries.length} 条摘要`);

    const summaryMap = new Map<string, string>();
    for (const s of summaries) {
      summaryMap.set(s.id, s.summary);
    }

    return articles.map((a) => ({
      ...a,
      summary: summaryMap.get(a.id) || a.abstract?.slice(0, 300) || a.title,
    }));
  } catch (err: any) {
    console.error('[摘要] 生成失败:', err.message);

    if (err.response) {
      console.error(`   HTTP ${err.response.status}:`, JSON.stringify(err.response.data).slice(0, 200));
    }

    return articles.map((a) => ({
      ...a,
      summary: a.abstract ? a.abstract.slice(0, 300) : `未能生成摘要，请查看原文: ${a.url}`,
    }));
  }
}
