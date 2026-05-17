/**
 * @deprecated Use axiosClient from './axiosClient.js' instead
 * This file is kept for backward compatibility only.
 * All API calls should use the services exported from './index.js'
 */

// Token helpers moved to index.js
export { getLocalToken as getAuthToken, setLocalToken as setAuthToken, removeLocalToken as removeAuthToken } from './index.js';
