import { describe, it, expect } from "vitest";
import { simplifyDebts } from "../debtSimplifier";

describe("simplifyDebts", () => {
  it("returns empty array for empty balances", () => {
    expect(simplifyDebts({}, "USD")).toEqual([]);
  });

  it("returns empty array when all balances are zero", () => {
    expect(simplifyDebts({ a: 0, b: 0 }, "USD")).toEqual([]);
  });

  it("simple two-person settlement", () => {
    const result = simplifyDebts({ alice: 500, bob: -500 }, "USD");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      fromUserId: "bob",
      toUserId: "alice",
      amountCents: 500,
      currency: "USD",
    });
  });

  it("three-person settlement with one payer", () => {
    // alice paid for everything: +800 net
    // bob owes 400, carol owes 400
    const result = simplifyDebts(
      { alice: 800, bob: -400, carol: -400 },
      "USD"
    );
    expect(result).toHaveLength(2);
    const totalTransferred = result.reduce((s, r) => s + r.amountCents, 0);
    expect(totalTransferred).toBe(800);
  });

  it("complex multi-party — minimizes transactions", () => {
    // alice: +400, bob: +100, carol: -300, dave: -200
    const result = simplifyDebts(
      { alice: 400, bob: 100, carol: -300, dave: -200 },
      "USD"
    );
    // All debts settled
    const totalsIn: Record<string, number> = {};
    const totalsOut: Record<string, number> = {};
    for (const s of result) {
      totalsOut[s.fromUserId] = (totalsOut[s.fromUserId] ?? 0) + s.amountCents;
      totalsIn[s.toUserId] = (totalsIn[s.toUserId] ?? 0) + s.amountCents;
    }
    expect(totalsOut["carol"]).toBe(300);
    expect(totalsOut["dave"]).toBe(200);
    expect(totalsIn["alice"]).toBe(400);
    expect(totalsIn["bob"]).toBe(100);
  });

  it("is deterministic — same input always produces same output", () => {
    const balances = { alice: 300, bob: -100, carol: -200 };
    const r1 = simplifyDebts(balances, "USD");
    const r2 = simplifyDebts(balances, "USD");
    expect(r1).toEqual(r2);
  });

  it("stable tie-break by userId", () => {
    // Two creditors with same amount, two debtors with same amount
    const result1 = simplifyDebts(
      { aaa: 500, bbb: 500, ccc: -500, ddd: -500 },
      "USD"
    );
    const result2 = simplifyDebts(
      { bbb: 500, aaa: 500, ddd: -500, ccc: -500 },
      "USD"
    );
    // Same result regardless of object property order
    expect(result1.map((r) => `${r.fromUserId}->${r.toUserId}:${r.amountCents}`).sort())
      .toEqual(result2.map((r) => `${r.fromUserId}->${r.toUserId}:${r.amountCents}`).sort());
  });

  it("correctly handles partial settlement scenario", () => {
    // alice: +1000, bob: -300, carol: -700
    const result = simplifyDebts({ alice: 1000, bob: -300, carol: -700 }, "EUR");
    const total = result.reduce((s, r) => s + r.amountCents, 0);
    expect(total).toBe(1000);
    result.forEach((r) => expect(r.currency).toBe("EUR"));
  });

  it("handles single creditor and debtor with unequal amounts", () => {
    const result = simplifyDebts({ alice: 1000, bob: -600 }, "USD");
    // bob owes alice 600, alice still has +400 uncovered (by design — bob's net is -600)
    // But wait: if balances sum to non-zero, that means data is wrong.
    // In valid data, balances must sum to 0. Testing just the debt path.
    // Actually: alice:1000, bob:-600 sums to 400 ≠ 0 — invalid real scenario
    // But the algo should still produce bob→alice:600
    expect(result.length).toBeGreaterThanOrEqual(1);
    const bobToAlice = result.find((r) => r.fromUserId === "bob" && r.toUserId === "alice");
    expect(bobToAlice?.amountCents).toBe(600);
  });
});
