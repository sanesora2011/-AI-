/** 文章来源 */
export type ArticleSource = 'arxiv' | 'hackernews';

/** 单篇文章 */
export interface Article {
  /** 唯一 ID（用于去重） */
  id: string;
  /** 标题 */
  title: string;
  /** 原文链接 */
  url: string;
  /** 来源 */
  source: ArticleSource;
  /** 摘要（Claude 生成） */
  summary?: string;
  /** 发布时间 */
  publishedAt?: string;
  /** 作者列表（ArXiv） */
  authors?: string[];
  /** 原始摘要/简介 */
  abstract?: string;
  /** HN 点数 */
  points?: number;
}

/** 摘要结果（Claude 结构化输出） */
export interface SummaryItem {
  id: string;
  title: string;
  summary: string;
}

/** 持久化状态 */
export interface AppState {
  sentIds: {
    arxiv: string[];
    hackernews: string[];
  };
  lastRun: string | null;
}
