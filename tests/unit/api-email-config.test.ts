import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { repoRoot, runTsc, runTsx } from "./bootstrap-test-helpers.ts";

let emailConfigModulePromise: Promise<typeof import("../../apps/api/dist/config/email.js")> | undefined;

const importEmailConfigModule = async () => {
  if (emailConfigModulePromise) {
    return emailConfigModulePromise;
  }

  runTsc(path.join(repoRoot, "apps", "api", "tsconfig.json"));
  runTsx("scripts/build-bootstrap-app.ts", "apps/api");
  const moduleUrl = pathToFileURL(
    path.join(repoRoot, "apps", "api", "dist", "config", "email.js"),
  ).href;

  emailConfigModulePromise = import(`${moduleUrl}?t=${Date.now()}`);
  return emailConfigModulePromise;
};

const validProviderEmailInput = Object.freeze({
  EMAIL_PROVIDER_API_KEY: "replace-with-provider-key",
});

const createEmailInput = (overrides: Record<string, string | number | undefined> = {}) => ({
  ...validProviderEmailInput,
  ...overrides,
});

test("resolveEmailConfig prefers local SMTP settings when both local vars are present", async () => {
  const { resolveEmailConfig } = await importEmailConfigModule();
  const smtpCases = [
    { EMAIL_SMTP_HOST: "127.0.0.1", EMAIL_SMTP_PORT: "1025" },
    { EMAIL_SMTP_HOST: "127.0.0.1", EMAIL_SMTP_PORT: 1025 },
  ];

  for (const input of smtpCases) {
    const config = resolveEmailConfig(createEmailInput(input));

    assert.deepEqual(config, {
      mode: "smtp",
      host: "127.0.0.1",
      port: 1025,
    });
  }
});

test("resolveEmailConfig falls back to provider configuration when local SMTP is absent", async () => {
  const { resolveEmailConfig } = await importEmailConfigModule();

  const config = resolveEmailConfig({
    ...createEmailInput(),
  });

  assert.deepEqual(config, {
    mode: "provider",
    apiKey: "replace-with-provider-key",
  });
});

test("resolveEmailConfig rejects invalid or incomplete local SMTP settings", async () => {
  const { resolveEmailConfig } = await importEmailConfigModule();
  const errorCases = [
    {
      input: { EMAIL_SMTP_HOST: "127.0.0.1" },
      pattern: /EMAIL_SMTP_HOST and EMAIL_SMTP_PORT/,
    },
    {
      input: { EMAIL_SMTP_HOST: "127.0.0.1", EMAIL_SMTP_PORT: "1025abc" },
      pattern: /EMAIL_SMTP_PORT must be a positive integer/,
    },
    {
      input: { EMAIL_SMTP_HOST: "127.0.0.1", EMAIL_SMTP_PORT: "   " },
      pattern: /EMAIL_SMTP_HOST and EMAIL_SMTP_PORT/,
    },
  ];

  for (const errorCase of errorCases) {
    assert.throws(
      () => resolveEmailConfig(createEmailInput(errorCase.input)),
      errorCase.pattern,
    );
  }
});
