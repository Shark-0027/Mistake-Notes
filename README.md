# Mistake Notes

学生错题复习 Web 应用。学生登录后只能查看自己的历史错题，按课程、知识点和题目关键词组合筛选，阅读题干、原始作答和历史批改反馈，并独立维护“错因”和“复习笔记”两个可编辑字段。

## 技术栈

- 后端：Python 3.12、FastAPI、SQLAlchemy 2.x、Uvicorn
- 数据库：PostgreSQL 16，Compose named volume 持久化
- 前端：React 18、Vite、TypeScript、Ant Design
- 渲染：react-markdown、remark-math、rehype-katex、KaTeX、DOMPurify
- 认证：Starlette signed cookie session、Argon2 密码哈希、服务端归属校验、CSRF header
- 依赖锁：`backend/uv.lock`、`frontend/package-lock.json`

未使用运行时 CDN。React、Ant Design、KaTeX、DOMPurify 及字体文件均由 Vite 打包进 Docker 镜像。

## 快速启动

前置条件：Docker Desktop / Docker Engine 与 Docker Compose v2。

```bash
# 可选：生成本地环境变量文件，不提交真实值
cp .env.example .env

# 干净初始化并启动
docker compose down -v
docker compose up --build
```

打开 <http://127.0.0.1:8000>。

测试账号统一密码：`ExamOnly_2026!`

| 登录名 | 学生 | 本人错题数 |
|---|---|---:|
| `student_001` | 示例学生001 | 5 |
| `student_002` | 示例学生002 | 1 |
| `student_003` | 示例学生003 | 1 |
| `student_004` | 示例学生004 | 2 |
| `student_005` | 示例学生005 | 1 |
| `student_006` | 示例学生006 | 2 |
| `student_007` | 示例学生007 | 2 |
| `student_008` | 示例学生008 | 1 |
| `student_009` | 示例学生009 | 1 |
| `student_010` | 示例学生010 | 1 |
| `student_011` | 示例学生011 | 1 |
| `student_012` | 示例学生012 | 1 |
| `student_013` | 示例学生013 | 1 |

## 常用命令

```bash
# 查看服务
docker compose ps

# 查看日志
docker compose logs -f app

# 停止但保留 PostgreSQL named volume
docker compose down

# 一键清空数据并重新初始化
docker compose down -v
docker compose up --build

# 幂等 seed（实际 PostgreSQL）
docker compose exec -T app python -m app.seed
```

数据卷名为 `mistake_notes_postgres_data`，挂载到 PostgreSQL 的 `/var/lib/postgresql/data`。执行 `docker compose down` 不会删除该卷；执行 `docker compose down -v` 才会清空数据。

## 数据完整性

数据包原样保存在 `data/`：

- `data/wrong-answers-20/dataset.json`
- `data/wrong-answers-20/schema.json`
- `data/wrong-answers-20/expected-cases.json`
- `data/wrong-answers-20/preview.md`
- `data/03-wrong-answer-supplement/field-dictionary.md`
- `data/03-wrong-answer-supplement/expected-filters.json`
- `data/03-wrong-answer-supplement/test-cases.csv`
- `data/03-wrong-answer-supplement/record-index.csv`

`data/**` 在 `.gitattributes` 中标记为原样二进制文本，避免 Git 换行转换破坏源包。`dataset.json` SHA-256 必须为：

```text
2417e5ab9a9417875a4a3755fbedcd05c4d442085217affb80f36e355c6e106b
```

Linux / macOS：

```bash
sha256sum data/wrong-answers-20/dataset.json
```

Windows PowerShell：

```powershell
(Get-FileHash -Algorithm SHA256 .\data\wrong-answers-20\dataset.json).Hash.ToLower()
```

初始化使用完整 JSON Schema 校验，并按实体主键 upsert。重复执行 seed 不重复插入，也不覆盖已保存笔记。

## 字段到数据库到页面

| 数据字段 | 数据库 | 页面位置 |
|---|---|---|
| `students.id/name/login/testPassword` | `students` | 登录、导航栏当前学生 |
| `courses.id/name` | `courses` | 列表筛选、列表卡片、详情来源 |
| `assignments.id/courseId/title` | `assignments` | 详情来源信息 |
| `records.id/studentId` | `records.student_id` | 服务端归属校验，不暴露为可提交身份参数 |
| `questionText/questionFormat` | `records.question_text/question_format` | 详情题干，Markdown + KaTeX |
| `originalAnswer/answerFormat` | `records.original_answer/answer_format` | 详情“原始作答” |
| `score/maxScore` | `records.score/max_score` | 列表与详情得分，保留小数显示 |
| `feedback` | `records.feedback` | 详情“历史批改反馈”；`null` 显示“暂无评语” |
| `gradingSource` | `records.grading_source` | 详情来源标签 |
| `knowledgePoints` | `knowledge_points` + `record_knowledge_points` | 列表标签、详情知识点；空数组显示“未标注” |
| `initialNote` | `records.initial_note` | 种子字段保留；个人笔记单独存储 |
| 错因 | `notes.cause_note` | 详情“我的笔记 → 错因” |
| 复习笔记 | `notes.review_note` | 详情“我的笔记 → 复习笔记” |

