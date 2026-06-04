import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";

const evaluatorSource = readFileSync(
  new URL("../domains/eligibility/eligibility-evaluator.service.ts", import.meta.url),
  "utf8",
);

test("eligibility evaluator stores MaPrimeRenov business rules outside the controller", () => {
  assert.match(evaluatorSource, /class MaPrimeRenovEligibilityService/);
  assert.match(evaluatorSource, /Le prospect est locataire/);
  assert.match(evaluatorSource, /Le logement a moins de 15 ans/);
  assert.match(evaluatorSource, /La surface n'est pas comprise entre 50 m2 et 350 m2/);
  assert.match(evaluatorSource, /Le systeme de chauffage actuel n'est pas eligible/);
  assert.match(evaluatorSource, /Le revenu fiscal est au-dessus du plafond/);
  assert.match(evaluatorSource, /Les informations techniques sont insuffisantes/);
});

test("eligibility routes are attached to leads without changing existing lead route", () => {
  const routeSource = readFileSync(
    new URL("../app/api/leads/[id]/eligibility/route.ts", import.meta.url),
    "utf8",
  );
  const leadRouteSource = readFileSync(
    new URL("../app/api/leads/[id]/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(routeSource, /domains\/eligibility\/eligibility\.controller/);
  assert.match(routeSource, /saveEligibility as POST/);
  assert.doesNotMatch(leadRouteSource, /eligibility/);
});

test("eligibility controller exposes document, note and appointment endpoints", () => {
  const controllerSource = readFileSync(
    new URL("../domains/eligibility/eligibility.controller.ts", import.meta.url),
    "utf8",
  );

  for (const handler of [
    "createDocument",
    "listDocuments",
    "deleteDocument",
    "createNote",
    "listNotes",
    "createAppointment",
    "listLeadAppointments",
    "listAppointments",
  ]) {
    assert.match(controllerSource, new RegExp(`export async function ${handler}`));
  }
});
