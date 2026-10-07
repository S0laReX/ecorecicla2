declare global {
 namespace Express {
  interface Request { auth?: { userUUID: string; tokenVersion: number; sessionUUID:string }; requestId?: string }
 }
}
export {};
