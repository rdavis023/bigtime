# BigTime Tool V2 - API Comparison Guide

This guide helps you choose between BigTime IQ API v2 and Foresight API, and shows how to use each.

## 📊 Quick Comparison

| Feature | BigTime IQ API v2 | BigTime Foresight API |
|---------|-------------------|----------------------|
| **Authentication** | Username/Password (Session) | OAuth2 Client Credentials |
| **Best For** | Existing BigTime users, Reports | Advanced forecasting, New integrations |
| **Rate Limit** | 30 requests/minute | 60 requests/minute |
| **Base URL** | iq.bigtime.net | foresight-api.bigtime.net |
| **Setup Complexity** | Low (use existing credentials) | Medium (requires OAuth2 setup) |
| **Data Access** | Reports, Timesheets, Projects | Forecasts, Capacity Planning |

## 🎯 Which API Should I Use?

### Use BigTime IQ API v2 if:
- ✅ You already have BigTime username/password
- ✅ You want to access existing reports
- ✅ You need quick setup without OAuth2
- ✅ You're querying standard BigTime data (timesheets, projects, staff)

### Use BigTime Foresight API if:
- ✅ You need advanced forecasting features
- ✅ You prefer OAuth2 authentication
- ✅ You're building new integrations
- ✅ You need higher rate limits (60/min vs 30/min)

## 🔧 Setup Instructions

### Setup for IQ API v2

#### Step 1: Get Your Credentials

You already have these if you use BigTime:
- **Username**: Your BigTime email (e.g., ntrander@intecrowd.com)
- **Password**: Your BigTime password
- **Auth Realm**: Your firm ID (e.g., byjk-mox-dipx)

#### Step 2: Find Report IDs

1. Log into BigTime
2. Navigate to **Reports**
3. Open a report you want to query via API
4. Note the Report ID (visible in URL or report properties)

#### Step 3: Configure in Flowise

Set these parameters:
```javascript
{
  "api_type": "iq",
  "username": "ntrander@intecrowd.com",
  "password": "your_password",
  "auth_realm": "byjk-mox-dipx",
  "report_id": "12345",  // Your report ID
  "start_date": "2024-01-01",
  "end_date": "2024-12-31"
}
```

### Setup for Foresight API

#### Step 1: Get OAuth2 Credentials

