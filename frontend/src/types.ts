export interface Student {
  id: string;
  name: string;
}

export interface AuthResponse {
  user: Student;
  csrf_token: string;
}

export interface Course {
  id: string;
  name: string;
}

export interface CatalogResponse {
  courses: Course[];
  knowledge_points: string[];
}

export interface RecordSummary {
  id: string;
  course_id: string;
  course_name: string;
  assignment_id: string;
  assignment_title: string;
  question_id: string;
  question_type: string;
  question_text: string;
  score: number;
  max_score: number;
  score_display: string;
  max_score_display: string;
  knowledge_points: string[];
}

export interface Note {
  cause_note: string;
  review_note: string;
  version_number: number;
}

export interface NoteVersion extends Note {
  created_at: string;
}

export interface RecordDetail extends RecordSummary {
  question_format: string;
  original_answer: string;
  answer_format: "html" | "text_latex";
  feedback: string | null;
  grading_source: "AI" | "TEACHER";
  note: Note;
}

export interface RecordFilters {
  course?: string;
  knowledgePoint?: string;
  keyword?: string;
}

