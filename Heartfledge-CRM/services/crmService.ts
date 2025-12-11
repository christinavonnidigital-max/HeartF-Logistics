import { Lead, LeadScoringRule } from '../types';

export const calculateLeadScore = (lead: Partial<Lead>, rules: LeadScoringRule[]): number => {
  // Start with a base score of 0
  let score = 0; 
  
  const activeRules = rules.filter(rule => rule.is_active);

  for (const rule of activeRules) {
    const { field, operator, value } = rule.condition;

    // Use `any` to dynamically access lead properties based on the rule's `field`.
    const leadValue = (lead as any)[field];

    if (leadValue === undefined || leadValue === null) {
      continue;
    }

    let conditionMet = false;
    const leadValueStr = String(leadValue).toLowerCase();
    const ruleValueStr = String(value).toLowerCase();

    switch (operator) {
      case 'equals':
        if (leadValueStr === ruleValueStr) {
          conditionMet = true;
        }
        break;
      case 'contains':
        if (leadValueStr.includes(ruleValueStr)) {
          conditionMet = true;
        }
        break;
      case 'greater_than':
        const numericLeadValue = Number(leadValue);
        const numericRuleValue = Number(value);
        if (!isNaN(numericLeadValue) && !isNaN(numericRuleValue) && numericLeadValue > numericRuleValue) {
          conditionMet = true;
        }
        break;
      default:
        // Ignore unsupported operators
        break;
    }

    if (conditionMet) {
      score += rule.points;
    }
  }

  return score;
};
