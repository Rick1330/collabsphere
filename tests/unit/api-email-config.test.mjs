import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { repoRoot, runTsc } from "./bootstrap-test-helpers.mjs";

let emailConfigModulePromise;

const importEmailConfigModule = async () => {
  if (emailConfigModulePromise) {
    return emailConfigModulePromise;
  }

  runTsc(path.join(repoRoot, "apps", "api", "tsconfig.json"));
  const moduleUrl = pathToFileURL(
    path.join(repoRoot, "apps", "api", "dist", "config", "email.js"),
  ).href;

  emailConfigModulePromise = import(`${moduleUrl}?t=${Date.now()}`);
  return emailConfigModulePromise;
};

const validProviderEmailInput = Object.freeze({
  EMAIL_PROVIDER_API_KEY: "replace-with-provider-key",
});

const createEmailInput = (overrides = {}) => ({
  ...validProviderEmailInput,
  ...overrides,
});

test("resolveEmailConfig prefers local SMTP settings when both local vars are present", async () => {
  const { resolveEmailConfig } = await importEmailConfigModule();

  const config = resolveEmailConfig({
    ...createEmailInput(),
    EMAIL_SMTP_HOST: "127.0.0.1",
    EMAIL_SMTP_PORT: "1025",
  });

  assert.deepEqual(config, {
    mode: "smtp",
    host: "127.0.0.1",
    port: 1025,
  });
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

test("resolveEmailConfig rejects partial local SMTP settings", async () => {
  const { resolveEmailConfig } = await importEmailConfigModule();

  assert.throws(
    () =>
      resolveEmailConfig({
        ...createEmailInput(),
        EMAIL_SMTP_HOST: "127.0.0.1",
      }),
    /EMAIL_SMTP_HOST and EMAIL_SMTP_PORT/,
  );
});

test("resolveEmailConfig rejects invalid local SMTP ports", async () => {
  const { resolveEmailConfig } = await importEmailConfigModule();

  assert.throws(
    () =>
      resolveEmailConfig({
        ...createEmailInput(),
        EMAIL_SMTP_HOST: "127.0.0.1",
        EMAIL_SMTP_PORT: "1025abc",
      }),
    /EMAIL_SMTP_PORT must be a positive integer/,
  );
});

test("resolveEmailConfig treats blank SMTP port as missing for pair validation", async () => {
  const { resolveEmailConfig } = await importEmailConfigModule();

  assert.throws(
    () =>
      resolveEmailConfig({
        ...createEmailInput(),
        EMAIL_SMTP_HOST: "127.0.0.1",
        EMAIL_SMTP_PORT: "   ",
      }),
    /EMAIL_SMTP_HOST and EMAIL_SMTP_PORT/,
  );
});

test("resolveEmailConfig accepts normalized SMTP port values from runtime parsing", async () => {
  const { resolveEmailConfig } = await importEmailConfigModule();

  const config = resolveEmailConfig({
    EMAIL_SMTP_HOST: "127.0.0.1",
    EMAIL_SMTP_PORT: 1025,
  });

  assert.deepEqual(config, {
    mode: "smtp",
    host: "127.0.0.1",
    port: 1025,
  });
});
