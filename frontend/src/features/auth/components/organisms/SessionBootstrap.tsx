'use client';
import {useEffect} from 'react';import {useDispatch} from 'react-redux';
import type {AppDispatch} from '../../../../store/store';
import {restoreSession} from '../../services/sessionService';import {setUser,clearUser,sessionError} from '../../store/authSlice';
import {resetPublication} from '../../../publications/store/publicationSlice';
import {STORAGE_KEYS} from '../../constants/storageKeys';
export function SessionBootstrap(){const dispatch=useDispatch<AppDispatch>();useEffect(()=>{
 let active=true;
 const restore=()=>{void restoreSession().then(user=>{if(!active)return;if(user&&localStorage.getItem(STORAGE_KEYS.userUUID)===user.userUUID)dispatch(setUser(user));else dispatch(clearUser());}).catch(()=>{if(active)dispatch(sessionError('No se pudo recuperar la sesión. Vuelve a iniciar sesión.'));});};
 const clear=()=>{dispatch(resetPublication());dispatch(clearUser());};
 const sync=(event:StorageEvent)=>{if(event.key===STORAGE_KEYS.userUUID){clear();restore();}};
 restore();window.addEventListener('ecorecicla-session-ended',clear);window.addEventListener('storage',sync);
 return()=>{active=false;window.removeEventListener('ecorecicla-session-ended',clear);window.removeEventListener('storage',sync);};
 },[dispatch]);return null;}
