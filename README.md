# BigTime Forecast Tool for Flowise AI

A custom tool for Flowise AI that enables AI agents to pull forecast data from BigTime APIs. This tool provides seamless integration between Flowise AI workflows and BigTime's project forecasting, resource allocation, and capacity planning data.

**Supports two API types:**
- **BigTime IQ API v2** - Session-based authentication (username/password)
- **BigTime Foresight API** - OAuth2 authentication (client credentials)

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage in Flowise](#usage-in-flowise)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)
- [License](#license)

## ✨ Features

- **Dual API Support**: Works with both BigTime IQ API v2 and Foresight API
- **Flexible Authentication**: 
  - Session-based (username/password) for IQ API v2
  - OAuth2 client credentials for Foresight API
- **Forecast Data Retrieval**: Fetch project forecasts, resource allocations, and capacity planning data
- **Report Access**: Pull custom reports from BigTime IQ API
- **Flexible Filtering**: Support for custom filters including project ID, date ranges, and staff members
- **Pagination Support**: Handle large datasets with configurable page sizes
- **Rate Limit Handling**: Built-in awareness of both API rate limits (IQ: 30/min, Foresight: 60/min)
- **Error Handling**: Comprehensive error messages for debugging
- **Flowise Integration**: Designed specifically for Flowise AI's custom tool format

## 📦 Prerequisites

Before using this tool, you need:

1. **BigTime API Access** (choose one or both):
   
   **Option A: BigTime IQ API v2**
   - An active BigTime account
   - Username and password
   - Auth realm (firm ID)
   - Access to reports you want to query
   
   **Option B: BigTime Foresight API**
   - An active BigTime account with Foresight API access
   - OAuth2 client credentials (client ID and client secret)
   - Appropriate API permissions/scopes

2. **Flowise AI Installation**
   - Flowise AI installed and running (v1.0.0 or higher)
   - Access to create custom tools in your Flowise instance

3. **Node.js Environment**
   - Node.js 14.x or higher
   - npm or yarn package manager

## 🚀 Installation

### Method 1: Direct Installation in Flowise (Recommended)

#### For BigTime IQ API v2 (Recommended - simpler authentication):

1. Copy the contents of `BigTimeForecastToolV2.js`
2. In Flowise, navigate to **Tools** → **Custom Tool**
3. Create a new custom tool and paste the code
4. Configure the tool name, description, and input schema
5. Save the tool

#### For BigTime Foresight API:

1. Copy the contents of `BigTimeForecastTool.js` (original version)
2. Follow same steps as above

### Method 2: Package Installation

1. Copy the contents of `BigTimeForecastTool.js`
2. In Flowise, navigate to **Tools** → **Custom Tool**
3. Create a new custom tool and paste the code
4. Configure the tool name, description, and input schema
5. Save the tool

### Method 2: Package Installation

If you want to use this as a standalone Node.js module:

```bash
# Clone or download this repository
git clone https://github.com/rdavis023/bigtime.git
cd bigtime

# Install dependencies
npm install

# Test the installation (optional)
node -e "const tool = require('./BigTimeForecastTool'); console.log('Tool loaded successfully');"
```

## ⚙️ Configuration

### 1. Obtain BigTime API Credentials

Contact your BigTime administrator or visit the [BigTime Developer Portal](https://developer.foresight.bigtime.net/) to obtain:
- Client ID
- Client Secret
- Required scopes (typically 'read' for forecast data)

### 2. Configure in Flowise

When using the tool in Flowise, you'll need to provide these parameters:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `client_id` | string | Yes | Your BigTime OAuth2 client ID |
| `client_secret` | string | Yes | Your BigTime OAuth2 client secret |
| `scope` | string | No | OAuth2 scope (default: 'read'). Options: 'read', 'write', 'finance' |
| `forecast_id` | string | No | Specific forecast ID to retrieve. Omit to list all forecasts |
| `page_size` | number | No | Results per page (default: 50, max: 100) |
| `filters` | string | No | JSON string of additional filters |

### 3. Create Configuration File (Optional)

Copy the template and fill in your credentials:

```bash
cp config.template.json config.json
```

Edit `config.json` with your credentials:

```json
{
  "bigtime_foresight_api": {
    "client_id": "your_actual_client_id",
    "client_secret": "your_actual_client_secret",
    "default_scope": "read"
  }
}
```

**⚠️ Important**: Never commit `config.json` with real credentials to version control!

## 📘 Usage in Flowise

### Adding the Tool to Your Flowise Agent

1. **Open Flowise Canvas**: Create or edit an AI agent workflow
2. **Add Custom Tool Node**: 
   - Drag a "Custom Tool" node onto the canvas
   - Select "BigTime Forecast Tool" from the dropdown
3. **Connect to Agent**: Link the tool node to your agent node
4. **Configure Parameters**: Set up default values or let the agent fill them dynamically

### Example Agent Prompt

```
You are a project management assistant with access to BigTime forecast data.
When users ask about project forecasts, resource allocation, or capacity planning,
use the bigtime_forecast tool to retrieve the latest data from BigTime.

Always provide clear, actionable insights based on the forecast data.
```

### Example User Queries

- "What are the current project forecasts?"
- "Show me forecast data for project ID 12345"
- "What's our resource allocation for the next quarter?"
- "Get forecast details for forecast ID abc-123"

## 🔧 API Reference

### Tool Function Signature

```javascript
async function executeTool(
  $client_id,      // OAuth2 client ID
  $client_secret,  // OAuth2 client secret
  $scope,          // OAuth2 scope (optional, default: 'read')
  $forecast_id,    // Specific forecast ID (optional)
  $page_size,      // Results per page (optional, default: 50)
  $filters         // JSON string of filters (optional)
)
```

### Response Format

#### Success Response

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "forecast-123",
        "project_id": "proj-456",
        "start_date": "2024-01-01",
        "end_date": "2024-12-31",
        "total_hours": 1000,
        "allocated_staff": [...]
      }
    ],
    "count": 10,
    "next": "https://foresight-api.bigtime.net/beta/forecasts/?page=2",
    "previous": null
  },
  "timestamp": "2024-11-14T16:08:38.007Z",
  "message": "Successfully retrieved 10 forecasts"
}
```

#### Error Response

```json
{
  "success": false,
  "error": "Authentication failed (401): Invalid client credentials",
  "timestamp": "2024-11-14T16:08:38.007Z"
}
```

### Filter Examples

You can pass complex filters as a JSON string:

```json
{
  "project_id": "123",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "staff_member": "456"
}
```

When using in Flowise, stringify this JSON:

```javascript
'{"project_id": "123", "start_date": "2024-01-01"}'
```

## 💡 Examples

### Example 1: List All Forecasts

```javascript
const result = await executeTool(
  'your_client_id',
  'your_client_secret',
  'read',
  null,    // No specific forecast ID
  50,      // Get 50 results
  null     // No additional filters
);
```

### Example 2: Get Specific Forecast

```javascript
const result = await executeTool(
  'your_client_id',
  'your_client_secret',
  'read',
  'forecast-abc-123',  // Specific forecast ID
  null,
  null
);
```

### Example 3: Filtered Forecast Query

```javascript
const filters = JSON.stringify({
  project_id: "789",
  start_date: "2024-01-01",
  end_date: "2024-06-30"
});

