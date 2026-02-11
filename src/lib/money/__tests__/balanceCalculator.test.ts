import { describe, it, expect } from "vitest";
import {
  computeBalances,
  getNetBalances,
  getUserBalance,
} from "../balanceCalculator";

describe("computeBalances", () => {
  it("calculates simple two-person balance", () => {
    const expenses = [
      {
        paidByUserId: "alice",
        amountCents: 1000,
        currency: "USD",
        splits: [
          { userId: "alice", amountCents: 500 },
          { userId: "bob", amountCents: 500 },
        ],
      },
    ];
    const balances = computeBalances(expenses, []);
    const net = getNetBalances(balances, "USD");
    // alice paid 1000, owes 500 → net +500
    // bob owes 500 → net -500
    expect(net["alice"]).toBe(500);
    expect(net["bob"]).toBe(-500);
  });

  it("handles multiple expenses", () => {
    const expenses = [
      {
        paidByUserId: "alice",
        amountCents: 900,
        currency: "USD",
        splits: [
          { userId: "alice", amountCents: 300 },
          { userId: "bob", amountCents: 300 },
          { userId: "carol", amountCents: 300 },
        ],
      },
      {
        paidByUserId: "bob",
        amountCents: 600,
        currency: "USD",
        splits: [
          { userId: "alice", amountCents: 200 },
          { userId: "bob", amountCents: 200 },
          { userId: "carol", amountCents: 200 },
        ],
      },
    ];
    const balances = computeBalances(expenses, []);
    const net = getNetBalances(balances, "USD");
    // alice: paid 900, owes 300+200=500 → net +400
    // bob: paid 600, owes 300+200=500 → net +100
    // carol: paid 0, owes 300+200=500 → net -500
    expect(net["alice"]).toBe(400);
    expect(net["bob"]).toBe(100);
    expect(net["carol"]).toBe(-500);
    // Sum should be zero
    expect(Object.values(net).reduce((s, v) => s + v, 0)).toBe(0);
  });

  it("settlements reduce balances", () => {
    const expenses = [
      {
        paidByUserId: "alice",
        amountCents: 1000,
        currency: "USD",
        splits: [
          { userId: "alice", amountCents: 500 },
          { userId: "bob", amountCents: 500 },
        ],
      },
    ];
    const settlements = [
      { fromUserId: "bob", toUserId: "alice", amountCents: 500, currency: "USD" },
    ];
    const balances = computeBalances(expenses, settlements);
    const net = getNetBalances(balances, "USD");
    expect(net["alice"]).toBe(0);
    expect(net["bob"]).toBe(0);
  });

  it("handles multiple currencies independently", () => {
    const expenses = [
      {
        paidByUserId: "alice",
        amountCents: 1000,
        currency: "USD",
        splits: [
          { userId: "alice", amountCents: 500 },
          { userId: "bob", amountCents: 500 },
        ],
      },
      {
        paidByUserId: "bob",
        amountCents: 800,
        currency: "EUR",
        splits: [
          { userId: "alice", amountCents: 400 },
          { userId: "bob", amountCents: 400 },
        ],
      },
    ];
    const balances = computeBalances(expenses, []);
    const usd = getNetBalances(balances, "USD");
    const eur = getNetBalances(balances, "EUR");
    expect(usd["alice"]).toBe(500);
    expect(usd["bob"]).toBe(-500);
    expect(eur["bob"]).toBe(400);
    expect(eur["alice"]).toBe(-400);
  });

  it("getUserBalance returns 0 for unknown user", () => {
    const balances = computeBalances([], []);
    expect(getUserBalance(balances, "nobody", "USD")).toBe(0);
  });

  it("balances always sum to zero", () => {
    const expenses = [
      {
        paidByUserId: "a",
        amountCents: 777,
        currency: "USD",
        splits: [
          { userId: "a", amountCents: 259 },
          { userId: "b", amountCents: 259 },
          { userId: "c", amountCents: 259 },
        ],
      },
    ];
    const balances = computeBalances(expenses, []);
    const net = getNetBalances(balances, "USD");
    const total = Object.values(net).reduce((s, v) => s + v, 0);
    expect(total).toBe(0);
  });
});
