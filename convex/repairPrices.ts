import { query } from './_generated/server';
import { v } from 'convex/values';
import { serviceCatalogPrice } from '../shared/repair-prices.js';

export const get = query({
  args: { metalIndexes:v.optional(v.array(v.number())), serviceCode: v.string(), metals: v.array(v.object({ metal: v.string(), purity: v.string() })) },
  returns: v.object({ amount: v.union(v.number(), v.null()), currency: v.string(), basis: v.union(v.string(), v.null()), unit: v.string(), availability: v.union(v.literal('priced'), v.literal('not_offered'), v.literal('confirm_metal'), v.literal('unsupported_metal'), v.literal('select_metals')) }),
  handler: async (_ctx, { serviceCode, metals, metalIndexes }) => serviceCatalogPrice(serviceCode, metals, metalIndexes),
});
