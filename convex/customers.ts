import { internalMutation, query } from './_generated/server';
import { v } from 'convex/values';
import { TEST_CUSTOMERS } from '../shared/test-customers.js';

export const importTestCustomers = internalMutation({
  args: {}, returns: v.number(),
  handler: async ctx => {
    for (const customer of TEST_CUSTOMERS) {
      const digits = customer.phone.replace(/\D/g, '');
      const phoneParts = Array.from({ length: digits.length - 1 }, (_, index) => digits.slice(index)).join(' ');
      const data = { ...customer, searchText: `${customer.name} ${phoneParts}` };
      const existing = await ctx.db.query('customers').withIndex('by_sourceId', q => q.eq('sourceId', customer.sourceId)).unique();
      if (existing) await ctx.db.patch(existing._id, data);
      else await ctx.db.insert('customers', data);
    }
    return TEST_CUSTOMERS.length;
  },
});

export const search = query({
  args: { text: v.string() },
  returns: v.array(v.object({ id: v.id('customers'), name: v.string(), phone: v.string() })),
  handler: async (ctx, { text }) => {
    if (text.length > 80) throw new Error('Search must be 80 characters or fewer.');
    const term = /[a-z]/i.test(text) ? text.trim() : text.replace(/\D/g, '');
    if (!term) return [];
    const customers = await ctx.db.query('customers').withSearchIndex('search_customer', q => q.search('searchText', term)).take(20);
    return customers.map(({ _id, name, phone }) => ({ id: _id, name, phone }));
  },
});
