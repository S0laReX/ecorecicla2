import {createSlice,type PayloadAction} from '@reduxjs/toolkit';
import type {User} from '../types/auth';
interface AuthState{user:User|null;status:'loading'|'authenticated'|'guest';error:string|null}
const initialState:AuthState={user:null,status:'loading',error:null};
const slice=createSlice({name:'auth',initialState,reducers:{
 setUser(state,action:PayloadAction<User>){state.user=action.payload;state.status='authenticated';state.error=null;},
 clearUser(state){state.user=null;state.status='guest';state.error=null;},
 sessionError(state,action:PayloadAction<string>){state.error=action.payload;state.status='guest';state.user=null;}
}});
export const {setUser,clearUser,sessionError}=slice.actions;
export default slice.reducer;
