import{apiRequest}from'../api/client';import type{ApiResponse,Contract,ExpiryAlert,ExpirySetting,RenewalOpportunity}from'../types';
export interface ContractFilters{status?:string;search?:string;onlyWarning?:boolean}
export function getContracts(f:ContractFilters={}){const p=new URLSearchParams();if(f.status)p.set('status',f.status);if(f.search)p.set('search',f.search);if(f.onlyWarning!==undefined)p.set('only_warning',f.onlyWarning?'1':'0');const q=p.toString();return apiRequest<ApiResponse<Contract[]>>(`/v1/contracts${q?`?${q}`:''}`)}
export const getAlerts=()=>apiRequest<ApiResponse<ExpiryAlert[]>>('/v1/contracts/expiry-alerts');
export const checkExpiry=()=>apiRequest<ApiResponse<{expiring_soon_count:number;expired_count:number;total_flagged:number}>>('/v1/contracts/check-expiry',{method:'POST'});
export const getExpirySetting=()=>apiRequest<ApiResponse<ExpirySetting>>('/v1/contracts/expiry-setting');
export const updateExpirySetting=(warningDays:number,isActive:boolean)=>apiRequest<ApiResponse<ExpirySetting>>('/v1/contracts/expiry-setting',{method:'PATCH',body:JSON.stringify({warning_days:warningDays,is_active:isActive})});
export const createRenewalOpportunity=(contractId:number)=>apiRequest<ApiResponse<RenewalOpportunity>>(`/v1/contracts/${contractId}/renewal-opportunity`,{method:'POST'});
