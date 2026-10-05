import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { ticketFields } from './ticketValidators';

export default defineSchema({
  customers: defineTable({
    sourceId: v.string(), name: v.string(), phone: v.string(), searchText: v.string(),
  }).index('by_sourceId', ['sourceId']).searchIndex('search_customer', { searchField: 'searchText' }),
  tickets: defineTable(ticketFields).index('by_requestId', ['requestId']),
  ticketCounters: defineTable({name:v.string(),value:v.number()}).index('by_name',['name']),
});
