/**
 * Intentionally retained as CommonJS JavaScript.
 *
 * This module is loaded directly by `actions/github-script` in
 * `.github/workflows/implementation-report.yml` via `require(...)` on a clean
 * runner that does not install repo dependencies. Keeping this file as plain
 * JS avoids introducing a TypeScript loader/bootstrap dependency into
 * reporting automation.
 *
 * Required secrets (repository-level):
 *   TELEGRAM_BOT_TOKEN  — bot token from BotFather
 *   TELEGRAM_CHAT_ID    — target channel/chat ID (e.g. -1001234567890)
 *
 * Exported API:
 *   buildReport({ github, context, core })  → Promise<string|null>
 *   sendToTelegram(message, core)           → Promise<void>
 */

"use strict";

const https = require("https");

// ---------------------------------------------------------------------------
// Utility helpers (exported for unit tests)
// ---------------------------------------------------------------------------

/**
 * Escapes characters that carry special meaning in Telegram's HTML parse mode.
 */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Formats an ISO date-time string as YYYY-MM-DD.
 */
function formatDate(dateStr) {
  return new Date(dateStr).toISOString().slice(0, 10);
}

/**
 * Splits a message into chunks that each fit within `maxLength` characters,
 * preferring to break at newline boundaries.
 *
 * @param {string} message
 * @param {number} [maxLength=4096]
 * @returns {string[]}
 */
