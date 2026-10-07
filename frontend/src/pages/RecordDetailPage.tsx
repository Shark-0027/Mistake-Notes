import DOMPurify from "dompurify";
import {
  Alert,
  App,
  Button,
  Card,
  Drawer,
  Empty,
  Input,
  Result,
  Skeleton,
  Spin,
  Tag,
} from "antd";
import {
  ArrowLeft,
  BookOpenCheck,
  Copy,
  Eraser,
  History,
  NotebookPen,
  RotateCcw,
  Save,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { MathContent } from "../components/MathContent";
import type { Note, NoteVersion, RecordDetail } from "../types";

const versionTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function formatVersionTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : versionTimeFormatter.format(date);
}

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
  const [note, setNote] = useState<Note>({
    cause_note: "",
    review_note: "",
    version_number: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingAction, setSavingAction] = useState<"save" | "new" | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<NoteVersion[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);

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

  async function loadHistory() {
    if (!id) return;
    setHistoryLoading(true);
    setHistoryError("");
    try {
      setHistory(await api.noteVersions(id));
    } catch (reason) {
      setHistoryError(
        reason instanceof Error ? reason.message : "历史版本加载失败",
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  function openHistory() {
    setHistoryOpen(true);
    void loadHistory();
  }

  async function save(asNewVersion = false) {
    if (!record) return;
    setSavingAction(asNewVersion ? "new" : "save");
    try {
      const saved = await api.saveNotes(
        record.id,
        { cause_note: note.cause_note, review_note: note.review_note },
        csrfToken,
        asNewVersion,
      );
      setNote(saved);
      setRecord({ ...record, note: saved });
      message.success(asNewVersion ? "已另存为新版本" : "笔记已保存");
      if (historyOpen) void loadHistory();
    } catch (reason) {
      message.error(
        `${reason instanceof Error ? reason.message : "保存失败，请重试"}；输入内容已保留`,
      );
    } finally {
      setSavingAction(null);
    }
  }

  async function restore(versionNumber: number) {
    if (!record || !csrfToken) return;
    setRestoringVersion(versionNumber);
    try {
      const restored = await api.restoreNoteVersion(
        record.id,
        versionNumber,
        csrfToken,
      );
      setNote(restored);
      setRecord({ ...record, note: restored });
      message.success(
        `已恢复版本 ${versionNumber}，当前内容为版本 ${restored.version_number}`,
      );
      await loadHistory();
    } catch (reason) {
      message.error(reason instanceof Error ? reason.message : "恢复失败，请重试");
    } finally {
      setRestoringVersion(null);
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
          description="错因和复习笔记独立保存；覆盖当前版本或另存新版本，历史反馈不会被修改。"
        />
        <div className="note-version-row">
          <Tag className="note-version-badge">版本 {record.note.version_number}</Tag>
          <Button icon={<History size={15} />} onClick={openHistory}>
            历史版本
          </Button>
        </div>
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
          <div className="note-action-buttons">
            <Button
              icon={<Copy size={15} />}
              loading={savingAction === "new"}
              disabled={!csrfToken || savingAction !== null}
              onClick={() => void save(true)}
            >
              另存为新版本
            </Button>
            <Button
              type="primary"
              icon={<Save size={15} />}
              loading={savingAction === "save"}
              disabled={!dirty || !csrfToken || savingAction !== null}
              onClick={() => void save(false)}
            >
              保存笔记
            </Button>
          </div>
        </div>
      </Card>

      <Drawer
        className="note-history-drawer"
        title="历史版本"
        width={520}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      >
        {historyLoading ? (
          <div className="version-state">
            <Spin />
          </div>
        ) : historyError ? (
          <Alert type="error" showIcon message={historyError} />
        ) : history.length ? (
          <div className="version-list">
            {history.map((version) => (
              <article className="version-item" key={version.version_number}>
                <div className="version-item-heading">
                  <strong>版本 {version.version_number}</strong>
                  <span>{formatVersionTime(version.created_at)}</span>
                </div>
                <div className="version-note-block">
                  <span>错因</span>
                  <p className={version.cause_note ? "" : "empty-value"}>
                    {version.cause_note || "无内容"}
                  </p>
                </div>
                <div className="version-note-block">
                  <span>复习笔记</span>
                  <p className={version.review_note ? "" : "empty-value"}>
                    {version.review_note || "无内容"}
                  </p>
                </div>
                <div className="version-item-actions">
                  <Button
                    icon={<RotateCcw size={14} />}
                    loading={restoringVersion === version.version_number}
                    disabled={!csrfToken || restoringVersion !== null}
                    onClick={() => void restore(version.version_number)}
                  >
                    恢复此版本
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty description="暂无历史版本" />
        )}
      </Drawer>
    </div>
  );
}

