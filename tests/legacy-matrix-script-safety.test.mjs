import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("legacy matrix unifier is fail-closed and cannot merge or push", async () => {
  const source = await readFile(new URL("../pirc_matrix_unifier_and_sync.sh", import.meta.url), "utf8");
  assert.match(source, /DEPRECATED \/ FAIL-CLOSED/);
  assert.match(source, /exit 2/);
  assert.doesNotMatch(source, /git merge --no-ff|git push origin main|find \. -name/);
  assert.doesNotMatch(source, /status: "ACTIVE"|qwf_eff: 128|phi_solvency: true/);
});
