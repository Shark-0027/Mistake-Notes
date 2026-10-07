import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:8000";
const chromePath =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const password = "ExamOnly_2026!";

async function login(page, username) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.locator('input[autocomplete="username"]').fill(username);
  await page.locator('input[autocomplete="current-password"]').fill(password);
  await Promise.all([
    page.waitForURL("**/records"),
    page.getByRole("button", { name: "登录" }).click(),
  ]);
  await page.waitForSelector(".record-card");
}

async function openRecord(page, recordId) {
  await page.goto(`${baseUrl}/records/${recordId}`, {
    waitUntil: "networkidle",
  });
}

async function runCase(name, callback) {
  const startedAt = Date.now();
  await callback();
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(2);
  console.log(`PASS ${name} (${elapsed}s)`);
}

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--no-sandbox"],
});

try {
  await runCase("列表卡片渲染公式而非源码", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, "student_001");
    await page.locator(".record-card .katex").first().waitFor();
    assert.ok((await page.locator(".record-card .katex").count()) > 0);
    const summaries = await page.locator(".record-card .record-excerpt").allInnerTexts();
    assert.ok(summaries.every((text) => !text.includes("$$") && !text.includes("\\begin")));
    await context.close();
  });
  await runCase("WA-03 笔记保存并跨刷新保留", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, "student_001");
    await openRecord(page, "wrong_001");
    await page.locator("#cause-note").fill("复习行列式");
    await page.locator("#review-note").fill("检查带负号项");
    await page.getByRole("button", { name: "保存笔记" }).click();
    await page.waitForSelector(".ant-message-success");
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.locator("#cause-note").inputValue(), "复习行列式");
    assert.equal(await page.locator("#review-note").inputValue(), "检查带负号项");
    await context.close();
  });

  await runCase("WA-04 清空保存后保持为空", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, "student_001");
    await openRecord(page, "wrong_001");
    await page.locator('button:has-text("清空")').nth(0).click();
    await page.locator('button:has-text("清空")').nth(1).click();
    await page.getByRole("button", { name: "保存笔记" }).click();
    await page.waitForSelector(".ant-message-success");
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.locator("#cause-note").inputValue(), "");
    assert.equal(await page.locator("#review-note").inputValue(), "");
    await context.close();
  });

  await runCase("WA-05 越权详情被拒绝", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, "student_002");
    await openRecord(page, "wrong_001");
    await page.getByText("无法读取这条错题").waitFor();
    await page.getByText("无权访问该记录").waitFor();
    await context.close();
  });

  await runCase("WA-06 null 评语显示占位", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, "student_005");
    await openRecord(page, "wrong_010");
    await page.getByText("暂无评语").waitFor();
    await context.close();
  });

  await runCase("WA-07 空知识点显示占位", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, "student_001");
    await openRecord(page, "wrong_001");
    await page.locator(".knowledge-block").getByText("未标注").waitFor();
    await context.close();
  });

  await runCase("WA-08 KaTeX 与安全 HTML 结构可读", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, "student_001");
    await openRecord(page, "wrong_001");
    assert.ok((await page.locator(".question-panel .katex").count()) > 0);
    assert.ok((await page.locator(".safe-answer sub").count()) > 0);
    await page.getByText("写出四阶行列式").waitFor();
    await context.close();
  });

  await runCase("WA-08b 坏公式仅降级单片段", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, "student_001");
    await page.route("**/api/records/wrong_001", async (route) => {
      const response = await route.fetch();
      const payload = await response.json();
      payload.question_text = `${payload.question_text}\n$$\\frac{$$$`;
      await route.fulfill({ response, json: payload });
    });
    await openRecord(page, "wrong_001");
    await page.waitForSelector(".question-panel .katex-error");
    assert.ok((await page.locator(".question-panel .katex").count()) > 0);
    assert.ok((await page.locator(".question-panel .katex-error").count()) > 0);
    const badFormula = await page
      .locator(".question-panel .katex-error")
      .last()
      .textContent();
    assert.ok(badFormula?.includes("\\frac{"));
    assert.equal(await page.locator(".question-panel .formula-fallback").count(), 0);
    await context.close();
  });

  await runCase("WA-09 恶意 HTML 探针被 DOMPurify 清除", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, "student_001");
    await page.route("**/api/records/wrong_001", async (route) => {
      const response = await route.fetch();
      const payload = await response.json();
      payload.original_answer =
        '<script>window.__probe=1</script><img src=x onerror="window.__probe=2"><p onclick="window.__probe=3">安全内容</p>';
      await route.fulfill({ response, json: payload });
    });
    await openRecord(page, "wrong_001");
    await page.getByText("安全内容").waitFor();
    assert.equal(await page.evaluate(() => window.__probe), undefined);
    const rendered = await page.locator(".safe-answer").innerHTML();
    assert.ok(!rendered.includes("script"));
    assert.ok(!rendered.includes("onclick"));
    assert.ok(!rendered.includes("onerror"));
    await context.close();
  });

  await runCase("WA-10 返回列表保留筛选条件", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, "student_001");
    await page.goto(
      `${baseUrl}/records?course=course_001&keyword=${encodeURIComponent("写出四阶")}`,
      { waitUntil: "networkidle" },
    );
    await page.getByText("共 1 条").waitFor();
    await page.locator(".record-link").first().click();
    await page.waitForURL("**/records/wrong_001?**");
    await page.getByRole("button", { name: "返回列表" }).click();
    await page.waitForURL("**/records?course=course_001&keyword=*");
    await page.getByText("共 1 条").waitFor();
    await context.close();
  });

  await runCase("WA-11 保存失败保留输入且不虚报成功", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, "student_001");
    await page.route("**/api/records/wrong_001/notes", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "模拟保存失败" }),
      });
    });
    await openRecord(page, "wrong_001");
    const value = "失败时必须保留";
    await page.locator("#cause-note").fill(value);
    await page.getByRole("button", { name: "保存笔记" }).click();
    await page.waitForSelector(".ant-message-error");
    assert.equal(await page.locator("#cause-note").inputValue(), value);
    await context.close();
  });

  await runCase("核心流程重登确认", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, "student_001");
    await page.goto(
      `${baseUrl}/records?course=course_001&keyword=${encodeURIComponent("写出四阶")}`,
      { waitUntil: "networkidle" },
    );
    await page.getByText("共 1 条").waitFor();
    await page.locator(".record-link").first().click();
    await page.waitForURL("**/records/wrong_001?**");
    await page.locator("#cause-note").fill("核心流程重登保留");
    await page.locator("#review-note").fill("二次登录后仍存在");
    await page.getByRole("button", { name: "保存笔记" }).click();
    await page.waitForSelector(".ant-message-success");

    await page.getByRole("button", { name: "退出" }).click();
    await page.waitForURL("**/login");
    await page.locator('input[autocomplete="username"]').fill("student_001");
    await page.locator('input[autocomplete="current-password"]').fill(password);
    await Promise.all([
      page.waitForURL("**/records/wrong_001?**"),
      page.getByRole("button", { name: "登录" }).click(),
    ]);
    await openRecord(page, "wrong_001");
    assert.equal(await page.locator("#cause-note").inputValue(), "核心流程重登保留");
    assert.equal(await page.locator("#review-note").inputValue(), "二次登录后仍存在");

    await page.locator('button:has-text("清空")').nth(0).click();
    await page.locator('button:has-text("清空")').nth(1).click();
    await page.getByRole("button", { name: "保存笔记" }).click();
    await page.waitForSelector(".ant-message-success");
    await page.getByRole("button", { name: "退出" }).click();
    await page.waitForURL("**/login");
    await page.locator('input[autocomplete="username"]').fill("student_001");
    await page.locator('input[autocomplete="current-password"]').fill(password);
    await Promise.all([
      page.waitForURL("**/records/wrong_001"),
      page.getByRole("button", { name: "登录" }).click(),
    ]);
    await openRecord(page, "wrong_001");
    assert.equal(await page.locator("#cause-note").inputValue(), "");
    assert.equal(await page.locator("#review-note").inputValue(), "");
    await context.close();
  });
  await runCase("P3 分数按原始整数显示", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, "student_001");
    await page.getByText("8.36 / 10", { exact: true }).first().waitFor();
    await openRecord(page, "wrong_001");
    await page.getByText("8.36 / 10", { exact: true }).first().waitFor();
    assert.equal(await page.getByText("8.36 / 10.0", { exact: true }).count(), 0);
    await context.close();
  });
  await runCase("P3 catalog 错误不遮挡列表", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.route("**/api/catalog*", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "模拟 catalog 失败" }),
      });
    });
    await login(page, "student_001");
    await page.locator(".filter-alert").waitFor();
    assert.ok((await page.locator(".record-card").count()) > 0);
    assert.equal(await page.getByText("错题列表加载失败").count(), 0);
    await context.close();
  });

  await runCase("P3 知识点竞态保留有效筛选", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, "student_004");
    await page.goto(`${baseUrl}/records?course=course_001`, {
      waitUntil: "networkidle",
    });
    await page.route("**/api/catalog*", async (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get("course") === "course_002") {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
      await route.continue();
    });
    await page.evaluate(() => {
      history.pushState(
        {},
        "",
        "/records?course=course_002&knowledgePoint=" +
          encodeURIComponent("向量组的秩"),
      );
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await page.waitForTimeout(200);
    assert.equal(
      new URL(page.url()).searchParams.get("knowledgePoint"),
      "向量组的秩",
    );
    await page.waitForTimeout(1400);
    assert.equal(
      new URL(page.url()).searchParams.get("knowledgePoint"),
      "向量组的秩",
    );
    await context.close();
  });

  await runCase("P3 未登录深链保留筛选", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(
      `${baseUrl}/records?course=course_001&keyword=${encodeURIComponent("写出四阶")}`,
      { waitUntil: "networkidle" },
    );
    await page.waitForURL("**/login");
    await page.locator('input[autocomplete="username"]').fill("student_001");
    await page.locator('input[autocomplete="current-password"]').fill(password);
    await Promise.all([
      page.waitForURL("**/records?course=course_001&keyword=*"),
      page.getByRole("button", { name: "登录" }).click(),
    ]);
    await page.getByText("共 1 条").waitFor();
    await context.close();
  });
  await runCase("主题切换即时生效", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, "student_001");
    await page.getByText("夜间").click();
    assert.equal(
      await page.evaluate(() => document.documentElement.dataset.theme),
      "dark",
    );
    await context.close();
  });
} finally {
  await browser.close();
}

