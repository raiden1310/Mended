import { v } from 'convex/values';

export const detailsValidator = v.object({
  itemType: v.string(),
  metals: v.array(v.object({metal:v.string(),purity:v.string(),hallmark:v.string()})),
  stones: v.array(v.string()),
});
export const signatureValidator = v.array(v.array(v.object({x:v.number(),y:v.number()})));
export const repairInputValidator = v.array(v.object({metalIndexes:v.optional(v.array(v.number())),damage:v.string(),serviceCode:v.string(),photo:v.number(),override:v.union(v.number(),v.null()),extra:v.number()}));
export const ticketLineValidator = v.array(v.object({metalIndexes:v.optional(v.array(v.number())),damage:v.string(),serviceCode:v.string(),serviceName:v.string(),photo:v.number(),amount:v.number(),extra:v.number(),total:v.number(),manual:v.boolean()}));
export const ticketFields = {
  requestId:v.string(), number:v.number(), customerId:v.id('customers'),
  customer:v.object({name:v.string(),phone:v.string()}), details:detailsValidator,
  photos:v.array(v.object({storageId:v.id('_storage'),hallmark:v.boolean()})),
  repairs:ticketLineValidator, subtotal:v.number(),fees:v.number(),total:v.number(),rush:v.boolean(),rhodium:v.boolean(),
  issuedDate:v.string(),dueDate:v.string(),status:v.union(v.literal('draft'),v.literal('signed')),
  signature:v.optional(signatureValidator),signedAt:v.optional(v.number()),
};
