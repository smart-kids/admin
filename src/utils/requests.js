import axios from "axios";
let API;
// API endpoint logic remains the same.
if (window.location.href.includes('localhost')) {
    API = `http://localhost:4001`;
} else {
    API = `https://cloud.shuleplus.co.ke/api`;
}

/**
 * Handles a 401 Unauthorized response by clearing credentials and redirecting.
 * Preserves non-authentication data in localStorage.
 */
const handleUnauthorized = () => {
    console.error("Unauthorized request (401). Clearing credentials and redirecting to login.");

    const keysToKeep = ['school', 'learningState'];
    const preservedData = {};  
    keysToKeep.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
            preservedData[key] = value;
        }
    });

    localStorage.clear();

    for (const key in preservedData) {
        localStorage.setItem(key, preservedData[key]);
    }
    // Use replace to prevent user from navigating back to the unauthorized page.
    window.location.replace('/#/');
};

/**
 * Utility to pause execution.
 * @param {number} ms - Milliseconds to wait.
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Internal function to execute a GraphQL request with a robust retry mechanism.
 * @param {string} queryString - The GraphQL query or mutation string.
 * @param {object} variables - The GraphQL variables.
 * @param {boolean} isMutation - A flag for logging purposes.
 * @returns {Promise<any>} A promise that resolves with the `data` portion of the GraphQL response.
 * @throws Will throw an error if all retry attempts fail or a non-retryable error occurs.
 */
const sanitizeResponseData = (data) => {
    if (!data) return data;
    
    // Check if we are running in local development
    const isLocalClient = window.location.href.includes('localhost') || window.location.href.includes('127.0.0.1');
    if (isLocalClient) return data; // Keep as is for local dev
    
    if (typeof data === 'string') {
        if (data.includes('localhost:4001') || data.includes('127.0.0.1:4001')) {
            return data
                .replace(/https?:\/\/localhost:4001/g, 'https://graph-ongyy.kinsta.app')
                .replace(/https?:\/\/127\.0\.0\.1:4001/g, 'https://graph-ongyy.kinsta.app');
        }
        return data;
    }
    
    if (Array.isArray(data)) {
        return data.map(item => sanitizeResponseData(item));
    }
    
    if (typeof data === 'object') {
        const sanitized = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                sanitized[key] = sanitizeResponseData(data[key]);
            }
        }
        return sanitized;
    }
    
    return data;
};

/**
 * Internal function to execute a GraphQL request with a robust retry mechanism.
 * @param {string} queryString - The GraphQL query or mutation string.
 * @param {object} variables - The GraphQL variables.
 * @param {boolean} isMutation - A flag for logging purposes.
 * @returns {Promise<any>} A promise that resolves with the `data` portion of the GraphQL response.
 * @throws Will throw an error if all retry attempts fail or a non-retryable error occurs.
 */
const _executeRequestWithRetries = async (queryString, variables, isMutation = false) => {
    const maxRetries = 5;
    let delay = 1000; // 1-second initial delay

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await axios.post(`${API}/graph`, {
                query: queryString,
                variables
            }, {
                headers: { authorization: localStorage.getItem("authorization") }
            });

            const renewedToken = response.headers['x-renewed-token'];
            if (renewedToken) {
                localStorage.setItem("authorization", renewedToken);
                console.log("Token auto-renewed and saved to localStorage");
            }

            // GraphQL can return errors in the body of a 200 OK response.
            if (response.data.errors) {
                console.error("GraphQL Errors returned from API:", response.data.errors);
                // These are schema/resolver errors and are not retryable.
                throw response.data.errors;
            }

            // Success: return the actual data payload, e.g., { schools: [...] }
            return sanitizeResponseData(response.data.data);

        } catch (error) {
            let isRetryable = false;
            let statusLog = "Network Error";

            // Axios places server responses in `error.response`.
            if (error.response) {
                // Handle critical 401 Unauthorized error immediately.
                if (error.response.status === 401) {
                    handleUnauthorized();
                    // Halt further execution by returning a promise that never resolves.
                    return new Promise(() => {});
                }

                // Retry only on server-side errors (5xx), which might be temporary.
                isRetryable = error.response.status >= 500 && error.response.status <= 599;
                statusLog = error.response.status;
            } else if (error.request || error.message === 'Network Error' || error.code === 'ECONNABORTED') {
                // Hard network error (no response received)
                isRetryable = true;
            }

            if (isRetryable && attempt < maxRetries) {
                console.warn(`[API] Attempt ${attempt} failed with status ${statusLog}. Retrying in ${delay / 1000}s...`);
                await wait(delay);
                delay *= 2; // Exponential backoff for subsequent retries.
                continue;   // Move to the next loop iteration.
            }

            // If we reach here, the error is non-retryable or we've exhausted retries.
            const requestType = isMutation ? "Mutation" : "Query";
            console.error(`[API] ${requestType} failed after ${attempt} attempts.`, {
                query: queryString,
                variables,
                error
            });

            // Rethrow the most specific error information available.
            throw error.response?.data?.errors || error.response?.data || error;
        }
    }
};

