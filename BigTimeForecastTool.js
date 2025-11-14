/**
 * BigTime Forecast Tool for Flowise AI
 * 
 * This custom tool pulls forecast data from the BigTime Foresight API
 * and makes it available to Flowise AI agents.
 * 
 * @author BigTime Integration Team
 * @version 1.0.0
 */

// ===========================
// Tool Configuration
// ===========================

const TOOL_CONFIG = {
  name: "bigtime_forecast",
  description: "Use this tool to fetch forecast data from BigTime Foresight API. This tool retrieves project forecasts, resource allocations, and capacity planning data. Provide optional filters like project ID, date range, or staff member.",
  
  // Input schema defines what parameters the agent can pass to this tool
  schema: {
    type: "object",
    properties: {
      client_id: {
        type: "string",
        description: "BigTime Foresight API OAuth2 client ID (required for authentication)"
      },
      client_secret: {
        type: "string",
        description: "BigTime Foresight API OAuth2 client secret (required for authentication)"
      },
      scope: {
        type: "string",
        description: "OAuth2 scope (default: 'read'). Options: 'read', 'write', 'finance'",
        default: "read"
      },
      forecast_id: {
        type: "string",
        description: "Optional: Specific forecast ID to retrieve. If not provided, returns list of forecasts."
      },
      page_size: {
        type: "number",
        description: "Optional: Number of results per page (default: 50, max: 100)",
        default: 50
      },
      filters: {
        type: "string",
        description: "Optional: JSON string of additional filters (e.g., {\"project_id\": \"123\", \"start_date\": \"2024-01-01\"})"
      }
    },
    required: ["client_id", "client_secret"]
  }
};

// ===========================
// API Configuration
// ===========================

const API_CONFIG = {
  authUrl: "https://foresight-api.bigtime.net/auth/token/",
  baseUrl: "https://foresight-api.bigtime.net/beta/",
  forecastsEndpoint: "forecasts/",
  rateLimit: 60, // requests per minute
  defaultTimeout: 30000 // 30 seconds
};

// ===========================
// Main Tool Function
// ===========================

/**
 * Main function executed when the tool is called by Flowise agent
 * Variables prefixed with $ are automatically injected from the schema
 */
async function executeTool($client_id, $client_secret, $scope, $forecast_id, $page_size, $filters) {
  try {
    // Step 1: Authenticate and get access token
    const accessToken = await authenticateWithBigTime($client_id, $client_secret, $scope || 'read');
    
    // Step 2: Fetch forecast data
    const forecastData = await fetchForecastData(accessToken, $forecast_id, $page_size, $filters);
    
    // Step 3: Format and return results
    return JSON.stringify({
      success: true,
      data: forecastData,
      timestamp: new Date().toISOString(),
      message: $forecast_id 
        ? `Successfully retrieved forecast ${$forecast_id}` 
        : `Successfully retrieved ${forecastData.results?.length || 0} forecasts`
    }, null, 2);
    
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, null, 2);
  }
}

// ===========================
// Authentication Functions
// ===========================

/**
 * Authenticate with BigTime Foresight API using OAuth2 Client Credentials
 * @param {string} clientId - OAuth2 client ID
 * @param {string} clientSecret - OAuth2 client secret
 * @param {string} scope - OAuth2 scope (read, write, finance)
 * @returns {Promise<string>} Access token
 */
async function authenticateWithBigTime(clientId, clientSecret, scope) {
  const fetch = require('node-fetch');
  
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('scope', scope);
  
  const response = await fetch(API_CONFIG.authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Authentication failed (${response.status}): ${errorText}`);
  }
  
  const data = await response.json();
  
  if (!data.access_token) {
    throw new Error('No access token received from authentication');
  }
  
  return data.access_token;
}

// ===========================
// Data Fetching Functions
// ===========================

/**
 * Fetch forecast data from BigTime Foresight API
 * @param {string} accessToken - OAuth2 access token
 * @param {string} forecastId - Optional specific forecast ID
 * @param {number} pageSize - Number of results per page
 * @param {string} filtersJson - Optional JSON string of filters
 * @returns {Promise<Object>} Forecast data
 */
async function fetchForecastData(accessToken, forecastId, pageSize, filtersJson) {
  const fetch = require('node-fetch');
  
  // Build URL
  let url = API_CONFIG.baseUrl + API_CONFIG.forecastsEndpoint;
  
  if (forecastId) {
    // Fetch specific forecast
    url += `${forecastId}/`;
  } else {
    // Fetch list of forecasts with optional filters
    const params = new URLSearchParams();
    
    if (pageSize) {
      params.append('page_size', pageSize.toString());
    }
    
    // Add custom filters if provided
    if (filtersJson) {
      try {
        const filters = JSON.parse(filtersJson);
        Object.keys(filters).forEach(key => {
          params.append(key, filters[key]);
        });
      } catch (e) {
        console.warn('Invalid filters JSON, ignoring:', e.message);
      }
    }
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  
  // Make request
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Enable-Synchronous-Related-Fetch': 'True'
    }
  });
  
  // Handle rate limiting
  if (response.status === 429) {
    throw new Error('Rate limit exceeded. BigTime Foresight API allows 60 requests per minute.');
  }
  
  // Handle other errors
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed (${response.status}): ${errorText}`);
  }
  
  const data = await response.json();
  return data;
}

// ===========================
// Export for Flowise
// ===========================

// Export the configuration and execution function
// Flowise will use these to register and execute the tool
module.exports = {
  config: TOOL_CONFIG,
  execute: executeTool
};

// ===========================
// Usage Example (for testing)
// ===========================

/**
 * Example of how to use this tool programmatically:
 * 
 * const BigTimeTool = require('./BigTimeForecastTool');
 * 
 * // Execute the tool
 * const result = await BigTimeTool.execute(
 *   'your_client_id',
 *   'your_client_secret',
 *   'read',
 *   null,  // forecast_id (optional)
 *   50,    // page_size
 *   null   // filters (optional)
 * );
 * 
 * console.log(result);
 */
