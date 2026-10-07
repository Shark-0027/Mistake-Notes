# Mistake Notes

简体中文 | [English](README.md)

[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=0B1220)](https://react.dev/)

Mistake Notes 是一个面向学生的错题复习应用。每名学生只能访问自己的错题记录，可按课程、知识点和题目关键词筛选，查看原始作答与历史批改反馈，并维护带版本历史的错因、复习笔记和笔记图片。宽屏下提供题目与笔记双栏工作区，以及可拖动、可收起和可关闭的应用内浮动笔记小窗。

## Demo 演示视频

<video controls muted playsinline src="docs/demo.mp4"></video>

录屏覆盖登录、关键词筛选、打开记录、保存笔记、使用并拖动浮动笔记小窗、创建命名版本和查看历史版本。

仓库内的 `docs/demo.mp4` 由项目自身脚本生成：

```bash
cd frontend
npm run demo:record
```

脚本使用 Playwright 的 `recordVideo` 录制 1920x1080 视口，并输出 `docs/demo.mp4`。本机存在 `ffmpeg` 时直接转码，否则通过 `linuxserver/ffmpeg` Docker 镜像转换。可用 `CHROME_PATH` 指定本机 Chrome，或用 `FFMPEG_PATH` 指定 ffmpeg；未安装 Playwright 浏览器时，脚本会优先尝试本机 Chrome。

## Features 功能特性

- 基于 session 的登录认证，密码使用 Argon2 哈希，写请求带 CSRF 防护。
- 详情、笔记、版本和图片接口均执行严格的逐学生归属校验。
- 支持课程、知识点和题目关键词筛选；课程 API 同时接受 `course` 与 `courseId`。
- Markdown 与 KaTeX 渲染支持公式片段级降级，单个公式异常不会导致整段题目回退为源码。
- 历史 HTML 作答通过 DOMPurify 清洗后展示。
- 错因和复习笔记使用显式保存；空字符串是有效内容，重新登录或重建容器后仍保持为空。
- 笔记版本历史支持命名、创建、查看、重命名和恢复。
- 笔记图片按原始字节上传，不做压缩；图片读取受权限保护，并通过命名卷持久化。
- 详情页在宽屏下使用 sticky 笔记栏，并提供可拖动、可收起的浮动笔记小窗。
- 使用共享 CSS token 提供明暗双主题。

## Tech Stack 技术栈

- 后端：Python 3.12、FastAPI、SQLAlchemy 2、Pydantic、Uvicorn。
- 数据库：PostgreSQL 16。
- 前端：React 18、TypeScript、Vite、Ant Design、Lucide icons。
- 公式与文本：react-markdown、remark-math、rehype-katex、KaTeX、DOMPurify。
- 测试与自动化：pytest、Playwright Core、Node.js 验收脚本。
- 交付打包：Docker Compose、`uv.lock`、`package-lock.json`。

运行时不依赖 CDN。前端资源和字体由 Vite 打包进应用镜像。

## Quick Start 快速开始

前置条件：Docker Desktop 或带 Docker Compose v2 的 Docker Engine。

```bash
cp .env.example .env
docker compose up --build
```

打开 <http://127.0.0.1:8000>。首次启动会等待 PostgreSQL 就绪，按 JSON Schema 校验 `dataset.json`，创建数据表并执行轻量兼容迁移，然后幂等写入数据集。

以下账号仅用于本地验收和演示，密码均为 `ExamOnly_2026!`。

| 用户名 | 学生 | 记录数 |
|---|---|---:|
| `student_001` | Example Student 001 | 5 |
| `student_002` | Example Student 002 | 1 |
| `student_003` | Example Student 003 | 1 |
| `student_004` | Example Student 004 | 2 |
| `student_005` | Example Student 005 | 1 |
| `student_006` | Example Student 006 | 2 |
| `student_007` | Example Student 007 | 2 |
| `student_008` | Example Student 008 | 1 |
| `student_009` | Example Student 009 | 1 |
| `student_010` | Example Student 010 | 1 |
| `student_011` | Example Student 011 | 1 |
| `student_012` | Example Student 012 | 1 |
| `student_013` | Example Student 013 | 1 |

## Configuration 配置

配置通过环境变量提供。不要提交真实密钥。

| 变量 | 用途 | 示例 |
|---|---|---|
| `DATABASE_URL` | 应用使用的 SQLAlchemy 数据库连接 | `postgresql+psycopg://mistake_notes:...@db:5432/mistake_notes` |
| `SESSION_SECRET` | 签名 session cookie；开发环境之外必须替换本地默认值 | `replace-with-a-long-random-secret` |
| `NOTE_IMAGE_DIR` | 原始笔记图片文件目录 | `/app/note_images` |
| `FRONTEND_DIST` | 构建后的前端目录 | `/app/frontend_dist` |
| `APP_ENV` | 设为 `production` 时启用生产 cookie 行为 | `development` |
| `POSTGRES_DB` | Compose 使用的数据库名 | `mistake_notes` |
| `POSTGRES_USER` | Compose 使用的数据库用户 | `mistake_notes` |
| `POSTGRES_PASSWORD` | 本地数据库密码占位值 | `change-me-for-local-development` |

密钥只从环境变量或被忽略的 `.env` 文件读取，仓库中仅包含占位值。

## Data Persistence 数据持久化

Compose 创建两个命名卷：

- `mistake_notes_postgres_data` 挂载到 `/var/lib/postgresql/data`，保存记录、当前笔记、版本历史和图片元数据。
- `mistake_notes_note_images` 挂载到 `/app/note_images`，保存原始上传图片文件。

`docker compose down` 会停止容器但保留两个卷；`docker compose down -v` 会主动删除卷并从零初始化。

## Field Mapping 字段对应关系

`data/` 中的源数据集保持不变。`dataset.json` 必须保持以下 SHA-256：

```text
2417e5ab9a9417875a4a3755fbedcd05c4d442085217affb80f36e355c6e106b
```

| 数据集字段 | 数据库列/表 | 页面位置 |
|---|---|---|
| `students.id/name/login/testPassword` | `students` | 登录页与已登录学生信息 |
| `courses.id/name` | `courses` | 筛选区、卡片与详情来源行 |
| `assignments.id/courseId/title` | `assignments` | 详情来源行 |
| `records.id/studentId` | `records.id/student_id` | 服务端归属校验；不信任请求体中的学生字段 |
| `questionText/questionFormat` | `records.question_text/question_format` | 由 Markdown + KaTeX 渲染的题目区 |
| `originalAnswer/answerFormat` | `records.original_answer/answer_format` | 原始作答区 |
| `score/maxScore` | `records.score/max_score` | 卡片与反馈分数，按原始整数/小数形式展示 |
| `feedback` | `records.feedback` | 历史反馈；`null` 显示 `暂无评语` |
| `gradingSource` | `records.grading_source` | AI/教师来源标签 |
| `knowledgePoints` | `knowledge_points` + `record_knowledge_points` | 卡片标签与详情知识点；空值显示 `未标注` |
| `initialNote` | `records.initial_note` | 保留的种子字段；个人笔记独立存储 |
| 错因/复习笔记 | `notes.cause_note/review_note` | 当前可编辑版本 |
| 版本元数据 | `notes.version_number`, `notes.label` | 当前版本徽标及名称 |
| 历史版本 | `note_versions` | 版本抽屉、预览、重命名和恢复 |
| 笔记图片 | `note_images` + `NOTE_IMAGE_DIR` 下的文件 | 缩略图、受保护图片读取和删除 |

## Math And Answer Rendering 公式与原始作答

- 题干通过 `remark-math` 和 `rehype-katex` 按 Markdown 渲染。
- 公式校验和渲染按公式片段进行。单个公式失败时，仅该片段在可读的错误元素中显示原始源码，题目其余 Markdown 和其他正常公式继续渲染。
- 展示公式可在自身容器内横向滚动，不会把页面宽度撑破。
- 历史 HTML 作答使用 DOMPurify 清洗，只保留少量结构标签白名单；脚本、事件处理器、样式、iframe、object 和嵌入内容都会被移除。
- `text_latex` 作答与题目使用同一套 KaTeX 渲染路径。

## Testing 测试

后端测试：

```bash
cd backend
uv sync --frozen
uv run pytest -q
```

前端构建与浏览器/API 验收：

```bash
cd frontend
npm ci
npm run build
node scripts/filter-acceptance.mjs
node scripts/acceptance.mjs
```

当前仓库已验证的关键场景：

1. 核心流程：`student_001` 登录后筛选 `写出四阶`，打开 `wrong_001`，保存笔记，清空两个字段并再次保存，退出后重新登录，确认字段仍为空。浏览器测试输出 `PASS 核心流程重登确认`，说明空值被持久化而不是恢复旧内容。
2. 数据隔离：`student_002` 访问 `student_001` 的 `wrong_001` 时页面返回 `403` 并显示 `无权访问该记录`；pytest 同时检查跨学生笔记和版本操作返回 `403`。
3. 持久化：为 `student_001` 保存笔记并上传图片，检查版本记录，执行不带 `-v` 的 `docker compose down`，再执行 `docker compose up --build -d` 并重新登录。命名卷中的笔记、版本历史和图片仍然存在。
4. 筛选基准：`node scripts/filter-acceptance.mjs` 读取交付筛选用例并输出 `PASS expected-filters 16/16`。
5. 完整浏览器套件：`node scripts/acceptance.mjs` 覆盖渲染、笔记持久化/清空、版本命名与恢复、图片上传/删除、宽屏双栏、浮动小窗视口回收、清洗、错误处理、主题切换和深链保留。

## Project Structure 目录结构

```text
backend/
  app/                 FastAPI 应用、模型、迁移、种子数据和 API
  tests/               pytest 覆盖
data/                  不可变数据集与验收夹具
frontend/
  scripts/             API/浏览器验收与演示录制
  src/                 React 应用与样式
docs/demo.mp4          生成的演示视频
docker-compose.yml     应用、PostgreSQL、健康检查和数据卷
Dockerfile             前端多阶段构建与运行时镜像
```

## Known Limitations 已知限制

- 仅支持并验证 PostgreSQL 16，其他数据库引擎未验证。
- 上传图片按原始字节保存，不压缩、不缩放、不转码。
- 自动化浏览器套件只在本地一个 Chromium/Chrome 环境验证，没有覆盖浏览器矩阵。
- 验收数据集较小，因此记录列表未分页。
- 应用不包含注册、找回密码、验证码、教师管理、成绩同步或分析统计。
- 历史分数与反馈仅用于展示，应用不会重算或补全。
- Ant Design 的 vendor chunk 仍较大并会产生 Vite 体积警告，但已与应用代码及 KaTeX 代码拆分。

Mistake Notes 仅用于课程考核演示。
