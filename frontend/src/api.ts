import type {
  AuthResponse,
  CatalogResponse,
  Note,
  NoteVersion,
  RecordDetail,
  RecordFilters,
  RecordSummary,
} from "./types";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    let detail = "请求失败，请重试";
    try {
      const body = (await response.json()) as { detail?: string };
      detail = body.detail || detail;
    } catch {
      // Keep the stable fallback message when the response is not JSON.
    }
    throw new ApiError(detail, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const api = {
  login(username: string, password: string) {
    return request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },
  me() {
    return request<AuthResponse>("/api/auth/me");
  },
  logout(csrfToken: string) {
    return request<void>("/api/auth/logout", {
      method: "POST",
      headers: { "X-CSRF-Token": csrfToken },
    });
  },
  catalog(course?: string) {
    const query = new URLSearchParams();
    if (course) query.set("course", course);
    const suffix = query.size ? `?${query.toString()}` : "";
    return request<CatalogResponse>(`/api/catalog${suffix}`);
  },
  records(filters: RecordFilters) {
    const query = new URLSearchParams();
    if (filters.course) query.set("course", filters.course);
    if (filters.knowledgePoint) {
      query.set("knowledgePoint", filters.knowledgePoint);
    }
    if (filters.keyword) query.set("keyword", filters.keyword);
    const suffix = query.size ? `?${query.toString()}` : "";
    return request<RecordSummary[]>(`/api/records${suffix}`);
  },
  record(id: string) {
    return request<RecordDetail>(`/api/records/${encodeURIComponent(id)}`);
  },
  saveNotes(
    id: string,
    note: Pick<Note, "cause_note" | "review_note">,
    csrfToken: string,
    asNewVersion = false,
  ) {
    return request<Note>(`/api/records/${encodeURIComponent(id)}/notes`, {
      method: "PUT",
      headers: { "X-CSRF-Token": csrfToken },
      body: JSON.stringify({ ...note, as_new_version: asNewVersion }),
    });
  },
  noteVersions(id: string) {
    return request<NoteVersion[]>(
      `/api/records/${encodeURIComponent(id)}/notes/versions`,
    );
  },
  restoreNoteVersion(id: string, versionNumber: number, csrfToken: string) {
    return request<Note>(
      `/api/records/${encodeURIComponent(id)}/notes/versions/${versionNumber}/restore`,
      {
        method: "POST",
        headers: { "X-CSRF-Token": csrfToken },
      },
    );
  },
};

