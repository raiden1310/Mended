import { action, internalMutation, internalQuery, mutation, query } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { detailsValidator, repairInputValidator, signatureValidator, ticketLineValidator } from './ticketValidators';
import { validatePhotos, validateRepairs } from '../shared/item-rules.js';
import { calculateEstimate } from '../shared/estimate.js';
import { REPAIR_SERVICES } from '../shared/repair-catalog.js';
import { suggestedDueDate, validateDetails, validateDueDate, validateIssuedDate, validateSignature } from '../shared/ticket-rules.js';

const draftArgs = {
  requestId:v.string(),customerId:v.id('customers'),details:detailsValidator,
  repairs:repairInputValidator,rush:v.boolean(),rhodium:v.boolean(),issuedDate:v.string(),
};

export const findRequest = internalQuery({
  args:{requestId:v.string()},returns:v.union(v.id('tickets'),v.null()),
  handler:async (ctx,{requestId})=>(await ctx.db.query('tickets').withIndex('by_requestId',q=>q.eq('requestId',requestId)).unique())?._id ?? null,
});

export const create = action({
  args:{...draftArgs,photos:v.array(v.object({data:v.string(),hallmark:v.boolean()}))},
  returns:v.id('tickets'),
  handler:async (ctx,args):Promise<Id<'tickets'>>=>{
    if (!/^[a-zA-Z0-9-]{16,80}$/.test(args.requestId)) throw new Error('Please try creating the ticket again.');
    validatePhotos(args.photos); validateDetails(args.details); validateIssuedDate(args.issuedDate);
    validateRepairs(args.repairs,args.photos.length);
    if (!calculateEstimate({...args,metals:args.details.metals}).complete) throw new Error('Choose services and complete the prices before creating a ticket.');
    const existing:Id<'tickets'>|null=await ctx.runQuery(internal.tickets.findRequest,{requestId:args.requestId});
    if (existing) return existing;
    const uploaded:Id<'_storage'>[]=[];
    try {
      for (const photo of args.photos) {
        const bytes=Uint8Array.from(atob(photo.data.split(',')[1]),char=>char.charCodeAt(0));
        uploaded.push(await ctx.storage.store(new Blob([bytes],{type:'image/jpeg'})));
      }
      const {photos,...draft}=args;
      const result:{id:Id<'tickets'>,created:boolean}=await ctx.runMutation(internal.tickets.insertDraft,{...draft,photos:uploaded.map((storageId,index)=>({storageId,hallmark:photos[index].hallmark}))});
      if (!result.created) await Promise.all(uploaded.map(id=>ctx.storage.delete(id)));
      return result.id;
    } catch (error) {
      await Promise.all(uploaded.map(id=>ctx.storage.delete(id)));
      throw error;
    }
  },
});

export const insertDraft = internalMutation({
  args:{...draftArgs,photos:v.array(v.object({storageId:v.id('_storage'),hallmark:v.boolean()}))},
  returns:v.object({id:v.id('tickets'),created:v.boolean()}),
  handler:async (ctx,args)=>{
    const existing=await ctx.db.query('tickets').withIndex('by_requestId',q=>q.eq('requestId',args.requestId)).unique();
    if (existing) return {id:existing._id,created:false};
    const customer=await ctx.db.get(args.customerId);
    if (!customer) throw new Error('Search and select an existing customer.');
    validateDetails(args.details); validateIssuedDate(args.issuedDate);
    const repairs=validateRepairs(args.repairs,args.photos.length);
    const estimate=calculateEstimate({...args,metals:args.details.metals});
    if (!estimate.complete || estimate.total===null) throw new Error('Complete the estimate before creating a ticket.');
    const counter=await ctx.db.query('ticketCounters').withIndex('by_name',q=>q.eq('name','repair')).unique();
    const number=(counter?.value ?? 0)+1;
    if (counter) await ctx.db.patch(counter._id,{value:number});
    else await ctx.db.insert('ticketCounters',{name:'repair',value:number});
    const id=await ctx.db.insert('tickets',{
      requestId:args.requestId,number,customerId:customer._id,customer:{name:customer.name,phone:customer.phone},details:args.details,photos:args.photos,
      repairs:repairs.map((repair,index)=>({...repair,serviceName:REPAIR_SERVICES.find(service=>service.code===repair.serviceCode)!.name,...estimate.lines[index],amount:estimate.lines[index].amount!,total:estimate.lines[index].total!})),
      subtotal:estimate.subtotal,fees:estimate.fees,total:estimate.total,rush:args.rush,rhodium:args.rhodium,
      issuedDate:args.issuedDate,dueDate:suggestedDueDate(args.issuedDate,repairs.map(repair=>repair.serviceCode)),status:'draft',
    });
    return {id,created:true};
  },
});

export const get = query({
  args:{id:v.id('tickets')},
  returns:v.union(v.null(),v.object({
    id:v.id('tickets'),number:v.number(),customer:v.object({name:v.string(),phone:v.string()}),details:detailsValidator,
    photos:v.array(v.object({url:v.union(v.string(),v.null()),hallmark:v.boolean()})),repairs:ticketLineValidator,
    subtotal:v.number(),fees:v.number(),total:v.number(),rush:v.boolean(),rhodium:v.boolean(),issuedDate:v.string(),dueDate:v.string(),
    status:v.union(v.literal('draft'),v.literal('signed')),signature:v.union(signatureValidator,v.null()),signedAt:v.union(v.number(),v.null()),
  })),
  handler:async (ctx,{id})=>{
    const ticket=await ctx.db.get(id);
    if (!ticket) return null;
    return {
      id:ticket._id,number:ticket.number,customer:ticket.customer,details:ticket.details,
      photos:await Promise.all(ticket.photos.map(async photo=>({url:await ctx.storage.getUrl(photo.storageId),hallmark:photo.hallmark}))),
      repairs:ticket.repairs,subtotal:ticket.subtotal,fees:ticket.fees,total:ticket.total,rush:ticket.rush,rhodium:ticket.rhodium,
      issuedDate:ticket.issuedDate,dueDate:ticket.dueDate,status:ticket.status,signature:ticket.signature ?? null,signedAt:ticket.signedAt ?? null,
    };
  },
});

export const sign = mutation({
  args:{id:v.id('tickets'),dueDate:v.string(),signature:signatureValidator},returns:v.id('tickets'),
  handler:async (ctx,{id,dueDate,signature})=>{
    const ticket=await ctx.db.get(id);
    if (!ticket) throw new Error('Ticket not found.');
    // A retry never replaces an already-saved customer approval.
    if (ticket.status==='signed') return id;
    validateDueDate(dueDate,ticket.issuedDate); validateSignature(signature);
    await ctx.db.patch(id,{dueDate,signature,status:'signed',signedAt:Date.now()});
    return id;
  },
});
