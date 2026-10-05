import { Card, Tag } from "antd";
import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import type { RecordSummary } from "../types";

function excerpt(source: string): string {
  const limit = 100;
  if (source.length <= limit) return source;

  let index = 0;
  while (index < source.length && index < limit) {
    if (source.startsWith("$$", index)) {
      const end = source.indexOf("$$", index + 2);
      index = end === -1 ? source.length : end + 2;
      continue;
    }
    if (source[index] === "$") {
      const end = source.indexOf("$", index + 1);
      index = end === -1 ? source.length : end + 1;
      continue;
    }
    index += 1;
  }
  return `${source.slice(0, index).replace(/\s+/g, " ").trim()}…`;
}

export function RecordCard({ record }: { record: RecordSummary }) {
  const location = useLocation();
  return (
    <Link
      className="record-link"
      to={{ pathname: `/records/${record.id}`, search: location.search }}
    >
      <Card className="record-card" bordered>
        <div className="record-card-top">
          <span className="record-course">{record.course_name}</span>
          <span className="score-value">
            {record.score_display} / {record.max_score_display}
          </span>
        </div>
        <p className="record-excerpt">{excerpt(record.question_text)}</p>
        <div className="record-card-bottom">
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
          <span className="detail-link">
            查看详情 <ChevronRight size={15} />
          </span>
        </div>
      </Card>
    </Link>
  );
}

