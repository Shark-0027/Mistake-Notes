import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Result,
  Select,
  Skeleton,
  Tag,
} from "antd";
import { FilterX, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import { RecordCard } from "../components/RecordCard";
import type { CatalogResponse, RecordFilters, RecordSummary } from "../types";

export function RecordsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo<RecordFilters>(
    () => ({
      course: searchParams.get("course") || undefined,
      knowledgePoint: searchParams.get("knowledgePoint") || undefined,
      keyword: searchParams.get("keyword") || undefined,
    }),
    [searchParams],
  );
  const [keywordDraft, setKeywordDraft] = useState(filters.keyword || "");
  const [catalog, setCatalog] = useState<CatalogResponse>({
    courses: [],
    knowledge_points: [],
  });
  const [catalogCourse, setCatalogCourse] = useState<string | null | undefined>(undefined);
  const [catalogError, setCatalogError] = useState("");
  const catalogRequestId = useRef(0);
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordsError, setRecordsError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setKeywordDraft(filters.keyword || "");
  }, [filters.keyword]);

  useEffect(() => {
    let active = true;
    const requestId = ++catalogRequestId.current;
    setCatalogError("");
    api
      .catalog(filters.course)
      .then((response) => {
        if (!active || requestId !== catalogRequestId.current) return;
        setCatalog(response);
        setCatalogCourse(filters.course ?? null);
      })
      .catch(() => {
        if (!active || requestId !== catalogRequestId.current) return;
        setCatalogError("筛选选项加载失败，请重试");
      });
    return () => {
      active = false;
    };
  }, [filters.course]);

  useEffect(() => {
    if (
      catalogCourse === (filters.course ?? null) &&
      !catalogError &&
      filters.knowledgePoint &&
      !catalog.knowledge_points.includes(filters.knowledgePoint)
    ) {
      updateQuery({
        course: filters.course,
        keyword: filters.keyword,
      });
    }
  }, [catalog.knowledge_points, catalogCourse, catalogError, filters]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setRecordsError("");
    api
      .records(filters)
      .then((response) => {
        if (!controller.signal.aborted) setRecords(response);
      })
      .catch((reason) => {
        if (controller.signal.aborted) return;
        setRecords([]);
        setRecordsError(
          reason instanceof Error ? reason.message : "列表加载失败，请重试",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filters, reloadKey]);

  function updateQuery(next: RecordFilters) {
    const params = new URLSearchParams();
    if (next.course) params.set("course", next.course);
    if (next.knowledgePoint) params.set("knowledgePoint", next.knowledgePoint);
    if (next.keyword) params.set("keyword", next.keyword);
    setSearchParams(params);
  }

  function resetFilters() {
    setKeywordDraft("");
    setSearchParams({});
  }

  const hasFilters = Boolean(
    filters.course || filters.knowledgePoint || filters.keyword,
  );

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">个人错题</span>
          <h1>错题整理与复习</h1>
        </div>
        <span className="result-count">
          {loading ? "正在加载" : recordsError ? "加载失败" : `共 ${records.length} 条`}
        </span>
      </div>

      <Card className="surface-card filter-card" bordered>
        <div className="filter-title">
          <SlidersHorizontal size={15} />
          <span>筛选条件</span>
        </div>
        <div className="filter-row">
          <Select
            allowClear
            aria-label="课程"
            placeholder="全部课程"
            value={filters.course}
            options={catalog.courses.map((course) => ({
              value: course.id,
              label: course.name,
            }))}
            onChange={(value) =>
              updateQuery({
                course: value,
                knowledgePoint: filters.knowledgePoint,
                keyword: filters.keyword,
              })
            }
          />
          <Select
            allowClear
            aria-label="知识点"
            placeholder="全部知识点"
            value={filters.knowledgePoint}
            options={catalog.knowledge_points.map((point) => ({
              value: point,
              label: point,
            }))}
            onChange={(value) =>
              updateQuery({
                course: filters.course,
                knowledgePoint: value,
                keyword: filters.keyword,
              })
            }
          />
          <Input
            aria-label="关键词"
            value={keywordDraft}
            prefix={<Search size={15} />}
            placeholder="题目关键词"
            onChange={(event) => setKeywordDraft(event.target.value)}
            onPressEnter={() =>
              updateQuery({
                course: filters.course,
                knowledgePoint: filters.knowledgePoint,
                keyword: keywordDraft.trim() || undefined,
              })
            }
          />
          <Button
            icon={<RotateCcw size={15} />}
            onClick={resetFilters}
            disabled={!hasFilters}
          >
            重置
          </Button>
        </div>
        {catalogError && (
          <Alert
            className="filter-alert"
            type="warning"
            showIcon
            message={catalogError}
          />
        )}
      </Card>

      {loading ? (
        <div className="records-list" aria-label="加载中">
          {[0, 1, 2].map((item) => (
            <Card key={item} className="record-card skeleton-card">
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
          ))}
        </div>
      ) : recordsError ? (
        <Card className="surface-card state-card">
          <Result
            status="error"
            icon={<FilterX size={34} />}
            title="错题列表加载失败"
            subTitle={recordsError}
            extra={
              <Button
                type="primary"
                onClick={() => setReloadKey((value) => value + 1)}
              >
                重新加载
              </Button>
            }
          />
        </Card>
      ) : records.length === 0 ? (
        <Card className="surface-card state-card">
          <Empty
            image={<FilterX size={36} />}
            description="没有符合条件的错题"
          >
            <Button onClick={resetFilters}>重置筛选</Button>
          </Empty>
        </Card>
      ) : (
        <div className="records-list">
          {records.map((record) => (
            <RecordCard key={record.id} record={record} />
          ))}
        </div>
      )}

      {!loading && !recordsError && records.length > 0 && (
        <div className="tag-row result-note">
          <Tag className="neutral-tag">仅展示当前账号的记录</Tag>
          <Tag className="neutral-tag">历史评分原样显示</Tag>
        </div>
      )}
    </div>
  );
}
