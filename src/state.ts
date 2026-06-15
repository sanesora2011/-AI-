import fs from 'fs';
import path from 'path';
import { config } from './config';
import type { AppState } from './types';

const DEFAULT_STATE: AppState = {
  sentIds: { arxiv: [], hackernews: [] },
  lastRun: null,
};

/** 读取状态文件 */
export function loadState(): AppState {
  try {
    const dir = path.dirname(config.stateFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(config.stateFile)) {
      saveState(DEFAULT_STATE);
      return DEFAULT_STATE;
    }
    const raw = fs.readFileSync(config.stateFile, 'utf-8');
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

/** 写入状态文件 */
export function saveState(state: AppState): void {
  const dir = path.dirname(config.stateFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(config.stateFile, JSON.stringify(state, null, 2), 'utf-8');
}

/**
 * 过滤出未发送过的文章 ID，并更新状态
 * @returns 未发送过的文章列表
 */
export function filterNewArticles<T extends { id: string }>(
  articles: T[],
  source: 'arxiv' | 'hackernews',
): T[] {
  const state = loadState();
  const sentSet = new Set(state.sentIds[source]);
  const newArticles = articles.filter((a) => !sentSet.has(a.id));

  if (newArticles.length > 0) {
    // 只保留最近 500 条历史 ID，防止状态文件无限膨胀
    const maxHistory = 500;
    const updatedIds = [...state.sentIds[source], ...newArticles.map((a) => a.id)];
    state.sentIds[source] = updatedIds.slice(-maxHistory);
    state.lastRun = new Date().toISOString();
    saveState(state);
  }

  return newArticles;
}