历史字段和用户笔记分区展示。保存笔记不会改写 `originalAnswer`、`feedback` 或历史分数。

## 认证与隔离

- 身份只来自 signed cookie session；所有列表、详情、笔记接口都从服务端 session 取得 `student_id`。
- 请求体没有 `studentId`，多传该字段会被拒绝。
- 查询他人记录返回 `403`；不存在的记录返回 `404`。
- 密码使用 Argon2 哈希入库；登录失败统一返回“账号或密码错误”。
- 修改接口要求 `X-CSRF-Token`，令牌随签名会话下发并做常量时间比较。
- 空字符串保存表示清空，不会被解释为不修改。

## Markdown、公式与 HTML 清洗

- `questionText` 先规范 `$$` 边界，再交给 `remark-math` 与 `rehype-katex` 渲染。
- 渲染前用 KaTeX `throwOnError: true` 做语法预检；如果公式异常，错误容器内显示完整原文，不白屏、不改写题意。
- `answerFormat=html` 经 DOMPurify 白名单清洗，只保留段落、列表、换行、粗斜体、上下标等结构；脚本、事件属性、iframe、object、embed 被移除。
- `answerFormat=text_latex` 按文本与行内公式渲染。
- KaTeX 的 CSS、字体和多阶段构建全部进入本地产物，不依赖 CDN。

## 架构与关键取舍

```text
browser
  -> FastAPI JSON API
  -> SQLAlchemy
  -> PostgreSQL named volume

FastAPI
  -> serves frontend_dist SPA fallback
```

前端选择 Ant Design 而不是 shadcn：登录表单、选择器、骨架屏、空状态、结果页和消息反馈都由成熟组件承担可访问性与交互状态；应用层 CSS 变量逐项承载 prompt 规定的 light/dark token。React 与 KaTeX 仍由源码在 Docker 多阶段构建中打包。

后端采用同步 SQLAlchemy，原因是数据规模小、事务边界清晰、Compose 验收更直接。Docker 运行阶段执行 `uv sync --frozen --no-dev`，开发测试依赖不进入生产镜像。

## 本项目自研范围与开源来源

自研部分：

- 错题领域模型、seed 幂等逻辑、服务端归属过滤、笔记双字段持久化
- signed session + CSRF + Argon2 认证链路
- React 登录、筛选列表、详情、笔记交互和双主题样式
- Docker Compose 编排、验收脚本、文档与测试

使用的开源库：

- FastAPI、Starlette、SQLAlchemy、PostgreSQL、psycopg、Uvicorn、Argon2-cffi
- React、Vite、TypeScript、Ant Design、Lucide
- react-markdown、remark-math、rehype-katex、KaTeX、DOMPurify
- Playwright Core（仅验收脚本使用本机 Chrome，不下载浏览器）

没有照抄模板代码；仅参考成熟框架的常规项目布局与部署方式。

## 本地测试

后端：

```bash
cd backend
uv sync --all-groups --frozen
uv run pytest
```

如果 Windows 上 `uv run` 的 trampoline 无法解析中文路径，可直接：

```powershell
.\.venv\Scripts\python.exe -m pytest
```

前端：

```bash
cd frontend
npm ci
npm run build
```

浏览器验收（需要先启动 Compose，并设置本机 Chrome 路径）：

```bash
cd frontend
node scripts/acceptance.mjs
node scripts/filter-acceptance.mjs
```

如 Chrome 不在默认位置：

```bash
CHROME_PATH=/path/to/chrome node scripts/acceptance.mjs
```

## WA-01～WA-12 实测记录

实测日期：2026-10-06。运行环境：Windows、Docker Desktop Linux engine、Chrome headless、Compose 服务 `db` + `app`。

### WA-01 初始化幂等

在干净 named volume 上执行 `docker compose up --build -d`，app 日志：

```text
Seeded dataset 2417e5ab9a9417875a4a3755fbedcd05c4d442085217affb80f36e355c6e106b
Database ready: {'records': 20, 'students': 13, 'courses': 6, 'assignments': 7}
```

随后在真实 PostgreSQL 中连续执行两次：

```bash
docker compose exec -T app python -m app.seed
docker compose exec -T app python -m app.seed
```

两次均返回：

```text
Database ready: {'records': 20, 'students': 13, 'courses': 6, 'assignments': 7}
```

