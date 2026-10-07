import type {ReactNode} from 'react';
export function FormField({id,label,error,children}:{id:string;label:string;error?:string;children:ReactNode}) {
 return <div className="field"><label htmlFor={id}>{label}</label>{children}{error&&<p id={`${id}-error`} className="error">{error}</p>}</div>;
}
