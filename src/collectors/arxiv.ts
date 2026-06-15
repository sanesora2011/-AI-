import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import type { Article } from '../types';
import { config } from '../config';

const ARXIV_API_URL = 'http://export.arxiv.org/api/query';

/** XML 解析器 */
const parser = new XMLParser({
  removeNSPrefix: true,
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) =>
    ['entry', 'author', 'link', 'category'].includes(name),
});

/** 从 ArXiv ID 中提取纯 ID（去掉版本号） */
function normalizeArxivId(rawId: string): string {
  const m = rawId.match(/arxiv\.org\/abs\/(.+?)(?:v\d+)?$/i);
  return m ? m[1] : rawId;
}

/** 从 HTML 标签中去除标签，提取纯文本 */
function stripTags(html: string): string {
  return html.replace(/<\/?[^>]+(>|$)/g, '').trim();
}

export interface ArxivPaper {
  id: string;
  title: string;
  url: string;
  authors: string[];
  abstract: string;
  publishedAt: string;
}

/**
 * 采集 ArXiv cs.AI 分类下最新论文
 */
export async function collectArxiv(): Promise<Article[]> {
  try {
    const response = await axios.get(ARXIV_API_URL, {
      params: {
        search_query: 'cat:cs.AI',
        sortBy: 'submittedDate',
        sortOrder: 'descending',
        max_results: config.maxArticles.arxiv,
      },
      timeout: 30_000,
    });

    const xml = response.data;
    const result = parser.parse(xml);
    const entries = result.feed?.entry;

    if (!entries || !Array.isArray(entries)) {
      console.log('[ArXiv] 没有获取到论文');
      return [];
    }

    const papers: ArxivPaper[] = entries.map((entry: any) => {
      const id = normalizeArxivId(entry.id || '');
      const authors = Array.isArray(entry.author)
        ? entry.author.map((a: any) => a.name || a['name'] || '')
        : entry.author
          ? [entry.author.name || entry.author['name'] || '']
          : [];

      return {
        id,
        title: stripTags(entry.title || ''),
        url: `https://arxiv.org/abs/${id}`,
        authors,
        abstract: stripTags(entry.summary || ''),
        publishedAt: entry.published || entry.updated || '',
      };
    });

    console.log(`[ArXiv] 获取到 ${papers.length} 篇论文`);
    return papers.map((p) => ({
      id: p.id,
      title: p.title,
      url: p.url,
      source: 'arxiv' as const,
      authors: p.authors,
      abstract: p.abstract,
      publishedAt: p.publishedAt,
    }));
  } catch (err: any) {
    console.error('[ArXiv] 采集失败:', err.message);
    return [];
  }
}
