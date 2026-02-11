import { describe, it, expect } from "vitest";
import { computeSplits, validateSplits, type SplitInput } from "../splitCalculator";

describe("computeSplits — equal", () => {
  it("splits evenly when divisible", () => {
    const members: SplitInput[] = [
      { userId: "a" },
      { userId: "b" },
      { userId: "c" },
    ];
    const result = computeSplits(300, "equal", members);
    expect(result).toEqual(
      expect.arrayContaining([
        { userId: "a", amountCents: 100 },
        { userId: "b", amountCents: 100 },
        { userId: "c", amountCents: 100 },
      ])
    );
    expect(result.reduce((s, r) => s + r.amountCents, 0)).toBe(300);
  });

  it("distributes remainder by userId sort order", () => {
    // 100 / 3 = 33 remainder 1 → first alphabetical member gets 34
    const members: SplitInput[] = [
      { userId: "charlie" },
      { userId: "alice" },
      { userId: "bob" },
    ];
    const result = computeSplits(100, "equal", members);
    const byId = Object.fromEntries(result.map((r) => [r.userId, r.amountCents]));
    // sorted: alice, bob, charlie — remainder=1 → alice gets 34
    expect(byId["alice"]).toBe(34);
    expect(byId["bob"]).toBe(33);
    expect(byId["charlie"]).toBe(33);
    expect(result.reduce((s, r) => s + r.amountCents, 0)).toBe(100);
  });

  it("splits correctly with remainder of 2", () => {
    // 101 / 3 = 33 remainder 2 → first 2 alphabetical get 34
    const members: SplitInput[] = [
      { userId: "c" },
      { userId: "a" },
      { userId: "b" },
    ];
    const result = computeSplits(101, "equal", members);
    const byId = Object.fromEntries(result.map((r) => [r.userId, r.amountCents]));
    expect(byId["a"]).toBe(34);
    expect(byId["b"]).toBe(34);
    expect(byId["c"]).toBe(33);
    expect(result.reduce((s, r) => s + r.amountCents, 0)).toBe(101);
  });

  it("handles single member", () => {
    const result = computeSplits(999, "equal", [{ userId: "solo" }]);
    expect(result).toEqual([{ userId: "solo", amountCents: 999 }]);
  });

  it("handles zero total", () => {
    const result = computeSplits(0, "equal", [{ userId: "a" }, { userId: "b" }]);
    expect(result.every((r) => r.amountCents === 0)).toBe(true);
  });
});

describe("computeSplits — percentage", () => {
  it("splits by percentage", () => {
    const members: SplitInput[] = [
      { userId: "a", percentage: 50 },
      { userId: "b", percentage: 50 },
    ];
    const result = computeSplits(200, "percentage", members);
    expect(result.find((r) => r.userId === "a")?.amountCents).toBe(100);
    expect(result.find((r) => r.userId === "b")?.amountCents).toBe(100);
  });

  it("handles unequal percentages", () => {
    const members: SplitInput[] = [
      { userId: "a", percentage: 60 },
      { userId: "b", percentage: 40 },
    ];
    const result = computeSplits(100, "percentage", members);
    expect(result.find((r) => r.userId === "a")?.amountCents).toBe(60);
    expect(result.find((r) => r.userId === "b")?.amountCents).toBe(40);
    expect(result.reduce((s, r) => s + r.amountCents, 0)).toBe(100);
  });

  it("distributes remainder by largest fractional part", () => {
    // 100 / 3 each ≈ 33.33 → remainder 1 cent to member with largest fractional
    const members: SplitInput[] = [
      { userId: "a", percentage: 33.33 },
      { userId: "b", percentage: 33.33 },
      { userId: "c", percentage: 33.34 },
    ];
    const result = computeSplits(100, "percentage", members);
    expect(result.reduce((s, r) => s + r.amountCents, 0)).toBe(100);
  });

  it("throws if percentages do not sum to 100", () => {
    expect(() =>
      computeSplits(100, "percentage", [
        { userId: "a", percentage: 50 },
        { userId: "b", percentage: 40 },
      ])
    ).toThrow();
  });
});

describe("computeSplits — exact", () => {
  it("uses provided exact amounts", () => {
    const members: SplitInput[] = [
      { userId: "a", exactCents: 75 },
      { userId: "b", exactCents: 25 },
    ];
    const result = computeSplits(100, "exact", members);
    expect(result.find((r) => r.userId === "a")?.amountCents).toBe(75);
    expect(result.find((r) => r.userId === "b")?.amountCents).toBe(25);
  });

  it("throws if exact amounts do not sum to total", () => {
    expect(() =>
      computeSplits(100, "exact", [
        { userId: "a", exactCents: 60 },
        { userId: "b", exactCents: 30 },
      ])
    ).toThrow("90");
  });
});

describe("computeSplits — shares", () => {
  it("splits by shares proportionally", () => {
    const members: SplitInput[] = [
      { userId: "a", shares: 1 },
      { userId: "b", shares: 2 },
      { userId: "c", shares: 1 },
    ];
    const result = computeSplits(400, "shares", members);
    expect(result.find((r) => r.userId === "a")?.amountCents).toBe(100);
    expect(result.find((r) => r.userId === "b")?.amountCents).toBe(200);
    expect(result.find((r) => r.userId === "c")?.amountCents).toBe(100);
  });

  it("handles remainder in shares split", () => {
    // 100 cents, shares 1:1:1 — should sum to 100
    const members: SplitInput[] = [
      { userId: "a", shares: 1 },
      { userId: "b", shares: 1 },
      { userId: "c", shares: 1 },
    ];
    const result = computeSplits(100, "shares", members);
    expect(result.reduce((s, r) => s + r.amountCents, 0)).toBe(100);
  });

  it("throws on non-positive shares", () => {
    expect(() =>
      computeSplits(100, "shares", [
        { userId: "a", shares: 0 },
        { userId: "b", shares: 1 },
      ])
    ).toThrow();
  });
});

describe("validateSplits", () => {
  it("returns null for valid equal split", () => {
    expect(
      validateSplits(100, "equal", [{ userId: "a" }, { userId: "b" }])
    ).toBeNull();
  });

  it("returns error for empty members", () => {
    expect(validateSplits(100, "equal", [])).not.toBeNull();
  });

  it("returns error for percentage not summing to 100", () => {
    const err = validateSplits(100, "percentage", [
      { userId: "a", percentage: 50 },
    ]);
    expect(err).toContain("100");
  });

  it("returns error for exact sum mismatch", () => {
    const err = validateSplits(100, "exact", [
      { userId: "a", exactCents: 60 },
      { userId: "b", exactCents: 30 },
    ]);
    expect(err).not.toBeNull();
  });
});
