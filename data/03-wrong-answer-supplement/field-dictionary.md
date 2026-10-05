# 数据字段与显示规则

## 顶层实体

| 路径 | 类型 | 用途 |
|---|---|---|
| schemaVersion / description | 字符串 | 数据版本与来源说明 |
| students | 对象数组 | 匿名学生和仅供本地测试的账号 |
| courses | 对象数组 | 课程班级，字段 id / name |
| assignments | 对象数组 | 来源作业，字段 id / courseId / title |
| records | 对象数组 | 20 条失分作答记录 |

students 的 id 是关联键；name 是显示名；login/testPassword 用于初始化本地测试账号；role 为 STUDENT。测试密码不是生产密码。账号权限由后端会话决定，不能由客户端提交的 studentId 决定。

## records 中每条记录

| 字段 | 类型 | 含义 / 使用方式 |
|---|---|---|
| id | 字符串 | 作答记录 ID；笔记归属到该记录 |
| studentId | 字符串 | 关联 students.id，决定可访问者 |
| courseId / assignmentId | 字符串 | 课程与来源作业 |
| questionId | 字符串 | 题目 ID；同一道题可能有不同学生作答，不能据此合并记录 |
| questionType | 枚举 | CALCULATION / SINGLE_CHOICE |
| questionText | 字符串 | 原题干，保留结构和内容 |
| questionFormat | 枚举 | markdown_latex |
| originalAnswer | 字符串 | 原始作答，不改成参考答案 |
| answerFormat | 枚举 | html / text_latex，分别处理 HTML 与文本数学公式 |
| score / maxScore | 数字 | 已公布历史得分 / 满分，允许小数，原样显示 |
| feedback | 字符串或 null | 公开批改反馈；null 显示“暂无评语” |
| gradingSource | 枚举 | AI / TEACHER，历史成绩来源 |
| knowledgePoints | 字符串数组 | 知识点标签；空数组显示“未标注” |
| initialNote | 字符串 | 初始笔记；本包均为空字符串。候选人实现中另设可编辑的错因与复习笔记字段 |

学生填写的错因和复习笔记是独立可编辑数据，不覆盖 feedback 或 originalAnswer。空字符串保存表示清空，不能被当作“不修改”。

## 筛选和显示

先限定当前学生，再叠加课程、知识点、题目关键词，各已填写条件用 AND。expected-filters.json 的 keyword 是 questionText 中确实存在的连续中文词，便于不受公式渲染影响地核对。

HTML 按安全规则呈现文字、段落和公式，不能直接执行原始 HTML 的脚本或事件；验收可在本地副本另加恶意标签检查，不改交付原包。公式异常时显示可读原文，不丢整段内容或擅自修改数学含义。

本包没有评语的记录是 wrong_010；没有知识点的记录是 wrong_001～wrong_007。4 条零分、16 条部分失分。具体归属以 record-index.csv 为准。
