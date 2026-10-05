import {query} from './_generated/server';
import {v} from 'convex/values';
import {calculateEstimate} from '../shared/estimate.js';

export const calculate = query({
  args: {
    metals:v.array(v.object({metal:v.string(),purity:v.string()})),
    repairs:v.array(v.object({serviceCode:v.string(),override:v.union(v.number(),v.null()),extra:v.number()})),
    rush:v.boolean(),rhodium:v.boolean(),
  },
  returns:v.object({
    lines:v.array(v.object({serviceCode:v.string(),amount:v.union(v.number(),v.null()),extra:v.number(),total:v.union(v.number(),v.null()),manual:v.boolean()})),
    subtotal:v.number(),fees:v.number(),total:v.union(v.number(),v.null()),complete:v.boolean(),missing:v.number(),currency:v.string(),
  }),
  handler:async (_ctx,args)=>calculateEstimate(args),
});
