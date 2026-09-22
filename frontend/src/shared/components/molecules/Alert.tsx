import type {ReactNode} from 'react';
export function Alert({children,isError=false}:{children:ReactNode;isError?:boolean}){return <div role={isError?'alert':'status'} className={isError?'alert error':'alert notice'}>{children}</div>;}
