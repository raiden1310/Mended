export const captureReady = item => item.photos.length >= 3 && item.photos.some(photo=>photo.hallmark);
export function combinedEstimate(items) {
 const complete=items.length>0 && items.every(item=>item.estimate?.complete && !item.estimatePending && !item.estimateError);
 const cents=items.reduce((sum,item)=>sum+Math.round((item.estimate?.total ?? 0)*100),0);
 return {complete,total:complete?cents/100:null};
}
