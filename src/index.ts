import cron from 'node-cron';
import { config } from './config';
import { loadState, filterNewArticles } from './state';
import { collectArxiv } from './collectors/arxiv';
import { collectHackerNews } from './collectors/hackernews';
import { generateSummaries } from './summarizer';
import { sendDigest } from './mailer';
import type { Article } from './types';

/** 完整的采集 → 摘要 → 发送流程 */
async function runPipeline(): Promise<void> {
  console.log('═══════════════════════════════════════');
  console.log(`🤖 AI 每日简报 — ${new Date().toLocaleString('zh-CN')}`);
  console.log('═══════════════════════════════════════');

  // 1. 采集
  console.log('\n📡 开始采集...');
  const [arxivArticles, hnArticles] = await Promise.all([
    collectArxiv(),
    collectHackerNews(),
  ]);

  // 2. 去重（过滤已发送过的）
  console.log('\n🔍 去重中...');
  const newArxiv = filterNewArticles(arxivArticles, 'arxiv');
  const newHN = filterNewArticles(hnArticles, 'hackernews');
  const allNew: Article[] = [...newArxiv, ...newHN];

  console.log(`    ArXiv: ${arxivArticles.length} 篇 → ${newArxiv.length} 篇新`);
  console.log(`    HN:    ${hnArticles.length} 条 → ${newHN.length} 条新`);
  console.log(`    总计: ${allNew.length} 条新内容`);

  if (allNew.length === 0) {
    console.log('\n📭 今日无新内容，跳过摘要和发送');
    // 即使没有新文章，也发送一封空邮件告知用户
    const state = loadState();
    if (state.lastRun) {
      console.log('    发送空通知邮件...');
      await sendDigest([]);
    } else {
      console.log('    首次运行且无内容，跳过邮件发送');
    }
    return;
  }

  // 3. 生成摘要
  console.log('\n✍️ 生成摘要中...');
  const summarized = await generateSummaries(allNew);

  // 4. 发送邮件
  console.log('\n📧 发送邮件...');
  const success = await sendDigest(summarized);

  if (success) {
    console.log('\n✅ 今日简报已完成！');
  } else {
    console.log('\n❌ 邮件发送失败');
  }
}

/** 主函数 */
async function main() {
  console.log(`🚀 AI 每日简报系统 v1.0.0`);
  console.log(`   收件人: ${config.toEmail}`);
  console.log(`   定时:   ${config.cronSchedule}`);
  console.log(`   模式:   ${config.isTestRun ? '一次性 (--once)' : '持续运行 (cron)'}`);
  console.log('');

  if (config.isTestRun) {
    // 一次性运行（测试或 Windows 计划任务）
    await runPipeline();
    process.exit(0);
  }

  // 验证配置
  if (!config.llm.apiKey && !config.smtp.user) {
    console.warn('⚠️  未配置 DEEPSEEK_API_KEY 和 SMTP，摘要和邮件将不可用');
  } else if (!config.llm.apiKey) {
    console.warn('⚠️  未配置 DEEPSEEK_API_KEY，摘要将使用原始内容');
  } else if (!config.smtp.user) {
    console.warn('⚠️  未配置 SMTP，邮件将无法发送');
  }

  // 启动时立即运行一次（首次部署）
  console.log('⏳ 首次运行...');
  await runPipeline();

  // 设置定时任务
  const isValid = cron.validate(config.cronSchedule);
  if (!isValid) {
    console.error(`❌ Cron 表达式无效: ${config.cronSchedule}`);
    process.exit(1);
  }

  console.log(`\n⏰ 定时任务已设置: ${config.cronSchedule}`);
  cron.schedule(config.cronSchedule, async () => {
    console.log(`\n⏰ 定时触发: ${new Date().toLocaleString('zh-CN')}`);
    await runPipeline();
  });

  // 保持进程存活
  console.log('📡 等待下次触发中... (按 Ctrl+C 停止)\n');
}

main().catch((err) => {
  console.error('❌ 系统错误:', err);
  process.exit(1);
});
