/**
 * 验证脚本 — 测试采集器和排版器，不需要任何 API 密钥
 * 运行: npx tsx src/verify.ts
 */
import { collectArxiv } from './collectors/arxiv';
import { collectHackerNews } from './collectors/hackernews';
import { formatEmail } from './formatter';
import fs from 'fs';
import path from 'path';

async function verify() {
  console.log('═'.repeat(50));
  console.log('🔍 AI 每日简报 — 系统验证');
  console.log('═'.repeat(50));

  // ── 1. 验证 ArXiv 采集器 ──
  console.log('\n📡 测试 ArXiv 采集器...');
  const arxivStart = Date.now();
  const arxivArticles = await collectArxiv();
  const arxivTime = Date.now() - arxivStart;
  console.log(`   ✅ 成功 | 采集 ${arxivArticles.length} 篇论文 | 耗时 ${arxivTime}ms`);
  if (arxivArticles.length > 0) {
    console.log(`   第一条: ${arxivArticles[0].title.slice(0, 60)}...`);
    console.log(`   作者数: ${arxivArticles[0].authors?.length || 0}`);
  }

  // ── 2. 验证 Hacker News 采集器 ──
  console.log('\n📡 测试 Hacker News 采集器...');
  const hnStart = Date.now();
  const hnArticles = await collectHackerNews();
  const hnTime = Date.now() - hnStart;
  console.log(`   ✅ 成功 | 采集 ${hnArticles.length} 条热帖 | 耗时 ${hnTime}ms`);
  if (hnArticles.length > 0) {
    console.log(`   第一条: ${hnArticles[0].title.slice(0, 60)}...`);
  }

  // ── 3. 验证排版器 ──
  console.log('\n🎨 测试邮件排版器...');
  const allArticles = [...arxivArticles, ...hnArticles];
  const html = formatEmail(allArticles);
  const outputPath = path.resolve('./data/test-output.html');
  fs.writeFileSync(outputPath, html, 'utf-8');
  console.log(`   ✅ 成功 | ${allArticles.length} 条内容渲染为 HTML | ${html.length} 字节`);
  console.log(`   预览文件: ${outputPath}`);
  console.log('   在浏览器中打开即可查看邮件效果');

  // ── 4. 全局结论 ──
  console.log('\n═'.repeat(50));
  console.log('📋 验证总结');
  console.log('═'.repeat(50));

  const checks = [
    ['ArXiv 采集', arxivArticles.length > 0, `${arxivArticles.length} 篇`],
    ['HN 采集', hnArticles.length > 0, `${hnArticles.length} 条`],
    ['HTML 排版', html.length > 0, `${html.length} 字节`],
  ];

  console.log('\n| 项目 | 状态 | 数据 |');
  console.log('|------|------|------|');
  for (const [name, ok, detail] of checks) {
    console.log(`| ${name} | ${ok ? '✅ 通过' : '❌ 失败'} | ${detail} |`);
  }

  const allPass = checks.every((c) => c[1]);
  console.log(`\n${allPass ? '✅ 全部验证通过！' : '❌ 存在失败项'}`);

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes('占位')) {
    console.log('\n⚠️  提示: ANTHROPIC_API_KEY 未配置，摘要功能未验证');
    console.log('   配置后运行 npm run test-run 即可测试完整流程');
  }

  if (!process.env.SMTP_PASS || process.env.SMTP_PASS.includes('占位')) {
    console.log('⚠️  提示: SMTP_PASS 未配置，邮件发送功能未验证');
    console.log('   配置后在 GitHub Secrets 中设置即可');
  }
}

verify().catch((err) => {
  console.error('❌ 验证失败:', err);
  process.exit(1);
});
