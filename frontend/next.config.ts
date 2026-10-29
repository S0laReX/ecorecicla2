import type { NextConfig } from 'next';
const config: NextConfig = {
 allowedDevOrigins: ['192.168.0.242'],
 async rewrites() { return [{source:'/api/:path*',destination:`${process.env.API_INTERNAL_ORIGIN || 'http://127.0.0.1:4000'}/api/:path*`}]; }
};
export default config;
