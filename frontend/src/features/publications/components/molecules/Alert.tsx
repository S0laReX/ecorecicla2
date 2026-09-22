import type {ReactNode} from 'react';
export function Alert({children,isError=false}:{children:ReactNode;isError?:boolean}) {return <p role={isError?'alert':'status'} className={isError?'error':'notice'}>{children}</p>;}
