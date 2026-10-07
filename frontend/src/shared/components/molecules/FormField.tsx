import type {ReactNode} from 'react';
import {Label} from '../atoms/Label';
export function FormField({id,label,error,children}:{id:string;label:string;error?:string;children:ReactNode}){
 return <div className="field"><Label htmlFor={id}>{label}</Label>{children}{error&&<p id={`${id}-error`} className="error">{error}</p>}</div>;
}
