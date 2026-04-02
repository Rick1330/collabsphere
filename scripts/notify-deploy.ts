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

const GITHUB_API_TIMEOUT_MS = 10_000;
const WEBHOOK_TIMEOUT_MS = 10_000;

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for deploy notifications.`);
  }

  return value;
}

function requireUrlEnv(name: string): string {
  const value = requireEnv(name);

  try {
    new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL.`);
  }

  return value;
}

async function fetchWithTimeout(
  url: string,
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

async function getFailureStage(
  repository: string,
  runId: string,
  deployConclusion: DeployConclusion
): Promise<string> {
  if (deployConclusion === "success" || !process.env.GITHUB_TOKEN) {
    return "";
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(
      `https://api.github.com/repos/${repository}/actions/runs/${runId}/jobs?per_page=100`,
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
    return "";
  }

  if (!response.ok) {
    return "";
  }

  let payload: GitHubJobsResponse;
  try {
    payload = (await response.json()) as GitHubJobsResponse;
  } catch {
    return "";
  }

  const jobs = payload.jobs ?? [];
  const failingJob = jobs.find((job) =>
    ["failure", "cancelled", "timed_out", "action_required"].includes(
      job.conclusion ?? ""
    )
  );

  if (!failingJob) {
    return "";
  }

  const failingStep = (failingJob.steps ?? []).find((step) =>
    ["failure", "cancelled", "timed_out", "action_required"].includes(
      step.conclusion ?? ""
    )
  );

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
  const failureStage = await getFailureStage(
    repository,
    runId,
    deployConclusion
  );

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
