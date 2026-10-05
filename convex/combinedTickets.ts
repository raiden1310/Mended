import { action, internalMutation, internalQuery, mutation, query } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { detailsValidator, repairInputValidator, signatureValidator, ticketLineValidator } from './ticketValidators';
import { validatePhotos, validateRepairs } from '../shared/item-rules.js';
import { validateDetails, validateIssuedDate, validateDueDate, validateSignature } from '../shared/ticket-rules.js';
import { calculateEstimate } from '../shared/estimate.js';
import { REPAIR_SERVICES } from '../shared/repair-catalog.js';
const itemArgs={id:v.id('combinedTickets'),position:v.number(),details:detailsValidator,repairs:repairInputValidator,rush:v.boolean(),rhodium:v.boolean(),dueDate:v.string()};
export const begin=mutation({args:{requestId:v.string(),customerId:v.id('customers'),expected:v.number(),issuedDate:v.string()},returns:v.id('combinedTickets'),handler:async(ctx,args)=>{
 if(!/^[a-zA-Z0-9-]{16,80}$/.test(args.requestId) || !Number.isSafeInteger(args.expected) || args.expected<1)throw new Error('Check the intake.');
 validateIssuedDate(args.issuedDate);
 const existing=await ctx.db.query('combinedTickets').withIndex('by_requestId',q=>q.eq('requestId',args.requestId)).unique();
 if(existing){if(existing.customerId!==args.customerId || existing.expected!==args.expected || existing.issuedDate!==args.issuedDate)throw new Error('Intake changed.');return existing._id;}
 const customer=await ctx.db.get(args.customerId);if(!customer)throw new Error('Select a customer.');
 return await ctx.db.insert('combinedTickets',{...args,customer:{name:customer.name,phone:customer.phone},received:0,totalCents:0,status:'assembling'});
}});
export const existingItem=internalQuery({args:{id:v.id('combinedTickets'),position:v.number()},returns:v.union(v.id('ticketItems'),v.null()),handler:async(ctx,args)=>(await ctx.db.query('ticketItems').withIndex('by_ticket_position',q=>q.eq('ticketId',args.id).eq('position',args.position)).unique())?._id ?? null});
export const addItem=action({args:{...itemArgs,photos:v.array(v.object({data:v.string(),hallmark:v.boolean()}))},returns:v.id('ticketItems'),handler:async(ctx,args):Promise<Id<'ticketItems'>>=>{
 validatePhotos(args.photos);validateDetails(args.details);validateRepairs(args.repairs,args.photos.length);
 if(!calculateEstimate({...args,metals:args.details.metals}).complete)throw new Error('Complete each estimate.');
 const existing:Id<'ticketItems'>|null=await ctx.runQuery(internal.combinedTickets.existingItem,{id:args.id,position:args.position});if(existing)return existing;
 const uploaded:Id<'_storage'>[]=[];
 try{
  for(const photo of args.photos)uploaded.push(await ctx.storage.store(new Blob([Uint8Array.from(atob(photo.data.split(',')[1]),char=>char.charCodeAt(0))],{type:'image/jpeg'})));
  const {photos,...rest}=args;
  const result:{id:Id<'ticketItems'>,created:boolean}=await ctx.runMutation(internal.combinedTickets.insertItem,{...rest,photos:uploaded.map((storageId,index)=>({storageId,hallmark:photos[index].hallmark}))});
  if(!result.created)await Promise.all(uploaded.map(id=>ctx.storage.delete(id)));return result.id;
 }catch(error){await Promise.all(uploaded.map(id=>ctx.storage.delete(id)));throw error;}
}});
export const insertItem=internalMutation({args:{...itemArgs,photos:v.array(v.object({storageId:v.id('_storage'),hallmark:v.boolean()}))},returns:v.object({id:v.id('ticketItems'),created:v.boolean()}),handler:async(ctx,args)=>{
 const ticket=await ctx.db.get(args.id);if(!ticket)throw new Error('Ticket not found.');
 if(!Number.isSafeInteger(args.position) || args.position<0 || args.position>=ticket.expected)throw new Error('Invalid item.');
 const existing=await ctx.db.query('ticketItems').withIndex('by_ticket_position',q=>q.eq('ticketId',args.id).eq('position',args.position)).unique();if(existing)return {id:existing._id,created:false};
 if(ticket.status!=='assembling')throw new Error('Ticket is already complete.');
 if(args.photos.length<3 || args.photos.length>6 || !args.photos.some(photo=>photo.hallmark))throw new Error('Each item needs three photos and a hallmark.');
 validateDetails(args.details);validateDueDate(args.dueDate,ticket.issuedDate);
 const repairs=validateRepairs(args.repairs,args.photos.length),estimate=calculateEstimate({...args,metals:args.details.metals});
 if(!estimate.complete || estimate.total===null)throw new Error('Complete the item estimate.');
 const {id,position,details,photos,rush,rhodium,dueDate}=args;
 const itemId=await ctx.db.insert('ticketItems',{ticketId:id,position,details,photos,rush,rhodium,dueDate,repairs:repairs.map((repair,index)=>({...repair,serviceName:REPAIR_SERVICES.find(service=>service.code===repair.serviceCode)!.name,...estimate.lines[index],amount:estimate.lines[index].amount!,total:estimate.lines[index].total!})),subtotal:estimate.subtotal,fees:estimate.fees,total:estimate.total});
 await ctx.db.patch(id,{received:ticket.received+1,totalCents:ticket.totalCents+Math.round(estimate.total*100)});
 return {id:itemId,created:true};
}});
export const finish=mutation({args:{id:v.id('combinedTickets')},returns:v.id('combinedTickets'),handler:async(ctx,{id})=>{
 const ticket=await ctx.db.get(id);if(!ticket || ticket.received!==ticket.expected)throw new Error('Complete every item before confirming.');
 if(ticket.status!=='assembling')return id;
 const counter=await ctx.db.query('ticketCounters').withIndex('by_name',q=>q.eq('name','repair')).unique();const number=(counter?.value ?? 0)+1;
 if(counter)await ctx.db.patch(counter._id,{value:number});else await ctx.db.insert('ticketCounters',{name:'repair',value:number});
 await ctx.db.patch(id,{status:'draft',number});return id;
}});
export const get=query({args:{id:v.id('combinedTickets')},returns:v.union(v.null(),v.object({id:v.id('combinedTickets'),number:v.number(),customer:v.object({name:v.string(),phone:v.string()}),total:v.number(),issuedDate:v.string(),status:v.union(v.literal('draft'),v.literal('signed')),signature:v.union(signatureValidator,v.null()),signedAt:v.union(v.number(),v.null())})),handler:async(ctx,{id})=>{
 const t=await ctx.db.get(id);if(!t || t.status==='assembling')return null;return {id,number:t.number!,customer:t.customer,total:t.totalCents/100,issuedDate:t.issuedDate,status:t.status,signature:t.signature ?? null,signedAt:t.signedAt ?? null};
}});
export const items=query({args:{id:v.id('combinedTickets'),after:v.number()},returns:v.array(v.object({id:v.id('ticketItems'),position:v.number(),details:detailsValidator,photos:v.array(v.object({url:v.union(v.string(),v.null()),hallmark:v.boolean()})),repairs:ticketLineValidator,subtotal:v.number(),fees:v.number(),total:v.number(),rush:v.boolean(),rhodium:v.boolean(),dueDate:v.string()})),handler:async(ctx,{id,after})=>{
 const ticket=await ctx.db.get(id);if(!ticket || ticket.status==='assembling')return [];
 const rows=await ctx.db.query('ticketItems').withIndex('by_ticket_position',q=>q.eq('ticketId',id).gt('position',after)).take(10);
 return await Promise.all(rows.map(async row=>({id:row._id,position:row.position,details:row.details,photos:await Promise.all(row.photos.map(async photo=>({url:await ctx.storage.getUrl(photo.storageId),hallmark:photo.hallmark}))),repairs:row.repairs,subtotal:row.subtotal,fees:row.fees,total:row.total,rush:row.rush,rhodium:row.rhodium,dueDate:row.dueDate})));
}});
export const updateDue=mutation({args:{id:v.id('ticketItems'),dueDate:v.string()},returns:v.null(),handler:async(ctx,{id,dueDate})=>{
 const item=await ctx.db.get(id);if(!item)throw new Error('Item not found.');const ticket=await ctx.db.get(item.ticketId);if(!ticket || ticket.status!=='draft')throw new Error('Signed dates cannot change.');validateDueDate(dueDate,ticket.issuedDate);await ctx.db.patch(id,{dueDate});return null;
}});
export const sign=mutation({args:{id:v.id('combinedTickets'),signature:signatureValidator},returns:v.id('combinedTickets'),handler:async(ctx,{id,signature})=>{
 const ticket=await ctx.db.get(id);if(!ticket || ticket.status==='assembling' || ticket.received!==ticket.expected)throw new Error('Complete every item.');if(ticket.status==='signed')return id;
 validateSignature(signature);await ctx.db.patch(id,{status:'signed',signature,signedAt:Date.now()});return id;
}});
