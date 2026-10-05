import { validateRepairs } from './item-rules.js';

// Damage detection has no catalog, service codes, or pricing input.
export const DAMAGE_INSTRUCTIONS = `For each item I send, tell me its item type, visible damage, and the repair needed. Describe only what is visible; never assume defects or warranty. Include visible bending, scuffs, scratches, or dirt when present. Cite a numbered photo for each finding. If damage cannot be determined, use unclear. If no damage is visible, use none_visible. Keep each finding brief.`;

export function prepareDamageFindings(assessment, damages, photoCount) {
  const findings = validateRepairs(damages.map(entry => ({ damage: entry.damage, photo: entry.photo, serviceCode: '' })), photoCount, { allowUnselected: true });
  if (findings.some(entry => entry.photo === 0)) throw new Error('AI findings need an evidence photo.');
  return {
    assessment: findings.length ? 'visible_damage' : assessment === 'visible_damage' ? 'unclear' : assessment,
    findings: findings.map((entry, index) => ({ ...entry, repairNeeded: damages[index].repairNeeded })),
  };
}

// A matching response may assign codes, but cannot remove or rewrite findings.
export function applyCatalogMatches(findings, matches, photoCount) {
  const byIndex = new Map();
  for (const match of matches) {
    if (!Number.isInteger(match.finding) || match.finding < 0 || match.finding >= findings.length || byIndex.has(match.finding)) throw new Error('Invalid service match.');
    byIndex.set(match.finding, match.serviceCode);
  }
  return validateRepairs(findings.map((entry, index) => ({ damage: entry.damage, photo: entry.photo, serviceCode: byIndex.get(index) || '' })), photoCount, { allowUnselected: true });
}
