import DOMPurify from "dompurify";
import {
  Alert,
  App,
  Button,
  Card,
  Input,
  Result,
  Skeleton,
  Tag,
} from "antd";
import {
  ArrowLeft,
  BookOpenCheck,
  Eraser,
  History,
  NotebookPen,
  Save,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { MathContent } from "../components/MathContent";
import type { Note, RecordDetail } from "../types";

function SafeAnswer({ record }: { record: RecordDetail }) {
  if (record.answer_format === "html") {
    const safeHtml = DOMPurify.sanitize(record.original_answer, {
      ALLOWED_TAGS: [
        "p",
        "br",
        "ol",
        "ul",
        "li",
        "strong",
        "em",
        "sub",
        "sup",
        "span",
        "div",
        "blockquote",
        "code",
        "pre",
      ],
      ALLOWED_ATTR: [],
      FORBID_TAGS: ["script", "style", "iframe", "object", "embed"],
      FORBID_ATTR: ["style", "onerror", "onclick", "onload"],
    });
    return (
      <div
        className="safe-answer"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    );
  }
  return <MathContent source={record.original_answer} />;
}

function SectionHeading({
  index,
  icon,
  title,
  description,
}: {
  index: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="section-heading">
      <span className="section-number">{index}</span>
      <span className="section-icon">{icon}</span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

export function RecordDetailPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const { csrfToken } = useAuth();
  const { message } = App.useApp();
  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [note, setNote] = useState<Note>({ cause_note: "", review_note: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api
      .record(id)
      .then((response) => {
        if (!active) return;
        setRecord(response);
        setNote(response.note);
      })
      .catch((reason) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : "详情加载失败");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const dirty = useMemo(() => {
    if (!record) return false;
    return (
      note.cause_note !== record.note.cause_note ||
      note.review_note !== record.note.review_note
    );
  }, [note, record]);

  async function save() {
    if (!record) return;
    setSaving(true);
    try {
      const saved = await api.saveNotes(record.id, note, csrfToken);
      setNote(saved);
      setRecord({ ...record, note: saved });
      message.success("笔记已保存");
    } catch (reason) {
      message.error(
        `${reason instanceof Error ? reason.message : "保存失败，请重试"}；输入内容已保留`,
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page-stack">
        <Card className="surface-card">
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      </div>
    );
  }

  if (error || !record) {
    return (
      <Card className="surface-card state-card">
        <Result
          status="error"
          title="无法读取这条错题"
          subTitle={error || "记录不存在"}
          extra={
            <Link to={`/records${location.search}`}>
              <Button type="primary" icon={<ArrowLeft size={15} />}>
                返回列表
              </Button>
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <div className="page-stack detail-stack">
      <div className="detail-toolbar">
        <Link to={`/records${location.search}`}>
          <Button icon={<ArrowLeft size={15} />}>返回列表</Button>
        </Link>
        <span className="detail-id">记录 {record.id}</span>
      </div>

      <Card className="surface-card section-card" bordered>
        <SectionHeading
          index={1}
          icon={<BookOpenCheck size={15} />}
          title="题目与作答"
          description={`${record.course_name} · ${record.assignment_title}`}
        />
        <div className="source-line">
          <Tag color={record.grading_source === "AI" ? "blue" : "gold"}>
            {record.grading_source === "AI" ? "AI 评分" : "教师评分"}
          </Tag>
          <Tag className="neutral-tag">{record.question_type}</Tag>
          <Tag className="neutral-tag">{record.question_id}</Tag>
        </div>
        <div className="question-panel">
          <MathContent source={record.question_text} />
        </div>
        <div className="answer-heading">原始作答</div>
        <div className={`answer-panel answer-${record.answer_format}`}>
          <SafeAnswer record={record} />
        </div>
      </Card>

      <Card className="surface-card section-card" bordered>
        <SectionHeading
          index={2}
          icon={<History size={15} />}
          title="历史批改反馈"
          description="以下内容为来源系统中的历史数据，仅在页面中展示，不会重算或补全。"
        />
        <div className="feedback-grid">
          <div className="feedback-score">
            <span>得分</span>
            <strong>
              {record.score_display} / {record.max_score_display}
            </strong>
          </div>
          <div className="feedback-panel">
            <span className="field-label">公开评语</span>
            <p className={record.feedback ? "" : "empty-value"}>
              {record.feedback || "暂无评语"}
            </p>
          </div>
        </div>
        <div className="knowledge-block">
          <span className="field-label">知识点</span>
          <div className="tag-row">
            {record.knowledge_points.length ? (
              record.knowledge_points.map((point) => (
                <Tag key={point} className="neutral-tag">
                  {point}
                </Tag>
              ))
            ) : (
              <Tag className="neutral-tag">未标注</Tag>
            )}
          </div>
        </div>
      </Card>

      <Card className="surface-card section-card" bordered>
        <SectionHeading
          index={3}
          icon={<NotebookPen size={15} />}
          title="我的笔记"
          description="错因和复习笔记独立保存，可清空后保存。历史反馈不会被修改。"
        />
        {csrfToken ? null : (
          <Alert
            type="warning"
            showIcon
            message="会话校验信息缺失，请重新登录后再保存"
          />
        )}
        <div className="note-field">
          <div className="note-label-row">
            <label htmlFor="cause-note">错因</label>
            <Button
              type="text"
              size="small"
              icon={<Eraser size={14} />}
              onClick={() => setNote({ ...note, cause_note: "" })}
            >
              清空
            </Button>
          </div>
          <Input.TextArea
            id="cause-note"
            value={note.cause_note}
            autoSize={{ minRows: 3, maxRows: 7 }}
            placeholder="记录这道题出错的原因"
            onChange={(event) =>
              setNote({ ...note, cause_note: event.target.value })
            }
          />
        </div>
        <div className="note-field">
          <div className="note-label-row">
            <label htmlFor="review-note">复习笔记</label>
            <Button
              type="text"
              size="small"
              icon={<Eraser size={14} />}
              onClick={() => setNote({ ...note, review_note: "" })}
            >
              清空
            </Button>
          </div>
          <Input.TextArea
            id="review-note"
            value={note.review_note}
            autoSize={{ minRows: 5, maxRows: 10 }}
            placeholder="写下复习思路和需要巩固的知识点"
            onChange={(event) =>
              setNote({ ...note, review_note: event.target.value })
            }
          />
        </div>
        <div className="note-actions">
          <span className="save-hint">
            <ShieldCheck size={14} />
            只保存到你的账号下
          </span>
          <Button
            type="primary"
            icon={<Save size={15} />}
            loading={saving}
            disabled={!dirty || !csrfToken}
            onClick={() => void save()}
          >
            保存笔记
          </Button>
        </div>
      </Card>
    </div>
  );
}

