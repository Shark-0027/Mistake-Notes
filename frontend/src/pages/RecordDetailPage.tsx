import DOMPurify from "dompurify";
import { App, Button, Card, Drawer, Empty, Result, Skeleton, Spin, Tag } from "antd";
import {
  ArrowLeft,
  BookOpenCheck,
  ChevronDown,
  ChevronUp,
  History,
  NotebookPen,
  RotateCcw,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { MathContent } from "../components/MathContent";
import { NoteEditor } from "../components/NoteEditor";
import type { Note, NoteImage, NoteVersion, RecordDetail } from "../types";

const versionTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

const FLOATING_PANEL_WIDTH = 430;
const FLOATING_PANEL_HEIGHT = 560;
const FLOATING_PANEL_COLLAPSED_HEIGHT = 46;
const FLOATING_PANEL_INSET = 8;

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
  const [images, setImages] = useState<NoteImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [floatingOpen, setFloatingOpen] = useState(false);
  const [floatingCollapsed, setFloatingCollapsed] = useState(false);
  const [floatingPosition, setFloatingPosition] = useState(() => ({
    x: Math.max(16, window.innerWidth - 450),
    y: 92,
  }));
  const floatingPanelRef = useRef<HTMLElement>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);

  function clampFloatingPosition(
    position: { x: number; y: number },
    panel: HTMLElement | null = floatingPanelRef.current,
    collapsed = floatingCollapsed,
  ) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const panelWidth =
      panel?.offsetWidth ??
      Math.min(FLOATING_PANEL_WIDTH, Math.max(0, viewportWidth - 16));
    const measuredHeight =
      panel?.offsetHeight ??
      (collapsed ? FLOATING_PANEL_COLLAPSED_HEIGHT : FLOATING_PANEL_HEIGHT);
    const maximumX = Math.max(
      FLOATING_PANEL_INSET,
      viewportWidth - panelWidth - FLOATING_PANEL_INSET,
    );
    const maximumY = Math.max(
      FLOATING_PANEL_INSET,
      viewportHeight - measuredHeight - FLOATING_PANEL_INSET,
    );
    return {
      x: clamp(position.x, FLOATING_PANEL_INSET, maximumX),
      y: clamp(position.y, FLOATING_PANEL_INSET, maximumY),
    };
  }

  useEffect(() => {
    if (!floatingOpen) return;
    const handleResize = () => {
      setFloatingPosition((current) =>
        clampFloatingPosition(
          current,
          floatingPanelRef.current,
          floatingCollapsed,
        ),
      );
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [floatingCollapsed, floatingOpen]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setImagesLoading(true);
    setImageError("");
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
    api
      .noteImages(id)
      .then((response) => {
        if (active) setImages(response);
      })
      .catch((reason) => {
        if (active) {
          setImageError(
            reason instanceof Error ? reason.message : "图片加载失败",
          );
        }
      })
      .finally(() => {
        if (active) setImagesLoading(false);
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
      setRecord((current) => (current ? { ...current, note: saved } : current));
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
      setRecord((current) =>
        current ? { ...current, note: restored } : current,
      );
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

  async function uploadImage(file: File) {
    if (!record) return;
    if (!csrfToken) {
      const messageText = "会话校验信息缺失，请重新登录后再上传";
      setImageError(messageText);
      message.error(messageText);
      return;
    }
    setImageUploading(true);
    setImageError("");
    try {
      const uploaded = await api.uploadNoteImage(record.id, file, csrfToken);
      setImages((current) => [...current, uploaded]);
      message.success("图片已上传");
    } catch (reason) {
      const messageText =
        reason instanceof Error ? reason.message : "图片上传失败，请重试";
      setImageError(messageText);
      message.error(`${messageText}；已输入文字不会丢失`);
    } finally {
      setImageUploading(false);
    }
  }

  async function deleteImage(image: NoteImage) {
    if (!csrfToken) return;
    setDeletingImageId(image.id);
    try {
      await api.deleteNoteImage(image.id, csrfToken);
      setImages((current) => current.filter((item) => item.id !== image.id));
      message.success("图片已删除");
    } catch (reason) {
      message.error(reason instanceof Error ? reason.message : "图片删除失败");
    } finally {
      setDeletingImageId(null);
    }
  }

  function startFloatingDrag(event: React.PointerEvent<HTMLElement>) {
    const panel = floatingPanelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveFloatingDrag(event: React.PointerEvent<HTMLElement>) {
    const panel = floatingPanelRef.current;
    const offset = dragOffsetRef.current;
    if (!panel || !offset) return;
    const maximumX = Math.max(8, window.innerWidth - panel.offsetWidth - 8);
    const maximumY = Math.max(8, window.innerHeight - panel.offsetHeight - 8);
    setFloatingPosition({
      x: clamp(event.clientX - offset.x, 8, maximumX),
      y: clamp(event.clientY - offset.y, 8, maximumY),
    });
  }

  function endFloatingDrag(event: React.PointerEvent<HTMLElement>) {
    dragOffsetRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
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

  const editorProps = {
    note,
    setNote,
    recordVersion: record.note.version_number,
    csrfToken,
    dirty,
    savingAction,
    images,
    imagesLoading,
    imageUploading,
    imageError,
    deletingImageId,
    onSave: save,
    onOpenHistory: openHistory,
    onUploadImage: uploadImage,
    onDeleteImage: deleteImage,
  };

  return (
    <div className="page-stack detail-stack">
      <div className="detail-toolbar">
        <Link to={`/records${location.search}`}>
          <Button icon={<ArrowLeft size={15} />}>返回列表</Button>
        </Link>
        <div className="detail-toolbar-actions">
          <span className="detail-id">记录 {record.id}</span>
          <Button
            type="primary"
            icon={<NotebookPen size={15} />}
            onClick={() => {
              setFloatingPosition((current) =>
                clampFloatingPosition(current, null, false),
              );
              setFloatingOpen(true);
              setFloatingCollapsed(false);
            }}
          >
            小窗记笔记
          </Button>
        </div>
      </div>

      <div className="detail-content-grid">
        <div className="detail-main-column">
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
        </div>

        <div className="detail-note-column">
          <Card className="surface-card section-card note-section-card" bordered>
            <SectionHeading
              index={3}
              icon={<NotebookPen size={15} />}
              title="我的笔记"
              description="错因和复习笔记独立保存；覆盖当前版本或另存新版本，历史反馈不会被修改。"
            />
            <NoteEditor {...editorProps} />
          </Card>
        </div>
      </div>

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
          <div className="state-card">
            <Result status="error" title="历史版本加载失败" subTitle={historyError} />
          </div>
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

      {floatingOpen ? (
        <section
          ref={floatingPanelRef}
          className={`floating-note-panel${
            floatingCollapsed ? " is-collapsed" : ""
          }`}
          style={{ left: floatingPosition.x, top: floatingPosition.y }}
          aria-label="浮动笔记小窗"
        >
          <header
            className="floating-note-header"
            onPointerDown={startFloatingDrag}
            onPointerMove={moveFloatingDrag}
            onPointerUp={endFloatingDrag}
            onPointerCancel={endFloatingDrag}
          >
            <div className="floating-note-title">
              <NotebookPen size={15} />
              <strong>小窗记笔记</strong>
              <span>版本 {record.note.version_number}</span>
            </div>
            <div
              className="floating-note-actions"
              onPointerDown={(event) => event.stopPropagation()}
            >
              <Button
                type="text"
                size="small"
                aria-label={floatingCollapsed ? "展开小窗" : "收起小窗"}
                icon={
                  floatingCollapsed ? (
                    <ChevronUp size={15} />
                  ) : (
                    <ChevronDown size={15} />
                  )
                }
                onClick={() => setFloatingCollapsed((current) => !current)}
              />
              <Button
                type="text"
                size="small"
                aria-label="关闭小窗"
                icon={<X size={15} />}
                onClick={() => setFloatingOpen(false)}
              />
            </div>
          </header>
          {floatingCollapsed ? null : (
            <div className="floating-note-content">
              <NoteEditor idPrefix="floating" {...editorProps} />
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
