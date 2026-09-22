import {createAsyncThunk,createSlice} from '@reduxjs/toolkit';
import {createPublicationRequest,PublicationRequestError} from '../services/publicationService';
import type {CreatePublicationInput,Publication,ApiError} from '../types/publication';
export interface PublicationState {
 created:Publication|null; status:'idle'|'pending'|'succeeded'|'failed'; error:ApiError|null; requestId:string|null;
}
const initialState:PublicationState = {created:null,status:'idle',error:null,requestId:null};
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
 resetPublication:()=>initialState
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
}});
export const {resetPublication} = publicationSlice.actions;
export default publicationSlice.reducer;