function splitMessage(message, maxLength = 4096) {
  if (message.length <= maxLength) {
    return [message];
  }

  const chunks = [];
  let current = "";

  for (const line of message.split("\n")) {
    const next = current.length === 0 ? line : `${current}\n${line}`;

    if (next.length > maxLength) {
      if (current.length > 0) {
        chunks.push(current);
      }
      // If a single line is longer than maxLength, hard-split it.
      if (line.length > maxLength) {
        for (let i = 0; i < line.length; i += maxLength) {
          chunks.push(line.slice(i, i + maxLength));
        }
        current = "";
      } else {
        current = line;
      }
    } else {
      current = next;
    }
  }

  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// Telegram delivery
// ---------------------------------------------------------------------------

/**
 * Sends an HTTPS POST request with a JSON body and returns the parsed response.
 *
 * @param {string} url
 * @param {object} data
 * @returns {Promise<object>}
 */
function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const parsed = new URL(url);

    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => {
        raw += chunk;
      });
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(raw));
        } else {
          reject(new Error(`Telegram API responded with HTTP ${res.statusCode}: ${raw}`));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

/**
 * Posts `message` to the Telegram channel/chat identified by the
 * TELEGRAM_CHAT_ID environment variable using TELEGRAM_BOT_TOKEN.
 *
 * Long messages are automatically split into multiple deliveries.
 * If credentials are absent the report is printed to the workflow log
 * instead of being sent, so the workflow does not fail in forks or
 * environments that have not configured the secrets.
 *
 * @param {string} message
 * @param {{ info: (msg: string) => void, warning: (msg: string) => void }} core
 */
async function sendToTelegram(message, core) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    core.warning(
      "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID secret is not configured. " +
        "Printing report to workflow log only."
    );
    core.info(`\n${message}`);
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const chunks = splitMessage(message);

  core.info(`Sending ${chunks.length} message chunk(s) to Telegram (chat: ${chatId}) …`);

  for (let i = 0; i < chunks.length; i++) {
    await postJson(url, {
      chat_id: chatId,
      text: chunks[i],
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
    core.info(`  Chunk ${i + 1}/${chunks.length} sent.`);
  }

  core.info("Implementation report delivered to Telegram.");
}

// ---------------------------------------------------------------------------
// Report builders
// ---------------------------------------------------------------------------

/**
 * Returns the label names for an issue as an array of strings.
 *
 * @param {{ labels?: Array<string|{name:string}> }} issue
 * @returns {string[]}
 */
function getLabelNames(issue) {
  return (issue.labels || [])
    .map((label) => (typeof label === "string" ? label : label.name))
    .filter(Boolean);
}

/**
 * Builds a concise notification for a single PR-merge event.
 *
 * @param {{ github: object, context: object, core: object, owner: string, repo: string }} opts
 * @returns {Promise<string|null>}
 */
async function buildPrMergeReport({ github, context, core, owner, repo }) {
  const pr = context.payload.pull_request;

  if (!pr) {
    core.info("No pull_request payload found. Skipping PR-merge report.");
    return null;
  }

  const { number: prNumber, title: prTitle, html_url: prUrl, body: prBody = "" } = pr;
  const prAuthor = pr.user ? pr.user.login : "unknown";
  const mergedAt = pr.merged_at ? formatDate(pr.merged_at) : "unknown";

  // Extract issue numbers referenced with closing keywords or refs in the PR body.
  const closingRe = /(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s*#(\d+)/gi;
  const refRe = /(?:ref(?:s|erences)?)\s*#(\d+)/gi;
  const linkedNumbers = new Set([
    ...[...prBody.matchAll(closingRe)].map((m) => Number(m[1])),
    ...[...prBody.matchAll(refRe)].map((m) => Number(m[1])),
  ]);

  const linkedIssues = [];
  for (const issueNumber of linkedNumbers) {
    try {
      const { data: issue } = await github.rest.issues.get({
        owner,
        repo,
        issue_number: issueNumber,
      });
      if (!issue.pull_request) {
        linkedIssues.push(issue);
      }
    } catch (err) {
      core.warning(`Could not fetch linked issue #${issueNumber}: ${err.message}`);
    }
  }

  let message = `🔀 <b>PR Merged: #${prNumber}</b>\n`;
  message += `📋 ${escapeHtml(prTitle)}\n`;
  message += `👤 Author: @${escapeHtml(prAuthor)}\n`;
  message += `📅 Merged: ${mergedAt}\n`;
  message += `🔗 <a href="${escapeHtml(prUrl)}">${escapeHtml(owner)}/${escapeHtml(repo)} #${prNumber}</a>\n`;

  if (linkedIssues.length > 0) {
    message += `\n<b>🔗 Linked Issues (${linkedIssues.length})</b>\n`;
    for (const issue of linkedIssues) {
      const labels = getLabelNames(issue);
      const typeLabel = labels.find((l) => l.startsWith("type:"));
      const statusLabel = labels.find((l) => l.startsWith("status:"));
      const TYPE_ICONS = { "type:task": "✔", "type:story": "📖", "type:epic": "📦" };
      const typeIcon = (typeLabel && TYPE_ICONS[typeLabel]) || "•";
      const stateIcon = issue.state === "closed" ? "✅" : "🔄";
      const statusText = statusLabel ? ` [${statusLabel.replace("status:", "")}]` : "";
      message += `  ${typeIcon} ${stateIcon} <a href="${escapeHtml(issue.html_url)}">#${issue.number}</a> ${escapeHtml(issue.title)}${statusText}\n`;
    }
  }

  return message;
}

/**
 * Builds a periodic (scheduled or manually-dispatched) report covering
 * merged PRs and closed issues in the last `sinceDays` days.
 *
 * @param {{ github: object, context: object, core: object, owner: string, repo: string }} opts
 * @returns {Promise<string>}
 */
async function buildPeriodicReport({ github, core, owner, repo }) {
  const sinceDays = Math.max(1, parseInt(process.env.SINCE_DAYS || "7", 10));
  const now = new Date();
  const since = new Date(now.getTime() - sinceDays * 24 * 60 * 60 * 1000);
  const sinceDate = since.toISOString().slice(0, 10);
  const nowDate = now.toISOString().slice(0, 10);

  core.info(`Building periodic report: ${sinceDate} → ${nowDate} (${sinceDays} days)`);

  // --- Merged PRs via GitHub search API -----------------------------------
  const mergedPrs = [];
  let searchPage = 1;
  while (true) {
    const { data: searchResult } = await github.rest.search.issuesAndPullRequests({
      q: `repo:${owner}/${repo} is:pr is:merged merged:>=${sinceDate}`,
      sort: "updated",
      order: "desc",
      per_page: 100,
      page: searchPage,
    });
    mergedPrs.push(...searchResult.items);
    if (searchResult.items.length < 100) break;
    searchPage++;
  }

  // --- Closed issues via GitHub search API --------------------------------
  const closedIssues = [];
  let issuePage = 1;
  while (true) {
    const { data: issueResult } = await github.rest.search.issuesAndPullRequests({
      q: `repo:${owner}/${repo} is:issue is:closed closed:>=${sinceDate}`,
      sort: "updated",
      order: "desc",
      per_page: 100,
      page: issuePage,
    });
    closedIssues.push(...issueResult.items);
    if (issueResult.items.length < 100) break;
    issuePage++;
  }

  const epicIssues = closedIssues.filter((i) => getLabelNames(i).includes("type:epic"));
  const storyIssues = closedIssues.filter((i) => getLabelNames(i).includes("type:story"));
  const taskIssues = closedIssues.filter((i) => getLabelNames(i).includes("type:task"));

  // --- Compose message ----------------------------------------------------
  const DIVIDER = "━━━━━━━━━━━━━━━━━━━━";

  let message = `📊 <b>CollabSphere Implementation Report</b>\n`;
  message += `📅 Period: ${sinceDate} – ${nowDate}\n`;
  message += `🔗 <b>${escapeHtml(owner)}/${escapeHtml(repo)}</b>\n`;

  // Merged PRs
  message += `\n${DIVIDER}\n`;
  message += `🔀 <b>Merged Pull Requests (${mergedPrs.length})</b>\n`;
  message += `${DIVIDER}\n`;

  if (mergedPrs.length === 0) {
    message += `<i>No PRs merged in this period.</i>\n`;
  } else {
    const displayed = mergedPrs.slice(0, 20);
    for (const pr of displayed) {
      const author = pr.user ? pr.user.login : "unknown";
      const mergedAt = pr.merged_at ? formatDate(pr.merged_at) : "";
      const dateStr = mergedAt ? ` (${mergedAt})` : "";
      message += `• <a href="${escapeHtml(pr.html_url)}">#${pr.number}</a> ${escapeHtml(pr.title)} — @${escapeHtml(author)}${dateStr}\n`;
    }
    if (mergedPrs.length > 20) {
      message += `<i>…and ${mergedPrs.length - 20} more</i>\n`;
    }
  }

  // Completed work
  message += `\n${DIVIDER}\n`;
  message += `✅ <b>Completed Work</b>\n`;
  message += `${DIVIDER}\n`;

  if (epicIssues.length === 0 && storyIssues.length === 0 && taskIssues.length === 0) {
    message += `<i>No issues closed in this period.</i>\n`;
  }

  if (epicIssues.length > 0) {
    message += `\n📦 <b>Projects / Epics (${epicIssues.length})</b>\n`;
    for (const epic of epicIssues) {
      message += `  📦 <a href="${escapeHtml(epic.html_url)}">#${epic.number}</a> ${escapeHtml(epic.title)}\n`;
    }
  }

  if (storyIssues.length > 0) {
    message += `\n📖 <b>Stories (${storyIssues.length})</b>\n`;
    for (const story of storyIssues) {
      message += `  📖 <a href="${escapeHtml(story.html_url)}">#${story.number}</a> ${escapeHtml(story.title)}\n`;
    }
  }

  if (taskIssues.length > 0) {
    message += `\n✔ <b>Tasks (${taskIssues.length})</b>\n`;
    const displayedTasks = taskIssues.slice(0, 30);
    for (const task of displayedTasks) {
      message += `  ✔ <a href="${escapeHtml(task.html_url)}">#${task.number}</a> ${escapeHtml(task.title)}\n`;
    }
    if (taskIssues.length > 30) {
      message += `  <i>…and ${taskIssues.length - 30} more tasks</i>\n`;
    }
  }

  // Summary
  message += `\n${DIVIDER}\n`;
  message += `📈 <b>Summary</b>\n`;
  message += `${DIVIDER}\n`;
  message += `• PRs merged:          <b>${mergedPrs.length}</b>\n`;
  message += `• Tasks completed:     <b>${taskIssues.length}</b>\n`;
  message += `• Stories completed:   <b>${storyIssues.length}</b>\n`;
  message += `• Projects completed:  <b>${epicIssues.length}</b>\n`;

  return message;
}

/**
 * Entry point called from the `actions/github-script` inline script.
 * Returns the formatted report string, or null if nothing should be sent.
 *
 * @param {{ github: object, context: object, core: object }} opts
 * @returns {Promise<string|null>}
 */
async function buildReport({ github, context, core }) {
  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const eventName = process.env.EVENT_NAME || "";

  if (eventName === "pull_request") {
    return buildPrMergeReport({ github, context, core, owner, repo });
  }

  return buildPeriodicReport({ github, context, core, owner, repo });
}

module.exports = {
  buildReport,
  sendToTelegram,
  // Exported utilities (consumed by unit tests)
  escapeHtml,
  formatDate,
  splitMessage,
};
