import {createAsyncThunk,createSlice,type PayloadAction} from '@reduxjs/toolkit';
import {createPublicationRequest,PublicationRequestError} from '../services/publicationService';
import type {CreatePublicationInput,Publication,ApiError} from '../types/publication';
import {listOwnPublications} from '../services/publicationService';
export interface PublicationState {
 created:Publication|null; status:'idle'|'pending'|'succeeded'|'failed'; error:ApiError|null; requestId:string|null;
 items:Publication[];listStatus:'idle'|'pending'|'succeeded'|'failed';listError:string|null;listRequestId:string|null;meta:{total:number;page:number;limit:number};
}
const initialState:PublicationState = {created:null,status:'idle',error:null,requestId:null,items:[],listStatus:'idle',listError:null,listRequestId:null,meta:{total:0,page:1,limit:6}};
export const fetchMyPublications=createAsyncThunk('publications/list',async(page:number,{signal})=>listOwnPublications(page,signal));
export const createPublication = createAsyncThunk<Publication,CreatePublicationInput,{rejectValue:ApiError;state:{publications:PublicationState}}>(
 'publications/create',async (input,{rejectWithValue,signal})=>{
  try { return await createPublicationRequest(input,signal); }
  catch(error:unknown) {
   return rejectWithValue(error instanceof PublicationRequestError ? error.failure :
    {success:false,message:'No pudimos confirmar el resultado. Revisa tus publicaciones antes de reintentar.',errorCode:'REQUEST_UNCONFIRMED',statusCode:0});
  }
 },{condition:(_input,{getState})=>getState().publications.status!=='pending'}
);
const publicationSlice = createSlice({name:'publications',initialState,reducers:{
 resetPublication:()=>initialState,
 replacePublication(state,action:PayloadAction<Publication>){const index=state.items.findIndex(p=>p.publicationUUID===action.payload.publicationUUID);if(index>=0)state.items[index]=action.payload;if(state.created?.publicationUUID===action.payload.publicationUUID)state.created=action.payload;},
 removePublication(state,action:PayloadAction<string>){state.items=state.items.filter(p=>p.publicationUUID!==action.payload);state.meta.total=Math.max(0,state.meta.total-1);if(state.created?.publicationUUID===action.payload)state.created=null;}
},extraReducers:builder=>{
 builder.addCase(createPublication.pending,(state,action)=>{state.status='pending';state.error=null;state.created=null;state.requestId=action.meta.requestId;});
 builder.addCase(createPublication.fulfilled,(state,action)=>{
  if(state.requestId!==action.meta.requestId)return;
  state.status='succeeded';state.created=action.payload;state.requestId=null;
 });
 builder.addCase(createPublication.rejected,(state,action)=>{
  if(state.requestId!==action.meta.requestId)return;
  state.status='failed';state.error=action.payload || {success:false,message:'Solicitud interrumpida; comprueba el resultado antes de reintentar.',errorCode:'REQUEST_INTERRUPTED',statusCode:0};state.requestId=null;
 });
 builder.addCase(fetchMyPublications.pending,(state,action)=>{state.listStatus='pending';state.listError=null;state.listRequestId=action.meta.requestId;});
 builder.addCase(fetchMyPublications.fulfilled,(state,action)=>{if(state.listRequestId!==action.meta.requestId)return;state.items=action.payload.data;state.meta=action.payload.meta;state.listStatus='succeeded';state.listRequestId=null;});
 builder.addCase(fetchMyPublications.rejected,(state,action)=>{if(state.listRequestId!==action.meta.requestId)return;state.listStatus=action.meta.aborted?'idle':'failed';state.listError=action.meta.aborted?null:action.error.message||'No se pudieron cargar tus publicaciones.';state.listRequestId=null;});
}});
export const {resetPublication,replacePublication,removePublication} = publicationSlice.actions;
export default publicationSlice.reducer;