const result = await executeTool(
  'your_client_id',
  'your_client_secret',
  'read',
  null,
  25,      // Smaller page size
  filters  // Apply filters
);
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Authentication Failed (401)

**Symptoms**: Error message "Authentication failed (401)"

**Solutions**:
- Verify your client_id and client_secret are correct
- Check that your API credentials are still active
- Ensure you're using the correct scope for your permissions

#### 2. Rate Limit Exceeded (429)

**Symptoms**: Error message "Rate limit exceeded"

**Solutions**:
- Wait 60 seconds before retrying
- Reduce the frequency of API calls
- Implement caching for frequently accessed data
- BigTime allows 60 requests per minute

#### 3. Invalid Filters

**Symptoms**: Filters not working or causing errors

**Solutions**:
- Ensure filters parameter is valid JSON string
- Check filter field names match BigTime API documentation
- Test filters without special characters first

#### 4. No Data Returned

**Symptoms**: Empty results array

**Solutions**:
- Verify the forecast_id exists in your BigTime account
- Check date range filters aren't too restrictive
- Ensure you have permissions to view the requested data

## 🔒 Security Considerations

### Best Practices

1. **Never Commit Credentials**: Use environment variables or secure credential storage
   ```bash
   # Add to .gitignore
   echo "config.json" >> .gitignore
   echo ".env" >> .gitignore
   ```

2. **Use Minimum Scope**: Request only the permissions you need
   - Use 'read' scope for viewing data
   - Use 'write' scope only when modifying data
   - Use 'finance' scope only when accessing financial information

3. **Rotate Credentials Regularly**: Change client secrets periodically

4. **Monitor API Usage**: Keep track of API calls to avoid rate limits

5. **Secure Storage in Flowise**: Use Flowise's credential management system when available

### Environment Variables (Recommended)

Instead of hardcoding credentials, use environment variables:

```bash
export BIGTIME_CLIENT_ID="your_client_id"
export BIGTIME_CLIENT_SECRET="your_client_secret"
```

Then modify the tool to read from environment:

```javascript
const clientId = process.env.BIGTIME_CLIENT_ID || $client_id;
const clientSecret = process.env.BIGTIME_CLIENT_SECRET || $client_secret;
```

## 📚 Additional Resources

- [BigTime Foresight API Documentation](https://developer.foresight.bigtime.net/)
- [BigTime API Getting Started Guide](https://help.bigtime.net/hc/en-us/articles/10565842022423-Getting-Started-With-BigTime-s-API)
- [Flowise AI Documentation](https://docs.flowiseai.com/)
- [Flowise Custom Tools Guide](https://docs.flowiseai.com/tutorials/tools-and-mcp)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋 Support

For issues related to:
- **This tool**: Open an issue in this repository
- **BigTime API**: Contact BigTime support or consult their documentation
- **Flowise AI**: Visit the [Flowise GitHub repository](https://github.com/FlowiseAI/Flowise)

## 📝 Changelog

### Version 1.0.0 (2024-11-14)
- Initial release
- OAuth2 authentication support
- Basic forecast data retrieval
- Pagination and filtering support
- Comprehensive error handling
- Full documentation

---

**Made with ❤️ for the Flowise AI and BigTime communities**