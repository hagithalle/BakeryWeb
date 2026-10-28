import { describe, it, expect } from "vitest";
import {
  PurchaseVatTreatment as T,
  needsDeductibility,
  initialPurchaseVat,
  purchaseVatIsComplete,
  purchaseVatPayload,
  isUnreviewed,
  pendingChanges,
  incompleteSelections,
  rowKey,
} from "./purchaseVat";

const EXEMPT = 1, REGISTERED = 2;

describe("which questions are asked", () => {
  it("asks about deductibility only for a registered business buying with VAT", () => {
    expect(needsDeductibility(REGISTERED, T.IncludesVat)).toBe(true);
    expect(needsDeductibility(REGISTERED, T.ExcludesVat)).toBe(true);
    expect(needsDeductibility(REGISTERED, T.NoVat)).toBe(false);
    expect(needsDeductibility(EXEMPT, T.ExcludesVat)).toBe(false);   // an exempt business never deducts
    expect(needsDeductibility(null, T.ExcludesVat)).toBe(false);
  });

  it("requires an answer for new items, but lets existing items stay unreviewed", () => {
    const unanswered = initialPurchaseVat(null);
    expect(purchaseVatIsComplete(unanswered, EXEMPT, true)).toBe(false);
    expect(purchaseVatIsComplete(unanswered, EXEMPT, false)).toBe(true);
    expect(purchaseVatIsComplete({ treatment: T.IncludesVat, deductible: null }, EXEMPT, true)).toBe(true);
    expect(purchaseVatIsComplete({ treatment: T.IncludesVat, deductible: null }, REGISTERED, true)).toBe(false);
    expect(purchaseVatIsComplete({ treatment: T.IncludesVat, deductible: false }, REGISTERED, true)).toBe(true);
  });
});

describe("what is sent to the server", () => {
  it("sends nothing while unanswered, so the server keeps reviewed values", () => {
    expect(purchaseVatPayload({ treatment: null, deductible: null }, REGISTERED)).toEqual({});
  });

  it("never sends a deductibility that does not apply", () => {
    expect(purchaseVatPayload({ treatment: T.ExcludesVat, deductible: true }, EXEMPT))
      .toEqual({ purchaseVatTreatment: 2, inputVatDeductible: null });
    expect(purchaseVatPayload({ treatment: T.NoVat, deductible: true }, REGISTERED))
      .toEqual({ purchaseVatTreatment: 3, inputVatDeductible: null });
    expect(purchaseVatPayload({ treatment: T.IncludesVat, deductible: true }, REGISTERED))
      .toEqual({ purchaseVatTreatment: 1, inputVatDeductible: true });
  });

  it("flags unreviewed items", () => {
    expect(isUnreviewed({ purchaseVatTreatment: null }, EXEMPT)).toBe(true);
    expect(isUnreviewed({ purchaseVatTreatment: 1, inputVatDeductible: null }, EXEMPT)).toBe(false);
    expect(isUnreviewed({ purchaseVatTreatment: 1, inputVatDeductible: null }, REGISTERED)).toBe(true);
  });
});

describe("bulk review: only explicitly selected, changed items are saved", () => {
  const flour = { kind: "ingredient", id: 1, purchaseVatTreatment: null, inputVatDeductible: null };
  const sugar = { kind: "ingredient", id: 2, purchaseVatTreatment: null, inputVatDeductible: null };
  const box = { kind: "packaging", id: 1, purchaseVatTreatment: 1, inputVatDeductible: null };
  const items = [flour, sugar, box];

  it("ignores edited rows that are not selected", () => {
    const edits = { [rowKey(flour)]: { treatment: 1, deductible: null }, [rowKey(sugar)]: { treatment: 2, deductible: null } };
    expect(pendingChanges(items, edits, new Set([rowKey(flour)]), EXEMPT))
      .toEqual([{ kind: "ingredient", id: 1, purchaseVatTreatment: 1, inputVatDeductible: null }]);
  });

  it("ignores selected rows whose choice equals what is stored, and never marks anything by itself", () => {
    const edits = { [rowKey(box)]: { treatment: 1, deductible: null } };
    expect(pendingChanges(items, edits, new Set([rowKey(box), rowKey(flour)]), EXEMPT)).toEqual([]);
    expect(pendingChanges(items, {}, new Set(items.map(rowKey)), EXEMPT)).toEqual([]);
  });

  it("blocks saving while a selected row has no complete answer", () => {
    const edits = { [rowKey(flour)]: { treatment: 1, deductible: null } };
    expect(incompleteSelections(items, edits, new Set([rowKey(flour)]), REGISTERED).map((i) => i.id)).toEqual([1]);
    expect(incompleteSelections(items, edits, new Set([rowKey(flour)]), EXEMPT)).toEqual([]);
    expect(incompleteSelections(items, {}, new Set([rowKey(sugar)]), EXEMPT).map((i) => i.id)).toEqual([2]);
  });
});
