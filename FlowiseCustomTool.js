/**
 * BigTime Forecast Tool - Flowise Custom Tool Format
 * 
 * INSTRUCTIONS FOR FLOWISE:
 * 
 * 1. In Flowise Custom Tool UI, configure the Input Schema separately using the JSON below
 * 2. Copy ONLY the code from the "FLOWISE FUNCTION CODE" section into the Function/Code field
 * 3. Do NOT copy the schema - it goes in the separate Input Schema field
 * 
 * ============================================================================
 * INPUT SCHEMA (Copy this into Flowise "Input Schema" field)
 * ============================================================================
 */

/*
[
    {
        "property": "api_type",
        "type": "string",
        "description": "API type: 'iq' for BigTime IQ API v2 or 'foresight' for Foresight API",
        "required": false
    },
    {
        "property": "username",
        "type": "string",
        "description": "BigTime IQ API username (email). Required if api_type='iq'",
        "required": false
    },
    {
        "property": "password",
        "type": "string",
        "description": "BigTime IQ API password. Required if api_type='iq'",
        "required": false
    },
    {
        "property": "auth_realm",
        "type": "string",
        "description": "BigTime IQ API auth realm/firm ID. Required if api_type='iq'",
        "required": false
    },
    {
        "property": "client_id",
        "type": "string",
        "description": "BigTime Foresight API OAuth2 client ID. Required if api_type='foresight'",
        "required": false
    },
    {
        "property": "client_secret",
        "type": "string",
        "description": "BigTime Foresight API OAuth2 client secret. Required if api_type='foresight'",
        "required": false
    },
    {
        "property": "scope",
        "type": "string",
        "description": "OAuth2 scope for Foresight API (default: 'read'). Options: 'read', 'write', 'finance'",
        "required": false
    },
    {
        "property": "report_id",
        "type": "string",
        "description": "Optional: Specific report ID to retrieve from IQ API",
        "required": false
    },
    {
        "property": "forecast_id",
        "type": "string",
        "description": "Optional: Specific forecast ID to retrieve from Foresight API",
        "required": false
    },
    {
        "property": "start_date",
        "type": "string",
        "description": "Optional: Start date for filter (YYYY-MM-DD)",
        "required": false
    },
    {
        "property": "end_date",
        "type": "string",
        "description": "Optional: End date for filter (YYYY-MM-DD)",
        "required": false
    },
    {
        "property": "page_size",
        "type": "number",
        "description": "Optional: Results per page (default: 50, max: 100)",
        "required": false
    },
    {
        "property": "filters",
        "type": "string",
        "description": "Optional: JSON string of additional filters",
        "required": false
    }
]
*/

/**
 * ============================================================================
 * FLOWISE FUNCTION CODE (Copy everything below this line into Flowise Code field)
 * ============================================================================
 */

// API Configuration
const API_CONFIG = {
  iq: {
    baseUrl: "https://iq.bigtime.net/BigtimeData/api/v2",
    sessionEndpoint: "/session",
    reportEndpoint: "/Report/Data",
    rateLimit: 30
  },
  foresight: {
    authUrl: "https://foresight-api.bigtime.net/auth/token/",
    baseUrl: "https://foresight-api.bigtime.net/beta/",
    forecastsEndpoint: "forecasts/",
    rateLimit: 60
  },
  defaultTimeout: 30000
};

// Main execution function
const apiType = $api_type || 'iq';

