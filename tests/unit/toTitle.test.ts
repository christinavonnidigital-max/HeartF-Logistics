import assert from "node:assert/strict";
import { toTitle } from "../../utils/toTitle";

assert.equal(toTitle("EMPLOYMENT_STATUS"), "Employment Status");
assert.equal(toTitle("on_leave"), "On Leave");
assert.equal(toTitle(""), "");
assert.equal(toTitle("Already Title"), "Already Title");

console.log("toTitle tests passed");
