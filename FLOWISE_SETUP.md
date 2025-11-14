# Flowise Custom Tool Setup Guide

## ⚠️ Important: How to Add the Tool to Flowise

Flowise Custom Tools require **TWO separate inputs**:
1. **Input Schema** (JSON format) - Defines the tool parameters
2. **Function Code** (JavaScript) - The actual tool logic

**Do NOT paste the entire `.js` file into Flowise!** The schema and code must be separated.

## Quick Setup (5 Minutes)

### Step 1: Open Flowise Custom Tool Creator

1. Log into your Flowise instance
2. Navigate to **Tools** → **Custom Tools** → **+ Create**
3. You'll see three main fields:
   - Tool Name
   - Tool Description
   - Input Schema (JSON)
   - Function Code (JavaScript)

### Step 2: Configure Basic Settings

**Tool Name:**
```
BigTime Forecast Tool
```

**Tool Description:**
```
Fetches forecast data from BigTime APIs. Supports both BigTime IQ API v2 (session-based) and Foresight API (OAuth2). Use for project forecasts, resource allocation, and capacity planning.
```

### Step 3: Add Input Schema

Copy and paste this array into the **Input Schema** field:

```json
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
```

### Step 4: Add Function Code

Open the file `FlowiseCustomTool.js` in this repository and:

1. Find the section marked **"FLOWISE FUNCTION CODE"**
2. Copy everything AFTER that comment (starting from `// API Configuration`)
3. Paste into the **Function Code** field in Flowise

**OR** if you prefer, here's the direct code:

<details>
<summary>Click to expand Function Code</summary>

```javascript
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
```

</details>

### Step 5: Save and Verify

1. Click **Save** or **Create Tool**
2. You should now see input fields appear in the UI:
   - api_type (dropdown: iq/foresight)
   - username
   - password
   - auth_realm
   - client_id
   - client_secret
   - scope
   - report_id
   - forecast_id
   - start_date
   - end_date
   - page_size
   - filters

3. If you DON'T see these fields, the schema wasn't properly added. Go back and check Step 3.

## Testing Your Tool

### Test 1: IQ API (Quick Test)

Configure the tool with:
- **api_type**: `iq`
- **username**: `ntrander@intecrowd.com`
- **password**: `sf8H5CRN#DcP5!H@`
- **auth_realm**: `byjk-mox-dipx`
- Leave other fields empty

Expected result: Session creation confirmation

### Test 2: IQ API with Report

Same as above, but add:
- **report_id**: (your actual report ID from BigTime)
- **start_date**: `2024-01-01`
- **end_date**: `2024-12-31`

Expected result: Report data

### Test 3: Foresight API

Configure the tool with:
- **api_type**: `foresight`
- **client_id**: (your OAuth2 client ID)
- **client_secret**: (your OAuth2 client secret)
- **scope**: `read`
- Leave other fields empty

Expected result: List of forecasts

## Troubleshooting

### Issue: No Input Fields Showing

**Cause**: The Input Schema wasn't properly added or has syntax errors

**Solution**:
1. Check that you pasted the schema into the **Input Schema** field (NOT the code field)
2. Verify the JSON is valid (use a JSON validator)
3. Make sure there are no extra characters before/after the JSON
4. Try refreshing the Flowise page after saving

### Issue: "Variable $api_type is not defined"

**Cause**: The function code was pasted into the wrong field or the schema field name doesn't match

**Solution**:
1. Verify the Input Schema has all the property names exactly as shown
2. Make sure you pasted the function code (not the schema) into the Code field

### Issue: Authentication Errors

**Cause**: Incorrect credentials or API access

**Solution**:
1. Double-check your credentials are correct
2. Verify your BigTime account has API access
3. For IQ API: Check username, password, and auth_realm
4. For Foresight API: Verify OAuth2 credentials with your admin

### Issue: Tool Executes but Returns Empty Data

**Cause**: Missing report_id or forecast_id, or no data in BigTime

**Solution**:
1. For IQ API: Provide a valid report_id
2. For Foresight API: Check that forecasts exist in your account
3. Try with date filters to narrow results

## Using the Tool in an Agent

Once the tool is created:

1. Create or edit an Agent in Flowise
2. In the Agent configuration, find **Tools** section
3. Select your **BigTime Forecast Tool**
4. Configure default values for credentials (recommended: use environment variables)
5. Add to your agent's system prompt:

```
You have access to the bigtime_forecast tool for retrieving forecast data from BigTime.

When users ask about forecasts, projects, or resources:
1. Use api_type='iq' with the configured credentials
2. Extract project names, date ranges from the user query
3. Call the tool with appropriate parameters
4. Present results in a clear, organized format
```

## Files Reference

- **FlowiseCustomTool.js** - Contains both schema (as comment) and code in proper format
- **BigTimeForecastToolV2.js** - Full Node.js module (not for direct Flowise use)
- **BigTimeForecastTool.js** - Foresight API only version (not for direct Flowise use)

## Need Help?

- Check the main README.md for detailed API documentation
- Review AGENT_PROMPTS.md for agent configuration examples
- See API_COMPARISON.md to choose the right API for your needs

---

**Important**: The `.js` files in this repo are for Node.js usage and documentation. For Flowise, always separate the schema (JSON) from the code (JavaScript) as shown in this guide.
