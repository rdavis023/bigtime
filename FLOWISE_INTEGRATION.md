# Flowise Integration Guide

This guide provides step-by-step instructions for integrating the BigTime Forecast Tool into your Flowise AI workflows.

## Table of Contents

1. [Installation Methods](#installation-methods)
2. [Tool Configuration](#tool-configuration)
3. [Creating Your First Workflow](#creating-your-first-workflow)
4. [Advanced Usage](#advanced-usage)
5. [Best Practices](#best-practices)

## Installation Methods

### Method 1: Custom Tool in Flowise UI (Recommended)

This is the easiest method for most users.

#### Step 1: Access Custom Tool Interface

1. Open your Flowise instance
2. Navigate to **Marketplace** → **Tools**
3. Click **Create Custom Tool** or **Add Custom Tool**

#### Step 2: Configure Tool Properties

Fill in the following fields:

**Name:**
```
BigTime Forecast
```

**Description:**
```
Use this tool to fetch forecast data from BigTime Foresight API. This tool retrieves project forecasts, resource allocations, and capacity planning data. Provide optional filters like project ID, date range, or staff member.
```

#### Step 3: Define Input Schema

In the **Input Schema** section, use this JSON:

```json
{
  "type": "object",
  "properties": {
    "client_id": {
      "type": "string",
      "description": "BigTime Foresight API OAuth2 client ID (required for authentication)"
    },
    "client_secret": {
      "type": "string",
      "description": "BigTime Foresight API OAuth2 client secret (required for authentication)"
    },
    "scope": {
      "type": "string",
      "description": "OAuth2 scope (default: 'read'). Options: 'read', 'write', 'finance'",
      "default": "read"
    },
    "forecast_id": {
      "type": "string",
      "description": "Optional: Specific forecast ID to retrieve. If not provided, returns list of forecasts."
    },
    "page_size": {
      "type": "number",
      "description": "Optional: Number of results per page (default: 50, max: 100)",
      "default": 50
    },
    "filters": {
      "type": "string",
      "description": "Optional: JSON string of additional filters (e.g., {\"project_id\": \"123\", \"start_date\": \"2024-01-01\"})"
    }
  },
  "required": ["client_id", "client_secret"]
}
```

#### Step 4: Paste Tool Code

In the **JavaScript Code** or **Function** section, paste the entire contents of `BigTimeForecastTool.js`.

Alternatively, you can paste just the function logic (everything inside `executeTool` and supporting functions).

#### Step 5: Save and Test

1. Click **Save**
2. Test with sample credentials (if available)
3. The tool should now appear in your tools list

### Method 2: Import as Node Module

If your Flowise instance supports custom node modules:

#### Step 1: Install Package

```bash
cd /path/to/flowise/custom-tools
npm install node-fetch
```

#### Step 2: Copy Tool File

```bash
cp /path/to/BigTimeForecastTool.js ./bigtime-forecast-tool.js
```

#### Step 3: Register in Flowise

Follow your Flowise instance's documentation for registering custom node modules.

## Tool Configuration

### Setting Up Credentials

You have several options for managing credentials:

#### Option 1: Direct Input (Quick Testing)

Pass credentials directly when calling the tool:
- **Pros**: Simple, no setup required
- **Cons**: Credentials visible in workflow, not secure for production

#### Option 2: Flowise Credential Store

If your Flowise version supports credential management:

1. Go to **Settings** → **Credentials**
2. Add new credential: "BigTime API"
3. Store `client_id` and `client_secret`
4. Reference in tool: `{{$credentials.bigtime.client_id}}`

#### Option 3: Environment Variables

Set system environment variables:

```bash
export BIGTIME_CLIENT_ID="your_client_id_here"
export BIGTIME_CLIENT_SECRET="your_secret_here"
```

Modify the tool to read from environment:
```javascript
const clientId = process.env.BIGTIME_CLIENT_ID || $client_id;
const clientSecret = process.env.BIGTIME_CLIENT_SECRET || $client_secret;
```

## Creating Your First Workflow

### Example 1: Simple Forecast Retrieval

#### Workflow Components:

1. **Chat Trigger** (Input)
2. **OpenAI/ChatGPT Agent** (Processing)
3. **BigTime Forecast Tool** (Tool)
4. **Response** (Output)

#### Agent System Prompt:

```
You are a helpful project management assistant with access to BigTime forecast data.

When users ask about forecasts, projects, or resource allocation, use the bigtime_forecast tool to fetch the latest data.

Always:
1. Interpret the user's request to determine what forecast data is needed
2. Use appropriate filters to narrow down results
3. Present the data in a clear, organized manner
4. Highlight key insights and trends

If the user asks for specific projects or date ranges, extract those parameters and include them in your tool call.
```

#### Tool Configuration:

- **client_id**: `{{your_client_id}}`
- **client_secret**: `{{your_client_secret}}`
- **scope**: `read`
- **Other fields**: Leave empty for agent to determine

#### Test Queries:

1. "Show me all current forecasts"
2. "What forecasts do we have for the next quarter?"
3. "Get forecast details for project 12345"

### Example 2: Filtered Forecast Query

#### Workflow Setup:

Same as Example 1, but with more specific agent instructions.

#### Enhanced Agent Prompt:

```
You are an advanced project analytics assistant with BigTime integration.

When analyzing forecasts:
1. Always request filtered data to improve performance
2. Use date ranges when the user mentions timeframes like "this month", "Q1", etc.
3. Include project IDs when discussing specific projects
4. Paginate results if the user wants a summary

Example tool call patterns:
- User asks "next quarter" → Calculate dates and use start_date/end_date filters
- User mentions "Project Phoenix" → Look up project ID and filter by project_id
- User wants "top 10" → Set page_size to 10
```

#### Test Queries:

1. "Show me forecasts for Q1 2024"
2. "What's the resource allocation for Project Phoenix next month?"
3. "Give me the top 5 forecasts by total hours"

### Example 3: Multi-Step Analysis Workflow

This workflow performs analysis on forecast data.

#### Workflow Components:

1. **Chat Trigger**
2. **OpenAI Agent** (with BigTime Forecast Tool)
3. **Code Executor** (for calculations)
4. **Chart Generator** (for visualizations)
5. **Response**

#### Agent Prompt:

```
You are a data analyst specializing in project forecasting.

When users request analysis:
1. Fetch relevant forecast data using bigtime_forecast tool
2. Extract numeric data (hours, costs, resources)
3. Perform calculations or comparisons
4. Generate insights and recommendations

You can:
- Compare multiple forecasts
- Calculate utilization rates
- Identify over/under-allocated resources
- Predict trends based on historical data
```

#### Example Flow:

User: "Compare resource allocation between projects A and B"

1. Agent fetches forecast for project A
2. Agent fetches forecast for project B
3. Agent compares data points
4. Agent generates comparison report
5. (Optional) Create visualization

## Advanced Usage

### Custom Filter Builder

Create a helper workflow that builds complex filters:

```javascript
// In a Function node before BigTime tool
const buildFilters = (userInput) => {
  const filters = {};
  
  // Parse date mentions
  if (userInput.includes('this month')) {
    const now = new Date();
    filters.start_date = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    filters.end_date = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  }
  
  // Parse project mentions
  const projectMatch = userInput.match(/project (\d+)/i);
  if (projectMatch) {
    filters.project_id = projectMatch[1];
  }
  
  return JSON.stringify(filters);
};

return buildFilters($userMessage);
```

### Caching Strategy

To reduce API calls and respect rate limits:

```javascript
// Add to tool or create wrapper
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedOrFetch(cacheKey, fetchFunction) {
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  const data = await fetchFunction();
  cache.set(cacheKey, { data, timestamp: Date.now() });
  
  return data;
}
```

### Error Recovery

Add retry logic for transient failures:

```javascript
async function fetchWithRetry(fetchFunction, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchFunction();
    } catch (error) {
      if (error.message.includes('429') && i < maxRetries - 1) {
        // Wait before retrying on rate limit
        await new Promise(resolve => setTimeout(resolve, 60000));
        continue;
      }
      throw error;
    }
  }
}
```

## Best Practices

### 1. Security

✅ **DO:**
- Use credential management features
- Rotate credentials regularly
- Use minimum required scopes
- Monitor API access logs

❌ **DON'T:**
- Hardcode credentials in workflows
- Share workflows with embedded credentials
- Use 'finance' or 'write' scopes unless necessary

### 2. Performance

✅ **DO:**
- Use filters to reduce data volume
- Implement caching for frequently accessed data
- Set appropriate page_size limits
- Monitor rate limit usage

❌ **DON'T:**
- Fetch all forecasts without filters
- Make rapid successive API calls
- Ignore pagination for large datasets

### 3. User Experience

✅ **DO:**
- Provide clear error messages
- Show loading indicators for API calls
- Format responses in readable tables/lists
- Offer suggestions when no results found

❌ **DON'T:**
- Return raw JSON to users
- Leave users waiting without feedback
- Assume users know forecast IDs or project codes

### 4. Workflow Design

✅ **DO:**
- Break complex queries into smaller steps
- Validate inputs before API calls
- Handle edge cases gracefully
- Log important operations for debugging

❌ **DON'T:**
- Create deeply nested workflows
- Skip error handling
- Make assumptions about data format

## Troubleshooting Flowise Integration

### Issue: Tool Not Appearing in List

**Solution:**
1. Verify tool was saved successfully
2. Refresh Flowise page
3. Check browser console for errors
4. Ensure tool name is unique

### Issue: "Module not found" Error

**Solution:**
1. Install required dependencies: `npm install node-fetch`
2. Verify Node.js version compatibility
3. Check Flowise logs for specific module issues

### Issue: Tool Executes but Returns Empty Results

**Solution:**
1. Test credentials manually using Postman
2. Check if forecast data exists in BigTime
3. Verify filter syntax is correct
4. Review BigTime API documentation for endpoint changes

### Issue: Rate Limit Errors

**Solution:**
1. Implement request throttling
2. Add caching layer
3. Reduce workflow frequency
4. Contact BigTime for rate limit increase

## Examples Repository

For complete working examples, see:
- `/examples/basic-forecast-retrieval.json` - Simple workflow
- `/examples/filtered-query.json` - Advanced filtering
- `/examples/multi-project-comparison.json` - Complex analysis

## Support

For Flowise-specific integration help:
- Check [Flowise Documentation](https://docs.flowiseai.com/)
- Visit [Flowise Community Forum](https://github.com/FlowiseAI/Flowise/discussions)
- Open issue in this repository with `[Flowise]` tag

---

**Happy Building! 🚀**