if (apiType === 'iq') {
  // ===== IQ API v2 Execution =====
  
  if (!$username || !$password || !$auth_realm) {
    return JSON.stringify({
      success: false,
      error: 'Username, password, and auth_realm are required for IQ API',
      timestamp: new Date().toISOString()
    }, null, 2);
  }
  
  try {
    // Create session
    const sessionUrl = API_CONFIG.iq.baseUrl + API_CONFIG.iq.sessionEndpoint;
    const sessionResponse = await fetch(sessionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        UserId: $username,
        Pwd: $password,
        IgnoreSsoLogin: true
      })
    });
    
    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      throw new Error(`IQ API authentication failed (${sessionResponse.status}): ${errorText}`);
    }
    
    const sessionData = await sessionResponse.json();
    
    if (!sessionData.token) {
      throw new Error('No session token received from IQ API');
    }
    
    // If report_id provided, fetch report data
    if ($report_id) {
      // Update filters if provided
      if ($start_date || $end_date || $filters) {
        const updateUrl = `${API_CONFIG.iq.baseUrl}${API_CONFIG.iq.reportEndpoint}/${$report_id}`;
        const filterData = {};
        
        if ($start_date) filterData.DT_BEGIN = $start_date;
        if ($end_date) filterData.DT_END = $end_date;
        
        if ($filters) {
          try {
            const customFilters = JSON.parse($filters);
            Object.assign(filterData, customFilters);
          } catch (e) {
            console.warn('Invalid filters JSON:', e.message);
          }
        }
        
        await fetch(updateUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': sessionData.token,
            'X-Auth-Realm': $auth_realm
          },
          body: JSON.stringify(filterData)
        });
      }
      
      // Fetch report data
      const reportUrl = `${API_CONFIG.iq.baseUrl}${API_CONFIG.iq.reportEndpoint}/${$report_id}`;
      const reportResponse = await fetch(reportUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': sessionData.token,
          'X-Auth-Realm': $auth_realm
        }
      });
      
      if (reportResponse.status === 503) {
        throw new Error('Rate limit exceeded. IQ API allows 30 requests per minute.');
      }
      
      if (!reportResponse.ok) {
        const errorText = await reportResponse.text();
        throw new Error(`Failed to fetch report (${reportResponse.status}): ${errorText}`);
      }
      
      const reportData = await reportResponse.json();
      
      return JSON.stringify({
        success: true,
        api_type: 'iq',
        data: reportData,
        timestamp: new Date().toISOString()
      }, null, 2);
    } else {
      // No report_id - return session info
      return JSON.stringify({
        success: true,
        api_type: 'iq',
        data: {
          message: "Session created successfully. Provide a report_id to fetch specific report data.",
          session_info: { token_created: true, firm_id: $auth_realm },
          guidance: "Use the BigTime UI to find your report ID, then call this tool again with report_id parameter."
        },
        timestamp: new Date().toISOString()
      }, null, 2);
    }
    
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, null, 2);
  }
  
} else if (apiType === 'foresight') {
  // ===== Foresight API Execution =====
  
  if (!$client_id || !$client_secret) {
    return JSON.stringify({
      success: false,
      error: 'client_id and client_secret are required for Foresight API',
      timestamp: new Date().toISOString()
    }, null, 2);
  }
  
  try {
    // Authenticate with OAuth2
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', $client_id);
    params.append('client_secret', $client_secret);
    params.append('scope', $scope || 'read');
    
    const authResponse = await fetch(API_CONFIG.foresight.authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    
    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      throw new Error(`Foresight API authentication failed (${authResponse.status}): ${errorText}`);
    }
    
    const authData = await authResponse.json();
    
    if (!authData.access_token) {
      throw new Error('No access token received from Foresight API');
    }
    
    // Build forecast URL
    let forecastUrl = API_CONFIG.foresight.baseUrl + API_CONFIG.foresight.forecastsEndpoint;
    
    if ($forecast_id) {
      forecastUrl += `${$forecast_id}/`;
    } else {
      const params = new URLSearchParams();
      
      if ($page_size) {
        params.append('page_size', $page_size.toString());
      }
      
      if ($filters) {
        try {
          const filters = JSON.parse($filters);
          Object.keys(filters).forEach(key => {
            params.append(key, filters[key]);
          });
        } catch (e) {
          console.warn('Invalid filters JSON:', e.message);
        }
      }
      
      const queryString = params.toString();
      if (queryString) {
        forecastUrl += `?${queryString}`;
      }
    }
    
    // Fetch forecast data
    const forecastResponse = await fetch(forecastUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authData.access_token}`,
        'Content-Type': 'application/json',
        'X-Enable-Synchronous-Related-Fetch': 'True'
      }
    });
    
    if (forecastResponse.status === 429) {
      throw new Error('Rate limit exceeded. Foresight API allows 60 requests per minute.');
    }
    
    if (!forecastResponse.ok) {
      const errorText = await forecastResponse.text();
      throw new Error(`Foresight API request failed (${forecastResponse.status}): ${errorText}`);
    }
    
    const forecastData = await forecastResponse.json();
    
    return JSON.stringify({
      success: true,
      api_type: 'foresight',
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
  
} else {
  return JSON.stringify({
    success: false,
    error: `Invalid api_type: ${apiType}. Must be 'iq' or 'foresight'`,
    timestamp: new Date().toISOString()
  }, null, 2);
}
