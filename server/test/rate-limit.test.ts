import { expect, test } from "bun:test"

import { fixedWindow } from "../src/rate-limit"

test("each key gets max calls per window, then a fresh window", () => {
  const allow = fixedWindow(2, 1000)
  expect([allow("u_a", 0), allow("u_a", 10), allow("u_a", 20)]).toEqual([true, true, false])
  expect(allow("u_b", 20)).toBe(true)
  expect(allow("u_a", 1000)).toBe(true)
})
