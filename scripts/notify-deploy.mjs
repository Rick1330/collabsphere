import process from "node:process";

const REQUIRED_ENV_VARS = [
  "DEPLOY_NOTIFICATION_WEBHOOK_URL",
  "DEPLOY_ENVIRONMENT",
  "DEPLOY_CONCLUSION",
  "DEPLOY_TARGET_SUMMARY",
  "GITHUB_REPOSITORY",
  "GITHUB_RUN_ID",
  "GITHUB_SERVER_URL",
  "GITHUB_SHA",
];

for (const name of REQUIRED_ENV_VARS) {
  if (!process.env[name]) {
    throw new Error(`${name} is required for deploy notifications.`);
  }
}

const webhookUrl = process.env.DEPLOY_NOTIFICATION_WEBHOOK_URL;
const deployEnvironment = process.env.DEPLOY_ENVIRONMENT;
const deployConclusion = process.env.DEPLOY_CONCLUSION;
const deployTargetSummary = process.env.DEPLOY_TARGET_SUMMARY;
const repository = process.env.GITHUB_REPOSITORY;
const runId = process.env.GITHUB_RUN_ID;
const serverUrl = process.env.GITHUB_SERVER_URL;
const commitSha = process.env.GITHUB_SHA;

const runUrl = `${serverUrl}/${repository}/actions/runs/${runId}`;
const shortSha = commitSha.slice(0, 7);

function formatConclusion(conclusion) {
  switch (conclusion) {
    case "success":
      return "succeeded";
    case "cancelled":
      return "was cancelled";
    default:
      return "failed";
  }
}

async function getFailureStage() {
  if (deployConclusion === "success" || !process.env.GITHUB_TOKEN) {
    return "";
  }

  const response = await fetch(
    `https://api.github.com/repos/${repository}/actions/runs/${runId}/jobs?per_page=100`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "User-Agent": "collabsphere-deploy-notifier",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!response.ok) {
    return "";
  }

  const payload = await response.json();
  const jobs = payload.jobs ?? [];
  const failingJob = jobs.find((job) =>
    ["failure", "cancelled", "timed_out", "action_required"].includes(
      job.conclusion
    )
  );

  if (!failingJob) {
    return "";
  }

  const failingStep = (failingJob.steps ?? []).find((step) =>
    ["failure", "cancelled", "timed_out", "action_required"].includes(
      step.conclusion
    )
  );

  if (failingStep) {
    return `${failingJob.name} / ${failingStep.name}`;
  }

  return failingJob.name;
}

const failureStage = await getFailureStage();

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

const webhookResponse = await fetch(webhookUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    content: messageLines.join("\n"),
  }),
});

if (!webhookResponse.ok) {
  throw new Error(
    `Deploy notification failed with HTTP ${webhookResponse.status}.`
  );
}

console.log(
  `Sent deploy notification for ${deployEnvironment} (${deployConclusion}).`
);
