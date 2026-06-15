import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.163.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE !== 'false',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  /** 发件人邮箱 */
  fromEmail: process.env.SMTP_USER || '',
  /** 收件人邮箱 */
  toEmail: process.env.TO_EMAIL || '14795010951@163.com',
  llm: {
    provider: 'deepseek',
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    model: process.env.LLM_MODEL || 'deepseek-chat',
    baseUrl: 'https://api.deepseek.com/v1',
  },
  /** 状态文件路径 */
  stateFile: path.resolve(process.env.STATE_FILE || './data/state.json'),
  /** Cron 表达式，默认每天 9:00 */
  cronSchedule: process.env.CRON_SCHEDULE || '0 9 * * *',
  /** 是否一次性运行（用于测试或 Windows 计划任务） */
  isTestRun: process.argv.includes('--once'),
  /** 各来源最大采集数量 */
  maxArticles: {
    arxiv: 15,
    hackernews: 10,
  },
};
