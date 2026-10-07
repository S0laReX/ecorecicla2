'use client';
import {useCallback,useState} from 'react';
import {useDispatch,useSelector} from 'react-redux';
import type {AppDispatch,RootState} from '../../../store/store';
import {createPublication,resetPublication} from '../store/publicationSlice';
import {createPublicationSchema} from '../schemas/publicationSchema';
import type {CreatePublicationInput,Publication} from '../types/publication';
type FieldErrors = Partial<Record<keyof CreatePublicationInput,string[]>>;
export function useCreatePublication() {
 const dispatch = useDispatch<AppDispatch>();
 const state = useSelector((root:RootState)=>root.publications);
 const [fieldErrors,setFieldErrors] = useState<FieldErrors>({});
 const submit = useCallback(async (input:unknown):Promise<Publication|null>=>{
  const parsed=createPublicationSchema.safeParse(input);
  if(!parsed.success){setFieldErrors(parsed.error.flatten().fieldErrors);return null;}
  setFieldErrors({});
  const action=await dispatch(createPublication(parsed.data));
  return createPublication.fulfilled.match(action)?action.payload:null;
 },[dispatch]);
 const reset=useCallback(()=>{setFieldErrors({});dispatch(resetPublication());},[dispatch]);
 return {submit,reset,fieldErrors,isSubmitting:state.status==='pending',error:state.error,created:state.created};
}
