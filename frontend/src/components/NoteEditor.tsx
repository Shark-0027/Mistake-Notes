import { Alert, Button, Image, Input, Spin, Tag } from "antd";
import {
  Copy,
  Eraser,
  History,
  ImagePlus,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Note, NoteImage } from "../types";

interface NoteEditorProps {
  idPrefix?: string;
  note: Note;
  setNote: Dispatch<SetStateAction<Note>>;
  recordVersion: number;
  csrfToken: string;
  dirty: boolean;
  savingAction: "save" | "new" | null;
  images: NoteImage[];
  imagesLoading: boolean;
  imageUploading: boolean;
  imageError: string;
  deletingImageId: string | null;
  onSave: (asNewVersion?: boolean) => Promise<void>;
  onOpenHistory: () => void;
  onUploadImage: (file: File) => Promise<void>;
  onDeleteImage: (image: NoteImage) => Promise<void>;
}

export function NoteEditor({
  idPrefix = "",
  note,
  setNote,
  recordVersion,
  csrfToken,
  dirty,
  savingAction,
  images,
  imagesLoading,
  imageUploading,
  imageError,
  deletingImageId,
  onSave,
  onOpenHistory,
  onUploadImage,
  onDeleteImage,
}: NoteEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fieldId = (name: string) => (idPrefix ? `${idPrefix}-${name}` : name);

  function handleImageSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void onUploadImage(file);
  }

  function handleImagePaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const item = Array.from(event.clipboardData.items).find(
      (entry) => entry.kind === "file" && entry.type.startsWith("image/"),
    );
    const file =
      item?.getAsFile() ??
      Array.from(event.clipboardData.files).find((entry) =>
        entry.type.startsWith("image/"),
      );
    if (file) {
      event.preventDefault();
      void onUploadImage(file);
    }
  }

  return (
    <div className="note-editor">
      <div className="note-version-row">
        <Tag className="note-version-badge">版本 {recordVersion}</Tag>
        <div className="note-tool-actions">
          <input
            ref={imageInputRef}
            className="note-image-input"
            type="file"
            accept="image/*"
            capture="environment"
            aria-label={idPrefix ? "小窗选择笔记图片" : "选择笔记图片"}
            onChange={handleImageSelection}
          />
          <Button
            icon={<ImagePlus size={15} />}
            loading={imageUploading}
            disabled={!csrfToken || imageUploading}
            onClick={() => imageInputRef.current?.click()}
          >
            插入图片
          </Button>
          <Button icon={<History size={15} />} onClick={onOpenHistory}>
            历史版本
          </Button>
        </div>
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
          <label htmlFor={fieldId("cause-note")}>错因</label>
          <Button
            type="text"
            size="small"
            icon={<Eraser size={14} />}
            onClick={() => setNote((current) => ({ ...current, cause_note: "" }))}
          >
            清空
          </Button>
        </div>
        <Input.TextArea
          id={fieldId("cause-note")}
          value={note.cause_note}
          autoSize={{ minRows: 3, maxRows: 7 }}
          placeholder="记录这道题出错的原因"
          onPaste={handleImagePaste}
          onChange={(event) =>
            setNote((current) => ({
              ...current,
              cause_note: event.target.value,
            }))
          }
        />
      </div>

      <div className="note-field">
        <div className="note-label-row">
          <label htmlFor={fieldId("review-note")}>复习笔记</label>
          <Button
            type="text"
            size="small"
            icon={<Eraser size={14} />}
            onClick={() =>
              setNote((current) => ({ ...current, review_note: "" }))
            }
          >
            清空
          </Button>
        </div>
        <Input.TextArea
          id={fieldId("review-note")}
          value={note.review_note}
          autoSize={{ minRows: 5, maxRows: 10 }}
          placeholder="写下复习思路和需要巩固的知识点"
          onPaste={handleImagePaste}
          onChange={(event) =>
            setNote((current) => ({
              ...current,
              review_note: event.target.value,
            }))
          }
        />
      </div>

      <div className="note-image-block">
        <div className="note-image-heading">
          <span className="field-label">笔记图片</span>
          <span>单张不超过 5MB，支持 JPG、PNG、WebP</span>
        </div>
        {imageError ? <Alert type="error" showIcon message={imageError} /> : null}
        {imagesLoading ? (
          <div className="note-image-state">
            <Spin size="small" />
          </div>
        ) : images.length ? (
          <div className="note-image-grid">
            {images.map((image) => (
              <div className="note-image-item" key={image.id}>
                <Image
                  className="note-image-thumbnail"
                  src={image.url}
                  alt={image.filename}
                  title={`${image.filename}${
                    image.version_number
                      ? ` · 版本 ${image.version_number}`
                      : ""
                  }`}
                />
                <div className="note-image-item-actions">
                  <span title={image.filename}>{image.filename}</span>
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<Trash2 size={13} />}
                    loading={deletingImageId === image.id}
                    onClick={() => void onDeleteImage(image)}
                  >
                    删除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <span className="empty-value">暂无图片</span>
        )}
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
            onClick={() => void onSave(true)}
          >
            另存为新版本
          </Button>
          <Button
            type="primary"
            icon={<Save size={15} />}
            loading={savingAction === "save"}
            disabled={!dirty || !csrfToken || savingAction !== null}
            onClick={() => void onSave(false)}
          >
            保存笔记
          </Button>
        </div>
      </div>
    </div>
  );
}
