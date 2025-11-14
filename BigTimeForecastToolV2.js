/**
 * BigTime Forecast Tool for Flowise AI (Enhanced)
 * 
 * This custom tool pulls forecast data from BigTime APIs:
 * - BigTime IQ API v2 (session-based authentication)
 * - BigTime Foresight API (OAuth2 authentication)
 * 
 * @author BigTime Integration Team
 * @version 2.0.0
 */

// ===========================
// Tool Configuration
// ===========================

const TOOL_CONFIG = {
  name: "bigtime_forecast",
  description: "Use this tool to fetch forecast data from BigTime. Supports both BigTime IQ API v2 and Foresight API. This tool retrieves project forecasts, resource allocations, and capacity planning data. Provide optional filters like project ID, date range, or staff member.",
  
  // Input schema defines what parameters the agent can pass to this tool
  schema: {
    type: "object",
    properties: {
      api_type: {
        type: "string",
        description: "API type to use: 'iq' for BigTime IQ API v2 (default) or 'foresight' for Foresight API",
        default: "iq",
        enum: ["iq", "foresight"]
      },
      // IQ API credentials
      username: {
        type: "string",
        description: "BigTime IQ API username (email). Required if api_type='iq'"
      },
      password: {
        type: "string",
        description: "BigTime IQ API password. Required if api_type='iq'"
      },
      auth_realm: {
        type: "string",
        description: "BigTime IQ API auth realm/firm ID. Required if api_type='iq'"
      },
      // Foresight API credentials
      client_id: {
        type: "string",
        description: "BigTime Foresight API OAuth2 client ID. Required if api_type='foresight'"
      },
      client_secret: {
        type: "string",
        description: "BigTime Foresight API OAuth2 client secret. Required if api_type='foresight'"
      },
      scope: {
        type: "string",
        description: "OAuth2 scope for Foresight API (default: 'read'). Options: 'read', 'write', 'finance'",
        default: "read"
      },
      // Data retrieval parameters
      report_id: {
        type: "string",
        description: "Optional: Specific report ID to retrieve from IQ API"
      },
      forecast_id: {
        type: "string",
        description: "Optional: Specific forecast ID to retrieve from Foresight API"
      },
      start_date: {
        type: "string",
        description: "Optional: Start date for data filter (format: YYYY-MM-DD)"
      },
      end_date: {
        type: "string",
        description: "Optional: End date for data filter (format: YYYY-MM-DD)"
      },
      page_size: {
        type: "number",
        description: "Optional: Number of results per page (default: 50, max: 100)",
        default: 50
      },
      filters: {
        type: "string",
        description: "Optional: JSON string of additional filters"
      }
    },
    required: []
  }
};

// ===========================
// API Configuration
// ===========================

const API_CONFIG = {
  // BigTime IQ API v2
  iq: {
    baseUrl: "https://iq.bigtime.net/BigtimeData/api/v2",
    sessionEndpoint: "/session",
    reportEndpoint: "/Report/Data",
    rateLimit: 30 // requests per minute
  },
  // BigTime Foresight API
  foresight: {
    authUrl: "https://foresight-api.bigtime.net/auth/token/",
    baseUrl: "https://foresight-api.bigtime.net/beta/",
    forecastsEndpoint: "forecasts/",
    rateLimit: 60 // requests per minute
  },
  defaultTimeout: 30000 // 30 seconds
};

// ===========================
// Main Tool Function
// ===========================

/**
 * Main function executed when the tool is called by Flowise agent
 * Variables prefixed with $ are automatically injected from the schema
 */
async function executeTool($api_type, $username, $password, $auth_realm, $client_id, $client_secret, $scope, $report_id, $forecast_id, $start_date, $end_date, $page_size, $filters) {
  try {
    const apiType = $api_type || 'iq';
    
    if (apiType === 'iq') {
      // Use BigTime IQ API v2
      return await executeIQAPI($username, $password, $auth_realm, $report_id, $start_date, $end_date, $filters);
    } else if (apiType === 'foresight') {
      // Use BigTime Foresight API
      return await executeForesightAPI($client_id, $client_secret, $scope, $forecast_id, $page_size, $filters);
    } else {
      throw new Error(`Invalid api_type: ${apiType}. Must be 'iq' or 'foresight'`);
    }
    
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, null, 2);
  }
}

// ===========================
// BigTime IQ API v2 Functions
// ===========================

/**
 * Execute query using BigTime IQ API v2
 */
async function executeIQAPI(username, password, authRealm, reportId, startDate, endDate, filtersJson) {
  try {
    // Validate required parameters
    if (!username || !password || !authRealm) {
      throw new Error('Username, password, and auth_realm are required for IQ API');
    }
    
    // Step 1: Create session and authenticate
    const sessionData = await createIQSession(username, password, authRealm);
    
    // Step 2: Fetch report/forecast data
    let data;
    if (reportId) {
      // Fetch specific report
      data = await fetchIQReport(sessionData, reportId, startDate, endDate, filtersJson);
    } else {
      // For now, return session info and guidance
      data = {
        message: "Session created successfully. Provide a report_id to fetch specific report data.",
        session_info: {
          token_created: true,
          firm_id: sessionData.firmId
        },
        guidance: "Use the BigTime UI to find your report ID, then call this tool again with report_id parameter."
      };
    }
    
    return JSON.stringify({
      success: true,
      api_type: 'iq',
      data: data,
      timestamp: new Date().toISOString()
    }, null, 2);
    
  } catch (error) {
    throw error;
  }
}

/**
 * Create session with BigTime IQ API v2
 */
