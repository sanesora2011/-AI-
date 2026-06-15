import axios from 'axios';
import type { Article } from '../types';
import { config } from '../config';

const HN_ALGOLIA_URL = 'https://hn.algolia.com/api/v1/search_by_date';

/** AI 相关关键词（用于过滤 HN 帖子） */
const AI_KEYWORDS = [
  'AI', 'artificial intelligence', 'machine learning', 'deep learning',
  'large language model', 'LLM', 'GPT', 'ChatGPT', 'OpenAI', 'Claude',
  'Anthropic', 'neural network', 'transformer', 'diffusion model',
  'Stable Diffusion', 'RLHF', 'RAG', 'agent', 'multimodal',
  'computer vision', 'NLP', 'natural language', 'fine-tuning',
  'PyTorch', 'TensorFlow', 'Hugging Face', 'langchain',
  'GPU', 'CUDA', 'training', 'inference',
];

/** 检查标题是否与 AI 相关 */
function isAiRelated(title: string): boolean {
  const lower = title.toLowerCase();
  return AI_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

export interface HackerNewsStory {
  id: string;
  title: string;
  url: string;
  points: number;
  createdAt: string;
}

/**
 * 采集 Hacker News 上 AI 相关的热门帖子
 */
export async function collectHackerNews(): Promise<Article[]> {
  try {
    // 获取过去 24 小时的 AI 相关帖子
    const oneDayAgo = Math.floor(Date.now() / 1000) - 86_400;

    const response = await axios.get(HN_ALGOLIA_URL, {
      params: {
        query: 'AI',
        tags: 'story',
        hitsPerPage: 50,
        numericFilters: `created_at_i>${oneDayAgo}`,
      },
      timeout: 30_000,
    });

    const hits = response.data?.hits;
    if (!Array.isArray(hits) || hits.length === 0) {
      console.log('[HN] 没有获取到帖子');
      return [];
    }

    // 过滤 AI 相关 + 非空标题
    const stories: HackerNewsStory[] = hits
      .filter((h: any) => h.title && isAiRelated(h.title))
      .map((h: any) => ({
        id: String(h.objectID || ''),
        title: h.title || '',
        url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
        points: h.points || h.points || 0,
        createdAt: h.created_at || '',
      }))
      .slice(0, config.maxArticles.hackernews);

    console.log(`[HN] 获取到 ${stories.length} 条 AI 相关帖子`);
    return stories.map((s) => ({
      id: `hn-${s.id}`,
      title: s.title,
      url: s.url,
      source: 'hackernews' as const,
      points: s.points,
      publishedAt: s.createdAt,
    }));
  } catch (err: any) {
    console.error('[HN] 采集失败:', err.message);
    return [];
  }
}
