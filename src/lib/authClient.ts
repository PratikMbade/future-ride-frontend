// src/lib/authClient.ts
import { createAuthClient } from 'better-auth/react';
import { siweClient } from 'better-auth/client/plugins'; 

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_AUTH_URL, 
  plugins: [siweClient()],
});