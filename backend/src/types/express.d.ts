declare global {
 namespace Express {
  interface Request { auth?: { userUUID: string; tokenVersion: number }; requestId?: string }
 }
}
export {};
