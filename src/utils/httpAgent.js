// ============================================================
// HTTP Agent Configuration
// Handles SSL certificate issues with external APIs
// ============================================================

import { Agent as HttpsAgent } from "node:https";

/**
 * HTTPS Agent that ignores certificate errors
 * Required because some streaming sources have expired certificates
 */
export const httpsAgent = new HttpsAgent({ rejectUnauthorized: false });

/**
 * Common axios configuration with HTTPS agent
 * Use this for all external API calls to avoid certificate issues
 */
export const axiosConfig = {
  httpsAgent,
  timeout: 30000,
};