import { query } from './_generated/server';
import { v } from 'convex/values';
import { catalogPrice } from '../shared/repair-prices.js';

export const get = query({
  args: { serviceCode: v.string(), metals: v.array(v.object({ metal: v.string(), purity: v.string() })) },
  returns: v.object({ amount: v.union(v.number(), v.null()), currency: v.string(), basis: v.union(v.string(), v.null()), unit: v.string(), availability: v.union(v.literal('priced'), v.literal('not_offered'), v.literal('confirm_metal'), v.literal('unsupported_metal')) }),
  handler: async (_ctx, { serviceCode, metals }) => catalogPrice(serviceCode, metals),
});
