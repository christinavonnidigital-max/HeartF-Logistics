import { Lead, LeadScoringRule } from "../types";

type RuleOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "not_in"
  | "exists"
  | "not_exists"
  | "regex";

function toNumberIfPossible(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.trim());
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function toStringSafe(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  return String(v);
}

function toArrayValue(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    // allow "a,b,c" style
    return v
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [v];
}

function compareValues(leadValue: unknown, operator: RuleOperator | string, ruleValue: unknown): boolean {
  const op = (operator || "").toLowerCase() as RuleOperator;

  // Existence checks
  if (op === "exists") return leadValue !== undefined && leadValue !== null && toStringSafe(leadValue).trim() !== "";
  if (op === "not_exists") return leadValue === undefined || leadValue === null || toStringSafe(leadValue).trim() === "";

  // Normalize
  const lvStr = toStringSafe(leadValue).toLowerCase();
  const rvStr = toStringSafe(ruleValue).toLowerCase();

  // Numeric comparisons if possible
  const lvNum = toNumberIfPossible(leadValue);
  const rvNum = toNumberIfPossible(ruleValue);

  switch (op) {
    case "equals":
      if (lvNum !== null && rvNum !== null) return lvNum === rvNum;
      return lvStr === rvStr;

    case "not_equals":
      if (lvNum !== null && rvNum !== null) return lvNum !== rvNum;
      return lvStr !== rvStr;

    case "contains":
      return lvStr.includes(rvStr);

    case "not_contains":
      return !lvStr.includes(rvStr);

    case "starts_with":
      return lvStr.startsWith(rvStr);

    case "ends_with":
      return lvStr.endsWith(rvStr);

    case "gt":
      if (lvNum === null || rvNum === null) return false;
      return lvNum > rvNum;

    case "gte":
      if (lvNum === null || rvNum === null) return false;
      return lvNum >= rvNum;

    case "lt":
      if (lvNum === null || rvNum === null) return false;
      return lvNum < rvNum;

    case "lte":
      if (lvNum === null || rvNum === null) return false;
      return lvNum <= rvNum;

    case "in": {
      const arr = toArrayValue(ruleValue).map((x) => toStringSafe(x).toLowerCase());
      return arr.includes(lvStr);
    }

    case "not_in": {
      const arr = toArrayValue(ruleValue).map((x) => toStringSafe(x).toLowerCase());
      return !arr.includes(lvStr);
    }

    case "regex": {
      try {
        const re = new RegExp(toStringSafe(ruleValue), "i");
        return re.test(toStringSafe(leadValue));
      } catch {
        return false;
      }
    }

    default:
      // Unknown operator: do nothing
      return false;
  }
}

export const calculateLeadScore = (lead: Partial<Lead>, rules: LeadScoringRule[]): number => {
  let score = 0;

  const activeRules = (rules || []).filter((rule: any) => !!rule?.is_active);

  for (const rule of activeRules) {
    const field = (rule as any)?.condition?.field as string | undefined;
    const operator = (rule as any)?.condition?.operator as string | undefined;
    const value = (rule as any)?.condition?.value;

    if (!field || !operator) continue;

    // Dynamic access by scoring rules
    const leadValue = (lead as any)[field];

    // If lead doesn’t have the field and rule isn’t existence-based, skip
    if ((leadValue === undefined || leadValue === null) && !["exists", "not_exists"].includes(operator.toLowerCase())) {
      continue;
    }

    const conditionMet = compareValues(leadValue, operator, value);

    if (conditionMet) {
      const points = Number((rule as any)?.points ?? 0);
      if (Number.isFinite(points)) score += points;
    }
  }

  return score;
};