1. Contact BigTime administrator
2. Visit [BigTime Developer Portal](https://developer.foresight.bigtime.net/)
3. Request OAuth2 credentials:
   - Client ID
   - Client Secret
   - Scope (typically 'read')

#### Step 2: Configure in Flowise

Set these parameters:
```javascript
{
  "api_type": "foresight",
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "scope": "read",
  "forecast_id": "forecast-123",  // Optional
  "page_size": 50
}
```

## 📝 Parameter Reference

### Common Parameters (Both APIs)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `api_type` | string | No | 'iq' or 'foresight' (default: 'iq') |
| `start_date` | string | No | Start date filter (YYYY-MM-DD) |
| `end_date` | string | No | End date filter (YYYY-MM-DD) |
| `filters` | string | No | JSON string of additional filters |

### IQ API v2 Specific Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | Yes* | BigTime username (email) |
| `password` | string | Yes* | BigTime password |
| `auth_realm` | string | Yes* | BigTime firm ID |
| `report_id` | string | No | Specific report to fetch |

*Required when `api_type` = 'iq'

### Foresight API Specific Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `client_id` | string | Yes* | OAuth2 client ID |
| `client_secret` | string | Yes* | OAuth2 client secret |
| `scope` | string | No | OAuth2 scope (default: 'read') |
| `forecast_id` | string | No | Specific forecast to fetch |
| `page_size` | number | No | Results per page (default: 50) |

*Required when `api_type` = 'foresight'

## 💻 Code Examples

### Example 1: IQ API - Fetch Report Data

```javascript
const BigTimeTool = require('./BigTimeForecastToolV2');

const result = await BigTimeTool.execute(
  'iq',                           // api_type
  'ntrander@intecrowd.com',       // username
  'sf8H5CRN#DcP5!H@',             // password
  'byjk-mox-dipx',                // auth_realm
  null, null, null,               // Foresight creds (not used)
  '12345',                        // report_id
  null,                           // forecast_id (not used)
  '2024-01-01',                   // start_date
  '2024-12-31',                   // end_date
  null,                           // page_size (not used)
  null                            // filters
);

console.log(result);
```

### Example 2: IQ API - Create Session Only

```javascript
const result = await BigTimeTool.execute(
  'iq',                           // api_type
  'ntrander@intecrowd.com',       // username
  'sf8H5CRN#DcP5!H@',             // password
  'byjk-mox-dipx',                // auth_realm
  null, null, null,               // Foresight creds
  null,                           // report_id (not provided)
  null, null, null,               // Other params
  null, null
);

// Returns session info and guidance on next steps
```

### Example 3: Foresight API - List Forecasts

```javascript
const result = await BigTimeTool.execute(
  'foresight',                    // api_type
  null, null, null,               // IQ creds (not used)
  'your_client_id',               // client_id
  'your_client_secret',           // client_secret
  'read',                         // scope
  null,                           // report_id (not used)
  null,                           // forecast_id (list all)
  null, null,                     // dates (use filters)
  50,                             // page_size
  '{"project_id": "789"}'         // filters
);

console.log(result);
```

### Example 4: Foresight API - Get Specific Forecast

```javascript
const result = await BigTimeTool.execute(
  'foresight',                    // api_type
  null, null, null,               // IQ creds (not used)
  'your_client_id',               // client_id
  'your_client_secret',           // client_secret
  'read',                         // scope
  null,                           // report_id (not used)
  'forecast-abc-123',             // forecast_id
  null, null,                     // dates
  null,                           // page_size
  null                            // filters
);

console.log(result);
```

## 🚀 Using in Flowise

### IQ API Agent Prompt Example

```
You are a project management assistant with access to BigTime data via the IQ API.

When users ask about reports, timesheets, or project data:
1. Use api_type='iq'
2. Provide the username, password, and auth_realm (from secure storage)
3. If they mention a specific report, use the report_id
4. If they mention date ranges, use start_date and end_date

Always format responses in clear, readable tables or summaries.
```

### Foresight API Agent Prompt Example

```
You are a forecasting analyst with access to BigTime Foresight API.

When users ask about forecasts or capacity planning:
1. Use api_type='foresight'
2. Provide OAuth2 credentials (from secure storage)
3. Use forecast_id for specific forecasts
4. Use filters for project-specific or date-specific queries

Present forecast data with insights and recommendations.
```

## 🔒 Security Best Practices

### For IQ API

1. **Never hardcode credentials** in workflows or code
2. Use Flowise credential manager or environment variables:
   ```bash
   export BIGTIME_IQ_USERNAME="your_username"
   export BIGTIME_IQ_PASSWORD="your_password"
   export BIGTIME_IQ_REALM="your_realm"
   ```
3. The provided credentials are encoded in base64 in Google Sheets - decode them:
   ```javascript
   const username = Buffer.from('bnRyYW5kZW1AaW50ZWNyb3dkLmNvbQ==', 'base64').toString();
   const password = Buffer.from('c2Y4SDVDUk4jRGNQNSFIQA==', 'base64').toString();
   ```

### For Foresight API

1. **Never commit OAuth2 credentials** to version control
2. Use environment variables:
   ```bash
   export BIGTIME_FORESIGHT_CLIENT_ID="your_client_id"
   export BIGTIME_FORESIGHT_CLIENT_SECRET="your_secret"
   ```
3. Rotate credentials periodically

## 🐛 Troubleshooting

### IQ API Issues

**Problem**: "Authentication failed (401)"
- ✓ Check username, password, and auth_realm are correct
- ✓ Verify account is not locked
- ✓ Ensure password is properly decoded if using base64

**Problem**: "Report not found (404)"
- ✓ Verify report_id is correct
- ✓ Check you have permissions to access the report
- ✓ Try creating session first without report_id

**Problem**: "Rate limit (503)"
- ✓ IQ API limit is 30 requests/minute
- ✓ Implement delays between requests
- ✓ Consider caching results

### Foresight API Issues

**Problem**: "Invalid client credentials"
- ✓ Verify client_id and client_secret
- ✓ Check scope is valid ('read', 'write', or 'finance')
- ✓ Ensure credentials haven't expired

**Problem**: "Rate limit (429)"
- ✓ Foresight API limit is 60 requests/minute
- ✓ Wait 60 seconds before retrying

## 📚 Additional Resources

- [BigTime IQ API Documentation](https://iq.bigtime.net/BigtimeData/api/v2/Help/Overview)
- [BigTime Foresight API Documentation](https://developer.foresight.bigtime.net/)
- [Flowise Documentation](https://docs.flowiseai.com/)

## 🆘 Need Help?

- **IQ API Issues**: Check BigTime Help Center or contact support
- **Foresight API Issues**: Visit BigTime Developer Portal
- **Tool Issues**: Open issue in this repository

---

**Quick Start**: If you're unsure, start with IQ API v2 - it's simpler to set up with your existing BigTime credentials!
