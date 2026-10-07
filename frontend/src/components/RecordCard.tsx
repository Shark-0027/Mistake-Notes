import { Card, Tag } from "antd";
import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import type { RecordSummary } from "../types";
import { MathContent } from "./MathContent";

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
        <MathContent
          source={record.question_text}
          className="record-excerpt"
        />
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