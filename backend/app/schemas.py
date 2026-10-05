from pydantic import BaseModel, ConfigDict, Field


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=1, max_length=256)


class StudentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str


class AuthResponse(BaseModel):
    user: StudentOut
    csrf_token: str


class CourseOut(BaseModel):
    id: str
    name: str


class CatalogResponse(BaseModel):
    courses: list[CourseOut]
    knowledge_points: list[str]


class RecordSummary(BaseModel):
    id: str
    course_id: str
    course_name: str
    assignment_id: str
    assignment_title: str
    question_id: str
    question_type: str
    question_text: str
    score: float
    max_score: float
    score_display: str
    max_score_display: str
    knowledge_points: list[str]


class NoteOut(BaseModel):
    cause_note: str
    review_note: str


class RecordDetail(RecordSummary):
    question_format: str
    original_answer: str
    answer_format: str
    feedback: str | None
    grading_source: str
    note: NoteOut


class NoteUpdate(BaseModel):
    cause_note: str = Field(default="", max_length=20_000)
    review_note: str = Field(default="", max_length=20_000)

