# Quick Start Guide

Get started with the BigTime Forecast Tool for Flowise AI in just a few minutes!

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Your Credentials (2 minutes)

You need BigTime Foresight API credentials:

1. Log into your BigTime account
2. Contact your BigTime administrator or visit the [BigTime Developer Portal](https://developer.foresight.bigtime.net/)
3. Request OAuth2 credentials:
   - Client ID
   - Client Secret
   - Scope: 'read' (for viewing forecast data)

### Step 2: Install in Flowise (3 minutes)

#### Option A: Copy-Paste Method (Easiest)

1. Open your Flowise instance
2. Go to **Tools** → **Create Custom Tool**
3. Fill in:
   - **Name**: `BigTime Forecast`
   - **Description**: Copy from `BigTimeForecastTool.js` line 15
   - **Input Schema**: Copy JSON schema from lines 18-50
   - **Code**: Copy the entire `BigTimeForecastTool.js` file
4. Click **Save**

#### Option B: Node Module Method

```bash
git clone https://github.com/rdavis023/bigtime.git
cd bigtime
npm install
# Copy to your Flowise custom tools directory
```

### Step 3: Create Your First Workflow (2 minutes)

1. In Flowise, create a new workflow
2. Add these nodes:
   - **Chat Input**
   - **OpenAI/ChatGPT Agent**
   - **BigTime Forecast Tool** (your custom tool)
   - **Response Output**
3. Connect them: Input → Agent → Output (with tool attached to agent)
4. Configure the agent with this prompt:

```
You are a project management assistant with access to BigTime forecast data.
Use the bigtime_forecast tool when users ask about forecasts or resource allocation.
```

5. Configure tool parameters:
   - **client_id**: `[Your Client ID]`
   - **client_secret**: `[Your Client Secret]`
   - **scope**: `read`

6. Save and test!

## 🧪 Test Your Setup

Try these queries in your Flowise chat:

1. "Show me all current forecasts"
2. "What forecasts do we have?"
3. "Get forecast data for the next month"

Expected output: JSON data with forecast information or a friendly error message if credentials are incorrect.

## ✅ Validation

Before using in production, run the validation script:

```bash
node validate.js
```

All tests should pass with ✓ marks.

## 🆘 Quick Troubleshooting

**Problem**: Tool not appearing in Flowise
- **Solution**: Refresh browser, check tool name is unique

**Problem**: Authentication failed (401)
- **Solution**: Double-check client_id and client_secret

**Problem**: No data returned
- **Solution**: Verify you have forecasts in your BigTime account

**Problem**: Rate limit (429)
- **Solution**: Wait 60 seconds, BigTime allows 60 requests/minute

## 📚 Next Steps

Once working:

1. ✅ Read the [Full README](README.md) for comprehensive documentation
2. ✅ Review [Flowise Integration Guide](FLOWISE_INTEGRATION.md) for advanced usage
3. ✅ Check out [Examples](examples/) for code samples
4. ✅ Configure security: Use environment variables for credentials

## 🎯 Common Use Cases

### Use Case 1: Daily Forecast Report

Create a scheduled workflow that:
1. Fetches all forecasts
2. Formats into a daily report
3. Sends via email/Slack

### Use Case 2: Resource Allocation Check

When user asks about specific project:
1. Extract project ID from query
2. Fetch forecast with project filter
3. Analyze resource allocation
4. Provide recommendations

### Use Case 3: Capacity Planning

Multi-step analysis:
1. Fetch all forecasts for date range
2. Calculate total hours/resources
3. Compare with available capacity
4. Generate utilization report

## 💡 Tips for Success

1. **Start Simple**: First, just fetch all forecasts without filters
2. **Use Filters**: Add filters once basic retrieval works
3. **Handle Errors**: Always check for `success: false` in responses
4. **Cache Data**: Implement caching to reduce API calls
5. **Monitor Usage**: Keep track of API rate limits

## 🔐 Security Reminder

⚠️ **Never commit credentials to Git!**

```bash
# Add to .gitignore
echo "config.json" >> .gitignore
echo ".env" >> .gitignore
```

Use environment variables:
```bash
export BIGTIME_CLIENT_ID="your_id"
export BIGTIME_CLIENT_SECRET="your_secret"
```

## 📞 Get Help

- **Documentation Issues**: Open an issue on GitHub
- **BigTime API Questions**: [BigTime Support](https://help.bigtime.net/)
- **Flowise Questions**: [Flowise Community](https://github.com/FlowiseAI/Flowise/discussions)

---

**You're all set! Happy forecasting! 🎉**

Need more details? Check the [complete README](README.md).
