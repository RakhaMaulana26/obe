import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { round2 } from "./hitung";

describe("round2", () => {
  it("membulatkan ke 2 desimal", () => assert.equal(round2(1.005 + 1.111), 2.12));
});
