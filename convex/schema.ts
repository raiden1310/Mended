import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  customers: defineTable({
    sourceId: v.string(), name: v.string(), phone: v.string(), searchText: v.string(),
  }).index('by_sourceId', ['sourceId']).searchIndex('search_customer', { searchField: 'searchText' }),
});
