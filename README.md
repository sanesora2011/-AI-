# AI 每日简报 📬

自动采集 ArXiv 最新 AI 论文 + Hacker News AI 热门讨论，用 DeepSeek 生成中文摘要，每天 9:00 发邮件到你的邮箱。

**无需电脑开机**——通过 GitHub Actions 免费在云端运行。

---

## 🚀 云部署（推荐，无需开机）

### 第一步：推送代码到 GitHub

```bash
# 在 article-mailer 目录下初始化 git
cd D:/claude code/article-mailer
git init
git add .
git commit -m "init: AI 每日简报系统"

# 先在 GitHub 上新建一个仓库（不要勾选 README），然后：
git remote add origin https://github.com/你的用户名/你的仓库名.git
git branch -M main
git push -u origin main
```

### 第二步：配置 GitHub Secrets（密钥）

在 GitHub 仓库页面 → **Settings → Secrets and variables → Actions → New repository secret**，依次添加以下 4 个密钥：

| Secret 名称 | 值 |
|------------|----|
| `SMTP_USER` | `14795010951@163.com` |
| `SMTP_PASS` | 你的 163 邮箱 **授权码**（16位字母，不是登录密码） |
| `TO_EMAIL` | `14795010951@163.com` |
| `DEEPSEEK_API_KEY` | 你的 DeepSeek API Key（从 https://platform.deepseek.com/api_keys 获取） |

### 第三步：手动触发测试

1. 在 GitHub 仓库页面点击 **Actions** 标签
2. 左侧选择 **AI 每日简报**
3. 点击 **Run workflow** → 绿色按钮
4. 等待几十秒，去邮箱查看是否收到邮件

测试通过后，系统就会**每天自动运行**——北京时间每天 9:00 采集并发送，你什么都不用管。

> **为什么免费？** GitHub Actions 免费额度：每个月 2000 分钟，这个任务每次跑不到 30 秒，30天也就 15 分钟，永远用不完。

---

## 💻 本地运行（调试用）

### 安装依赖

```bash
cd D:/claude code/article-mailer
npm install
```

### 配置 .env

```bash
cp .env.example .env
```

编辑 `.env` 文件填入密钥。

### 测试运行

```bash
npm run test-run
```

立即执行一次完整的：**采集 → 去重 → DeepSeek 摘要 → 发邮件**。

---

## 📦 项目结构

```
article-mailer/
├── .github/workflows/daily-digest.yml   ← GitHub Actions 定时任务
├── src/
│   ├── index.ts            # 主入口
│   ├── config.ts           # 配置
│   ├── types.ts            # 类型定义
│   ├── state.ts            # 去重状态管理
│   ├── collectors/
│   │   ├── arxiv.ts        # ArXiv 论文采集
│   │   └── hackernews.ts   # Hacker News 采集
│   ├── summarizer.ts       # DeepSeek 摘要生成
│   ├── formatter.ts        # 邮件 HTML 排版
│   └── mailer.ts           # 邮件发送
├── data/                   # 去重状态文件（GitHub Actions 会缓存）
├── .env.example
├── package.json
└── tsconfig.json
```

## ⚙️ 数据流

```
定时触发 (9:00 UTC+8)
    ↓
ArXiv API ──→ 采集最新论文 ──→ ┐
Hacker News ─→ 采集AI热帖 ──→ ──→ 去重 ──→ DeepSeek 摘要 ──→ HTML排版 ──→ 发邮件
                                   ↑
                            data/state.json (缓存已发ID)
```

## 🎨 自定义

| 需求 | 修改位置 |
|------|---------|
| 修改发送时间 | 修改 `.github/workflows/daily-digest.yml` 中的 `cron` 字段 |
| 增加采集数量 | `src/config.ts` 中的 `maxArticles` |
| 更换 AI 模型 | 修改 `.env` 中的 `LLM_MODEL` |
| 增加新闻来源 | 在 `src/collectors/` 下新增，在 `index.ts` 集成 |
