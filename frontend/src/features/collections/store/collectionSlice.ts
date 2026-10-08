import {createAsyncThunk,createSlice,type PayloadAction} from '@reduxjs/toolkit';
import {clearUser,sessionError,setUser} from '../../auth/store/authSlice';
import * as service from '../services/collectionService';
import type {AvailablePublication,CollectionFilter,MaterialFilter} from '../types/collection';
import {ApiRequestError} from '../../auth/services/sessionService';
const errorMessage=(error:unknown)=>error instanceof ApiRequestError?error.message:'No se pudieron cargar las publicaciones. Intenta nuevamente.';
export const fetchAvailable=createAsyncThunk('collections/list',async(filter:CollectionFilter,{signal,rejectWithValue})=>{
 try{return await service.listAvailablePublications(filter,signal);}catch(error){return rejectWithValue(errorMessage(error));}
});
export const fetchAvailableDetail=createAsyncThunk('collections/detail',async(uuid:string,{signal,rejectWithValue})=>{
 try{return await service.getAvailablePublication(uuid,signal);}catch(error){return rejectWithValue(errorMessage(error));}
});
interface CollectionState{
 filter:CollectionFilter;items:AvailablePublication[];total:number;status:'idle'|'loading'|'ready'|'error';error:string|null;requestId?:string;
 detail:AvailablePublication|null;detailStatus:'idle'|'loading'|'ready'|'error';detailError:string|null;detailRequestId?:string;
}
const initialState:CollectionState={filter:{materialType:'',page:1},items:[],total:0,status:'idle',error:null,detail:null,detailStatus:'idle',detailError:null};
const slice=createSlice({name:'collections',initialState,reducers:{
 setMaterialFilter(state,action:PayloadAction<MaterialFilter>){state.filter={materialType:action.payload,page:1};state.items=[];state.total=0;state.status='idle';state.requestId=undefined;},
 setCollectionPage(state,action:PayloadAction<number>){state.filter.page=action.payload;state.items=[];state.status='idle';state.requestId=undefined;}
},extraReducers:builder=>{
 builder.addCase(fetchAvailable.pending,(state,action)=>{state.requestId=action.meta.requestId;state.status='loading';state.error=null;state.items=[];})
 .addCase(fetchAvailable.fulfilled,(state,action)=>{if(state.requestId!==action.meta.requestId)return;state.items=action.payload.publications;state.total=action.payload.meta.total;state.status='ready';})
 .addCase(fetchAvailable.rejected,(state,action)=>{if(state.requestId!==action.meta.requestId)return;state.items=[];state.total=0;state.status=action.meta.aborted?'idle':'error';state.error=action.meta.aborted?null:String(action.payload||'No se pudo cargar el listado.');})
 .addCase(fetchAvailableDetail.pending,(state,action)=>{state.detailRequestId=action.meta.requestId;state.detail=null;state.detailStatus='loading';state.detailError=null;})
 .addCase(fetchAvailableDetail.fulfilled,(state,action)=>{if(state.detailRequestId!==action.meta.requestId)return;state.detail=action.payload;state.detailStatus='ready';})
 .addCase(fetchAvailableDetail.rejected,(state,action)=>{if(state.detailRequestId!==action.meta.requestId)return;state.detail=null;state.detailStatus=action.meta.aborted?'idle':'error';state.detailError=action.meta.aborted?null:String(action.payload||'No se pudo cargar el detalle.');})
 .addCase(clearUser,()=>initialState).addCase(sessionError,()=>initialState).addCase(setUser,()=>initialState);
}});
export const {setMaterialFilter,setCollectionPage}=slice.actions;
export default slice.reducer;
