import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { request } from "playwright-core";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:8000";
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const casesPath = path.resolve(
  scriptDirectory,
  "../../data/03-wrong-answer-supplement/expected-filters.json",
);
const cases = JSON.parse(fs.readFileSync(casesPath, "utf8")).cases;

let passed = 0;
for (const testCase of cases) {
  const api = await request.newContext({ baseURL: baseUrl });
  try {
    const login = await api.post("/api/auth/login", {
      data: {
        username: testCase.login,
        password: "ExamOnly_2026!",
      },
    });
    assert.equal(login.status(), 200, testCase.caseId);

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(testCase.filters)) {
      params.set(key, value);
    }
    const suffix = params.size ? `?${params.toString()}` : "";
    const response = await api.get(`/api/records${suffix}`);
    assert.equal(response.status(), 200, testCase.caseId);
    const actual = (await response.json()).map((record) => record.id).sort();
    assert.deepEqual(
      actual,
      [...testCase.expectedRecordIds].sort(),
      testCase.caseId,
    );
    passed += 1;
  } finally {
    await api.dispose();
  }
}

console.log(`PASS expected-filters ${passed}/${cases.length}`);