结果：通过，无重复、无丢失。后端另有 `test_seed_is_idempotent_and_dataset_hash_matches` 覆盖同一路径。

### WA-02 筛选基准

对运行中的实际 PostgreSQL API 执行：

```bash
cd frontend
node scripts/filter-acceptance.mjs
```

真实结果：

```text
PASS expected-filters 16/16
```

结果：通过。16 个 case 的返回 ID 集合与 `expected-filters.json` 完全一致。

### WA-03 保存笔记并跨刷新保留

浏览器步骤：`student_001` 登录 → 打开 `wrong_001` → 保存错因“复习行列式”、复习笔记“检查带负号项” → 刷新详情页。

真实结果：`PASS WA-03 笔记保存并跨刷新保留 (2.39s)`。刷新后两个输入框值仍为保存内容，历史反馈和原始作答未变化。

### WA-04 清空保存

浏览器步骤：在已保存的 `wrong_001` 中点击两个“清空” → 保存 → 刷新。

真实结果：`PASS WA-04 清空保存后保持为空 (2.50s)`。两个字段均为空字符串，没有恢复旧内容。

### WA-05 越权拒绝

详情与笔记接口均按服务端 session 校验归属。浏览器以 `student_002` 打开 `student_001` 的 `wrong_001`：

```text
PASS WA-05 越权详情被拒绝 (1.51s)
```

详情请求返回 `403`，页面显示“无法读取这条错题 / 无权访问该记录”。pytest 同时覆盖详情和笔记写入的越权拒绝。

### WA-06 空评语

浏览器以 `student_005` 打开 `wrong_010`：

```text
PASS WA-06 null 评语显示占位 (1.62s)
```

页面显示“暂无评语”，没有生成新评语。

### WA-07 空知识点

浏览器以 `student_001` 打开 `wrong_001`：

```text
PASS WA-07 空知识点显示占位 (1.60s)
```

页面显示“未标注”，题干和得分正常。

### WA-08 HTML、公式与长文本

浏览器打开 `wrong_001`，检查 KaTeX 节点、HTML 上下标结构和题干文本：

```text
PASS WA-08 KaTeX 与安全 HTML 结构可读 (1.60s)
```

题干公式、文本换行和原始 HTML 的 `sub` 结构均可见；异常公式会进入完整原文降级容器。

### WA-09 HTML 注入探针

浏览器在本地响应副本中注入：

```html
<script>window.__probe=1</script>
<img src=x onerror="window.__probe=2">
<p onclick="window.__probe=3">安全内容</p>
```

真实结果：

```text
PASS WA-09 恶意 HTML 探针被 DOMPurify 清除 (1.66s)
```

`window.__probe` 为 `undefined`，渲染结果不含 script、onclick、onerror；正常文字保留。原数据文件未修改。

### WA-10 返回列表保留筛选

浏览器步骤：`student_001` 打开 `/records?course=course_001&keyword=写出四阶` → 结果 1 条 → 进入 `wrong_001` → 返回列表。

真实结果：`PASS WA-10 返回列表保留筛选条件 (1.70s)`。返回后 URL query 和“共 1 条”均保留。

### WA-11 保存失败

浏览器将保存接口临时模拟为 `500`，填写“失败时必须保留”后保存：

```text
PASS WA-11 保存失败保留输入且不虚报成功 (1.68s)
```

页面显示失败消息，输入框内容仍在，没有显示成功。

### WA-12 保留数据卷重建容器

步骤：

1. 在真实 PostgreSQL 中为 `student_001 / wrong_001` 保存 `cause_note=container-rebuild-proof`、`review_note=volume-persistence-check`。
2. 执行 `docker compose down`，确认命令没有 `-v`。
3. 执行 `docker compose up --build -d`。
4. 重新登录后读取 `wrong_001`。

真实结果：

```text
CauseNote         : container-rebuild-proof
ReviewNote        : volume-persistence-check
RecordCount       : 5
FeedbackUnchanged : True
```

结果：通过。答题记录、笔记和历史反馈均保留。

## 已知限制

- 不回算、不补全、不生成参考答案；历史评语和分数只展示。
- 不做注册、找回密码、验证码、教师端、后台管理、成绩同步或统计图表。
- 列表当前一次返回本人记录；数据集只有 20 条，不做分页。
- `SESSION_SECRET` 的 Compose 默认值只用于本地验收；部署到公网必须通过 `.env` 或编排平台注入强随机值。
- `answerFormat=html` 采用白名单清洗，不保留原 HTML 的任意 CSS、链接或媒体标签。

## 仓库与克隆部署

仓库：<https://github.com/Shark-0027/Mistake-Notes.git>

```bash
git clone https://github.com/Shark-0027/Mistake-Notes.git
cd Mistake-Notes
docker compose up --build
```

浏览器访问 <http://127.0.0.1:8000>。