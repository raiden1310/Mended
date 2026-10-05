import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { detailsValidator, signatureValidator, ticketLineValidator, ticketFields } from './ticketValidators';

export default defineSchema({
  customers: defineTable({
    sourceId: v.string(), name: v.string(), phone: v.string(), searchText: v.string(),
  }).index('by_sourceId', ['sourceId']).searchIndex('search_customer', { searchField: 'searchText' }),
  tickets: defineTable(ticketFields).index('by_requestId', ['requestId']),
  combinedTickets: defineTable({requestId:v.string(),customerId:v.id('customers'),customer:v.object({name:v.string(),phone:v.string()}),expected:v.number(),received:v.number(),totalCents:v.number(),issuedDate:v.string(),number:v.optional(v.number()),status:v.union(v.literal('assembling'),v.literal('draft'),v.literal('signed')),signature:v.optional(signatureValidator),signedAt:v.optional(v.number())}).index('by_requestId',['requestId']),
  ticketItems: defineTable({ticketId:v.id('combinedTickets'),position:v.number(),details:detailsValidator,photos:v.array(v.object({storageId:v.id('_storage'),hallmark:v.boolean()})),repairs:ticketLineValidator,subtotal:v.number(),fees:v.number(),total:v.number(),rush:v.boolean(),rhodium:v.boolean(),dueDate:v.string()}).index('by_ticket_position',['ticketId','position']),
  ticketCounters: defineTable({name:v.string(),value:v.number()}).index('by_name',['name']),
});
