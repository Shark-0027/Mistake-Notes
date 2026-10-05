# 错题整理与个人笔记：真实数据包

本包含 20 条从实际教学系统只读抽取的历史失分记录。抽取时均为当前提交版本、最终评分、成绩已公布、允许学生查看分数与答案、无待处理申诉；排除了测试课程、图片依赖和无关代码题。

## 使用

导入 dataset.json 中的 students、courses、assignments、records，按 id 建立关联。使用 students 中的 login 和 testPassword 初始化本地测试账号；这些均为新建的虚构验收账号，不是生产账号或密码。所有账号初始密码均为 ExamOnly_2026!，仅用于本地验收，不用于公网真实账户。

questionText 为 Markdown/LaTeX，已在有父题的记录前拼接真实公共题干。originalAnswer 保留数据库中的原始文本或 HTML；answerFormat 是用于展示的格式提示。HTML 应通过成熟的安全渲染/清洗组件显示；保留下标、上标、列表等结构，不直接执行任意 HTML。
score 和 maxScore 是该题实际发布的得分与满分，不是作业总分或加权分。knowledgePoints 为空数组表示来源没有标注；feedback 为 null 表示没有公开总评，界面显示“未标注”或“暂无评语”即可，不要自行生成内容。
initialNote 为空，用于考生实现笔记新增、修改、清空和持久化。

## 数据真实性与匿名化

题干、文本作答、分数、公开总评和已有知识点均取自源记录，未生成替代答案或修改评分。题干只拼接了原始父题与子题，未重写数学内容。保留原始评语的简短表述及空值。
姓名、学号、邮箱、联系方式、原始 UUID、班级名称、作业标题、精确时间和服务器地址不随包提供。学生、课程、作业、题目各自按来源实体稳定映射为新 ID；同一学生仍关联同一匿名账户，不将多名学生混成一个人。
本包不含学生照片、手写原件、附件链接、登录令牌或服务器配置。
部分记录为 AI 最终评分，部分为教师最终评分，见 gradingSource。真实历史数据不等于评分正确性金标准；评语可能保留“待核验”等原系统措辞，本题只验收展示和管理，不要求复核或自动修正这些评分。

## 文件

- dataset.json：20 条记录及关联实体。
- schema.json：数据结构说明（JSON Schema）。
- expected-cases.json：根据本包实际数据生成的筛选数量和权限/笔记验收示例。
- preview.md：供人工阅读的全部 20 条内容预览。
- SHA256SUMS：文件完整性校验。

## 样本分布

{
  "records": 20,
  "students": 13,
  "courses": 6,
  "assignments": 7,
  "distinctQuestions": 18,
  "questionTypes": {
    "CALCULATION": 16,
    "SINGLE_CHOICE": 4
  },
  "zeroScores": 4,
  "partialScores": 16,
  "missingFeedback": 1,
  "untagged": 7
}