async function createIQSession(username, password, authRealm) {
  const fetch = require('node-fetch');
  
  const url = API_CONFIG.iq.baseUrl + API_CONFIG.iq.sessionEndpoint;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      UserId: username,
      Pwd: password,
      IgnoreSsoLogin: true
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`IQ API authentication failed (${response.status}): ${errorText}`);
  }
  
  const data = await response.json();
  
  if (!data.token) {
    throw new Error('No session token received from IQ API');
  }
  
  return {
    token: data.token,
    firmId: authRealm
  };
}

/**
 * Fetch report data from BigTime IQ API v2
 */
async function fetchIQReport(sessionData, reportId, startDate, endDate, filtersJson) {
  const fetch = require('node-fetch');
  
  // Step 1: Update report with filters (if provided)
  if (startDate || endDate || filtersJson) {
    await updateIQReportFilters(sessionData, reportId, startDate, endDate, filtersJson);
  }
  
  // Step 2: Fetch report data
  const url = `${API_CONFIG.iq.baseUrl}${API_CONFIG.iq.reportEndpoint}/${reportId}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': sessionData.token,
      'X-Auth-Realm': sessionData.firmId
    }
  });
  
  if (response.status === 503) {
    throw new Error('Rate limit exceeded. BigTime IQ API allows 30 requests per minute.');
  }
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch report (${response.status}): ${errorText}`);
  }
  
  const data = await response.json();
  return data;
}

/**
 * Update report filters
 */
async function updateIQReportFilters(sessionData, reportId, startDate, endDate, filtersJson) {
  const fetch = require('node-fetch');
  
  const url = `${API_CONFIG.iq.baseUrl}${API_CONFIG.iq.reportEndpoint}/${reportId}`;
  
  const filters = {};
  
  if (startDate) {
    filters.DT_BEGIN = startDate;
  }
  
  if (endDate) {
    filters.DT_END = endDate;
  }
  
  // Add custom filters if provided
  if (filtersJson) {
    try {
      const customFilters = JSON.parse(filtersJson);
      Object.assign(filters, customFilters);
    } catch (e) {
      console.warn('Invalid filters JSON, ignoring:', e.message);
    }
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': sessionData.token,
      'X-Auth-Realm': sessionData.firmId
    },
    body: JSON.stringify(filters)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update report filters (${response.status}): ${errorText}`);
  }
  
  return true;
}

// ===========================
// BigTime Foresight API Functions
// ===========================

/**
 * Execute query using BigTime Foresight API
 */
async function executeForesightAPI(clientId, clientSecret, scope, forecastId, pageSize, filtersJson) {
  try {
    // Validate required parameters
    if (!clientId || !clientSecret) {
      throw new Error('client_id and client_secret are required for Foresight API');
    }
    
    // Step 1: Authenticate and get access token
    const accessToken = await authenticateWithForesight(clientId, clientSecret, scope || 'read');
    
    // Step 2: Fetch forecast data
    const forecastData = await fetchForesightData(accessToken, forecastId, pageSize, filtersJson);
    
    // Step 3: Format and return results
    return JSON.stringify({
      success: true,
      api_type: 'foresight',
      data: forecastData,
      timestamp: new Date().toISOString(),
      message: forecastId 
        ? `Successfully retrieved forecast ${forecastId}` 
        : `Successfully retrieved ${forecastData.results?.length || 0} forecasts`
    }, null, 2);
    
  } catch (error) {
    throw error;
  }
}

/**
 * Authenticate with BigTime Foresight API using OAuth2
 */
async function authenticateWithForesight(clientId, clientSecret, scope) {
  const fetch = require('node-fetch');
  
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('scope', scope);
  
  const response = await fetch(API_CONFIG.foresight.authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Foresight API authentication failed (${response.status}): ${errorText}`);
  }
  
  const data = await response.json();
  
  if (!data.access_token) {
    throw new Error('No access token received from Foresight API');
  }
  
  return data.access_token;
}

/**
 * Fetch forecast data from BigTime Foresight API
 */
async function fetchForesightData(accessToken, forecastId, pageSize, filtersJson) {
  const fetch = require('node-fetch');
  
  // Build URL
  let url = API_CONFIG.foresight.baseUrl + API_CONFIG.foresight.forecastsEndpoint;
  
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
    throw new Error(`Foresight API request failed (${response.status}): ${errorText}`);
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
// Usage Examples
// ===========================

/**
 * Example 1: Using BigTime IQ API v2
 * 
 * const BigTimeTool = require('./BigTimeForecastToolV2');
 * 
 * const result = await BigTimeTool.execute(
 *   'iq',                           // api_type
 *   'ntrander@intecrowd.com',       // username
 *   'sf8H5CRN#DcP5!H@',             // password
 *   'byjk-mox-dipx',                // auth_realm
 *   null, null, null,               // client_id, client_secret, scope (not used for IQ)
 *   '12345',                        // report_id
 *   null,                           // forecast_id (not used for IQ)
 *   '2024-01-01',                   // start_date
 *   '2024-12-31',                   // end_date
 *   null,                           // page_size (not used for IQ)
 *   null                            // filters
 * );
 * 
 * Example 2: Using BigTime Foresight API
 * 
 * const result = await BigTimeTool.execute(
 *   'foresight',                    // api_type
 *   null, null, null,               // username, password, auth_realm (not used for Foresight)
 *   'your_client_id',               // client_id
 *   'your_client_secret',           // client_secret
 *   'read',                         // scope
 *   null,                           // report_id (not used for Foresight)
 *   'forecast-123',                 // forecast_id
 *   null, null,                     // start_date, end_date (use filters instead)
 *   50,                             // page_size
 *   '{"project_id": "789"}'         // filters
 * );
 */