const startDebugRequest = (queryString, type = 'Loading') => {
    if (!window.__debugState) return null;
    const opMatch = queryString.match(/(?:query|mutation)\s+(\w+)/);
    const actionName = opMatch ? `${type} ${opMatch[1]}` : `${type} Data...`;
    const reqId = Date.now() + Math.random();
    
    if (!window.__debugState.requests) window.__debugState.requests = [];
    window.__debugState.requests = [...window.__debugState.requests, { id: reqId, action: actionName }];
    window.dispatchEvent(new Event('debug_update'));
    return reqId;
};

const endDebugRequest = (reqId) => {
    if (!window.__debugState || !reqId) return;
    if (window.__debugState.requests) {
        window.__debugState.requests = window.__debugState.requests.filter(r => r.id !== reqId);
    }
    window.dispatchEvent(new Event('debug_update'));
};

/**
 * Performs a GraphQL query. ALWAYS fetches from the network.
 *
 * This function is designed to be flexible:
 * 1. It returns a Promise that resolves with the GraphQL data.
 * 2. It can optionally accept a callback for backward compatibility or event-style handling.
 *
 * @param {string} queryString - The GraphQL query string.
 * @param {object} params - The query variables.
 * @param {function(object): void} [callback] - An optional callback executed with the data on success.
 * @returns {Promise<any>} A promise that resolves with the GraphQL `data` object (e.g., `{ schools: [...] }`) on success or rejects on failure.
 */
export const query = (queryString, params, callback) => {
    const reqId = startDebugRequest(queryString, 'Loading');

    return new Promise((resolve, reject) => {
        _executeRequestWithRetries(queryString, params, false)
            .then(data => {
                endDebugRequest(reqId);
                // On success, first trigger the optional callback.
                if (callback && typeof callback === 'function') {
                    try {
                        // Note: This callback is fire-and-forget. The promise does not wait for it to complete.
                        callback({ data }); // The original code passed {data}, so we keep that structure for the callback.
                    } catch (cbError) {
                        console.error("Error in query success callback:", cbError);
                        // Don't reject the main promise, as the network request was successful.
                    }
                }
                // Then, resolve the promise with the clean data.
                resolve(data);
            })
            .catch(error => {
                endDebugRequest(reqId);
                // On failure, reject the promise. The error is already logged by the internal function.
                reject(error);
            });
    });
};

/**
 * Performs a GraphQL mutation.
 * @param {string} queryString - The GraphQL mutation string.
 * @param {object} variables - The mutation variables.
 * @returns {Promise<any>} A promise that resolves with the mutation's result `data` object or rejects on failure.
 */
export const mutate = (queryString, variables) => {
    const reqId = startDebugRequest(queryString, 'Saving');

    // A mutation is a direct async operation. We can simply return the internal function's promise.
    return _executeRequestWithRetries(queryString, variables, true)
        .then(res => {
            endDebugRequest(reqId);
            return res;
        })
        .catch(err => {
            endDebugRequest(reqId);
            throw err;
        });
};

export const resolveAssetUrl = (url) => {
    if (!url) return '';
    if (typeof url !== 'string') return url;
    
    const isLocalClient = window.location.href.includes('localhost') || window.location.href.includes('127.0.0.1');
    if (!isLocalClient) {
        if (url.includes('localhost:4001') || url.includes('127.0.0.1:4001')) {
            return url
                .replace(/https?:\/\/localhost:4001/g, 'https://graph-ongyy.kinsta.app')
                .replace(/https?:\/\/127\.0\.0\.1:4001/g, 'https://graph-ongyy.kinsta.app');
        }
    }
    return url;
};

export { API };
