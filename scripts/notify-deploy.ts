import process from "node:process";

type DeployConclusion = "success" | "cancelled" | "failure";

interface GitHubJobStep {
  name?: string;
  conclusion?: string | null;
}

interface GitHubJob {
  name?: string;
  conclusion?: string | null;
  steps?: GitHubJobStep[] | null;
}

interface GitHubJobsResponse {
  jobs?: GitHubJob[];
}

interface GitHubRunContext {
  repository: string;
  runId: string;
  deployConclusion: DeployConclusion;
}

const GITHUB_API_TIMEOUT_MS = 10_000;
const WEBHOOK_TIMEOUT_MS = 10_000;
const TERMINAL_FAILURE_CONCLUSIONS = [
  "failure",
  "cancelled",
  "timed_out",
  "action_required",
];

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for deploy notifications.`);
  }

  return value;
}

function requireUrlEnv(name: string): URL {
  const value = requireEnv(name);

  try {
    return new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL.`);
  }
}

async function fetchWithTimeout(
  url: URL,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function formatConclusion(conclusion: DeployConclusion): string {
  switch (conclusion) {
    case "success":
      return "succeeded";
    case "cancelled":
      return "was cancelled";
    default:
      return "failed";
  }
}

function isTerminalFailure(conclusion: string | null | undefined): boolean {
  return TERMINAL_FAILURE_CONCLUSIONS.includes(conclusion ?? "");
}

async function fetchRunJobs(
  context: GitHubRunContext
): Promise<Response | null> {
  try {
    return await fetchWithTimeout(
      new URL(
        `/repos/${context.repository}/actions/runs/${context.runId}/jobs?per_page=100`,
        "https://api.github.com"
      ),
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          "User-Agent": "collabsphere-deploy-notifier",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
      GITHUB_API_TIMEOUT_MS
    );
  } catch {
    return null;
  }
}

async function parseJobsResponse(response: Response): Promise<GitHubJob[]> {
  let payload: GitHubJobsResponse;

  try {
    payload = (await response.json()) as GitHubJobsResponse;
  } catch {
    return [];
  }

  return Array.isArray(payload.jobs) ? payload.jobs : [];
}

function findFailingJob(jobs: GitHubJob[]): GitHubJob | undefined {
  return jobs.find((job) => isTerminalFailure(job.conclusion));
}

function findFailingStep(steps: GitHubJobStep[] | null | undefined) {
  const safeSteps = Array.isArray(steps) ? steps : [];
  return safeSteps.find((step) => isTerminalFailure(step.conclusion));
}

async function getFailureStage(
  context: GitHubRunContext
): Promise<string> {
  if (context.deployConclusion === "success" || !process.env.GITHUB_TOKEN) {
    return "";
  }

  const response = await fetchRunJobs(context);
  if (!response || !response.ok) {
    return "";
  }

  const jobs = await parseJobsResponse(response);
  const failingJob = findFailingJob(jobs);

  if (!failingJob) {
    return "";
  }

  const failingStep = findFailingStep(failingJob.steps);

  if (failingStep?.name) {
    return `${failingJob.name ?? "unknown"} / ${failingStep.name}`;
  }

  return failingJob.name ?? "";
}

async function main(): Promise<void> {
  const webhookUrl = requireUrlEnv("DEPLOY_NOTIFICATION_WEBHOOK_URL");
  const deployEnvironment = requireEnv("DEPLOY_ENVIRONMENT");
  const deployConclusion = requireEnv("DEPLOY_CONCLUSION") as DeployConclusion;
  const deployTargetSummary = requireEnv("DEPLOY_TARGET_SUMMARY");
  const repository = requireEnv("GITHUB_REPOSITORY");
  const runId = requireEnv("GITHUB_RUN_ID");
  const serverUrl = requireEnv("GITHUB_SERVER_URL");
  const commitSha = requireEnv("GITHUB_SHA");

  const runUrl = `${serverUrl}/${repository}/actions/runs/${runId}`;
  const shortSha = commitSha.slice(0, 7);
  const failureStage = await getFailureStage({
    repository,
    runId,
    deployConclusion,
  });

  const messageLines = [
    `**Deploy ${formatConclusion(deployConclusion)}**`,
    `Environment: \`${deployEnvironment}\``,
    `Commit: \`${shortSha}\``,
    `Targets: ${deployTargetSummary}`,
    `Run: ${runUrl}`,
  ];

  if (failureStage) {
    messageLines.splice(4, 0, `Failure stage: \`${failureStage}\``);
  }

  try {
    const webhookResponse = await fetchWithTimeout(
      webhookUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: messageLines.join("\n"),
          allowed_mentions: {
            parse: [],
          },
        }),
      },
      WEBHOOK_TIMEOUT_MS
    );

    if (!webhookResponse.ok) {
      const errorBody = (
        await webhookResponse.text().catch(() => "")
      ).slice(0, 200);
      console.warn(
        `Deploy notification request returned HTTP ${webhookResponse.status}${errorBody ? `: ${errorBody}` : "."}`
      );
    } else {
      console.log(
        `Sent deploy notification for ${deployEnvironment} (${deployConclusion}).`
      );
    }
  } catch (error) {
    console.warn(
      `Deploy notification delivery failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
