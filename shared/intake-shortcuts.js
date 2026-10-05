import {REPAIR_SERVICES} from './repair-catalog.js';

// Suggestions help the associate choose; they never identify damage or select a service.
export function suggestServices(damage, itemType) {
  const text=damage.toLowerCase();
  const groups=[
    [/bent|bend|uneven|out.of.round|flatten/, /reshape|straighten/],
    [/scuff|scratch|dirty|dirt|tarnish|dull/, /clean|polish|refinish/],
    [/broken|break|crack|split|snapp/, /solder|repair|weld/],
    [/loose|missing.*stone|stone.*missing/, /tighten|reset|set stone|replace.*stone/],
    [/clasp|catch/, /clasp|catch/],
    [/prong/, /prong/],
    [/post|earring back/, /post|earring back/],
  ].filter(([observed])=>observed.test(text));
  if(!groups.length)return [];
  const itemPattern={Ring:/ring|shank|sizing|prong/,Bracelet:/bangle|bracelet/,Earring:/earring/,Necklace:/chain|necklace|pearl/,Chain:/chain/,Pendant:/pendant|bail/,Brooch:/brooch|pin/}[itemType];
  return REPAIR_SERVICES.map(service=>{
    const description=`${service.name} ${service.category} ${service.unit}`;
    const hits=groups.filter(([,repair])=>repair.test(description.toLowerCase())).length;
    return {service,score:hits ? hits*10+(itemPattern?.test(description.toLowerCase()) ? 5 : 0) : 0};
  }).filter(entry=>entry.score>0).sort((a,b)=>b.score-a.score).slice(0,3).map(entry=>entry.service);
}

function coveredByManualRepair(entry, finding) {
  if(entry.source!=='manual' || !entry.serviceCode)return false;
  const service=REPAIR_SERVICES.find(service=>service.code===entry.serviceCode);
  const families=[[/bent|bend|uneven|out.of.round|flatten/,/reshape|straighten/],[/scuff|scratch|dirty|dirt|tarnish|dull/,/clean|polish|refinish/]];
  return families.some(([damage,repair])=>damage.test(entry.damage.toLowerCase()) && damage.test(finding.damage.toLowerCase()) && repair.test(service?.name.toLowerCase() ?? ''));
}

export function mergeRepairSuggestions(existing, fresh) {
  const manual=existing.filter(repair=>repair.source==='manual');
  const result=[...manual];
  for(const repair of fresh) {
    if(result.some(entry=>coveredByManualRepair(entry,repair) || (repair.serviceCode && entry.serviceCode===repair.serviceCode) || entry.damage.trim().toLowerCase()===repair.damage.trim().toLowerCase()))continue;
    if(result.length>=12)break;
    result.push(repair);
  }
  return result;
}
