'use client';
import {useDispatch,useSelector} from 'react-redux';
import type {AppDispatch,RootState} from '../../../store/store';
import {setUser,clearUser} from '../store/authSlice';
import {resetPublication} from '../../publications/store/publicationSlice';
import * as sessionService from '../services/sessionService';
export function useAuth(){
 const dispatch=useDispatch<AppDispatch>();const auth=useSelector((state:RootState)=>state.auth);
 return {...auth,login:async(email:string,password:string)=>{const user=await sessionService.login(email,password);dispatch(resetPublication());dispatch(setUser(user));return user;},
 logout:async()=>{await sessionService.logout();dispatch(resetPublication());dispatch(clearUser());}};
}
