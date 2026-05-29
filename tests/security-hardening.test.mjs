import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("public auth register route is protected by admin user creation controller", () => {
  const source = read("app/api/auth/register/route.ts");

  assert.match(source, /domains\/users\/user\.controller/);
  assert.doesNotMatch(source, /domains\/auth\/auth\.controller/);
});

test("legacy document, score and notification controllers require admin role", () => {
  for (const path of [
    "domains/documents/document.controller.ts",
    "domains/scores/score.controller.ts",
    "domains/notifications/notification.controller.ts",
  ]) {
    const source = read(path);

    assert.match(source, /requireRole/);
    assert.match(source, /"admin"/);
  }
});

test("agent statistics route is restricted to admin and manager roles", () => {
  const source = read("domains/agent-statistics/agent-statistics.controller.ts");

  assert.match(source, /requireAnyRole/);
  assert.match(source, /\["admin", "manager"\]/);
});

test("business export routes require bearer auth through report controller", () => {
  const source = read("domains/reports/report.controller.ts");

  assert.match(source, /requireAuth/);
  assert.match(source, /exportCommissionsCsv/);
  assert.match(source, /exportDossiersCsv/);
});

