import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:8000";
const bundledChromiumPath = chromium.executablePath();
const chromePath =
  process.env.CHROME_PATH ||
  (fs.existsSync(bundledChromiumPath) ? bundledChromiumPath : undefined) ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const password = "ExamOnly_2026!";
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "../..");
const docsDirectory = path.join(repositoryRoot, "docs");
const recordingDirectory = path.join(docsDirectory, ".record-video");
const browserRecordingDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), "mistake-notes-demo-"),
);
const outputPath = path.join(docsDirectory, "demo.mp4");

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} exited with status ${result.status}`);
  }
}

function commandAvailable(command) {
  const result = spawnSync(command, ["-version"], { stdio: "ignore" });
  return !result.error && result.status === 0;
}

function convertToMp4(inputPath) {
  const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
  const commonArgs = [
    "-y",
    "-i",
    inputPath,
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "28",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-an",
  ];

  if (commandAvailable(ffmpegPath)) {
    run(ffmpegPath, [...commonArgs, outputPath]);
    return;
  }

  const inputRelativePath = path
    .relative(docsDirectory, inputPath)
    .replaceAll("\\", "/");
  run("docker", [
    "run",
    "--rm",
    "-v",
    `${docsDirectory}:/work`,
    "linuxserver/ffmpeg",
    ...commonArgs.slice(0, 2),
    `/work/${inputRelativePath}`,
    ...commonArgs.slice(3),
    "/work/demo.mp4",
  ]);
}

fs.mkdirSync(docsDirectory, { recursive: true });
fs.rmSync(recordingDirectory, { recursive: true, force: true });
fs.mkdirSync(recordingDirectory, { recursive: true });

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: process.env.DEMO_HEADLESS !== "0",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

let context;
let recordingPath;
try {
  context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: browserRecordingDirectory,
      size: { width: 1920, height: 1080 },
    },
  });
  const page = await context.newPage();
  const video = page.video();

  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.locator('input[autocomplete="username"]').fill("student_001");
  await page.locator('input[autocomplete="current-password"]').fill(password);
  await Promise.all([
    page.waitForURL("**/records"),
    page.getByRole("button", { name: "登录" }).click(),
  ]);
  await page.locator(".record-card").first().waitFor();
  await page.waitForTimeout(700);

  const keyword = page.locator('input[aria-label="关键词"]');
  await keyword.fill("写出四阶");
  await keyword.press("Enter");
  await page.getByText("共 1 条", { exact: true }).waitFor();
  await page.waitForTimeout(600);

  await page.locator(".record-card").first().click();
  await page.waitForURL("**/records/wrong_001?**");
  await page.locator("#cause-note").waitFor();
  await page.waitForTimeout(500);

  const causeText = `演示复盘-${Date.now()}`;
  await page.locator("#cause-note").fill(causeText);
  await page.locator("#review-note").fill("先判断行列式结构，再检查符号与展开项。");
  await page.getByRole("button", { name: "保存笔记" }).click();
  await page.getByText("笔记已保存", { exact: true }).waitFor();
  await page.waitForTimeout(500);

  await page.getByRole("button", { name: "小窗记笔记" }).click();
  const floatingPanel = page.locator(".floating-note-panel");
  await floatingPanel.waitFor();
  const dragHeader = floatingPanel.locator(".floating-note-header");
  const headerBox = await dragHeader.boundingBox();
  assert.ok(headerBox, "浮窗标题栏应可拖动");
  await page.mouse.move(headerBox.x + 120, headerBox.y + 22);
  await page.mouse.down();
  await page.mouse.move(headerBox.x - 160, headerBox.y + 120, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  await floatingPanel.getByRole("button", { name: "收起小窗" }).click();
  await page.waitForTimeout(350);
  await floatingPanel.getByRole("button", { name: "展开小窗" }).click();
  await page.waitForTimeout(350);
  await floatingPanel.getByRole("button", { name: "关闭小窗" }).click();

  const versionLabel = `演示版本-${Date.now()}`;
  await page.locator("#cause-note").fill(`${causeText}-新版本`);
  await page.getByRole("button", { name: "另存为新版本" }).click();
  await page.locator("#new-version-label").fill(versionLabel);
  await page.getByRole("button", { name: "创建新版本" }).click();
  await page.getByText("已另存为新版本", { exact: true }).waitFor();
  await page.waitForTimeout(400);

  await page.getByRole("button", { name: "历史版本" }).click();
  await page.locator(".note-history-drawer .version-item").first().waitFor();
  await page
    .locator(".note-history-drawer")
    .getByText(versionLabel, { exact: true })
    .waitFor();
  await page.waitForTimeout(1400);

  await context.close();
  context = undefined;
  const browserRecordingPath = await video.path();
  recordingPath = path.join(recordingDirectory, "demo.webm");
  fs.copyFileSync(browserRecordingPath, recordingPath);
} finally {
  if (context) await context.close();
  await browser.close();
}

if (!recordingPath) throw new Error("Playwright did not produce a recording");
assert.ok(fs.existsSync(recordingPath), "Playwright recording is missing");
convertToMp4(recordingPath);
assert.ok(fs.existsSync(outputPath), "MP4 output is missing");
assert.ok(fs.statSync(outputPath).size > 0, "MP4 output is empty");
fs.rmSync(recordingDirectory, { recursive: true, force: true });
fs.rmSync(browserRecordingDirectory, { recursive: true, force: true });
console.log(`PASS demo recorded -> ${outputPath}`);
