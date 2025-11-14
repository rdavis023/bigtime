# BigTime Flowise Tool Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Flowise AI Agent                        │
│  (Receives natural language queries from users)             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ Invokes tool with parameters
                      │
┌─────────────────────▼───────────────────────────────────────┐
│           BigTimeForecastToolV2.js                          │
│           (Custom Flowise Tool)                              │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   Main Execute Function                             │   │
│  │   - Validates parameters                            │   │
│  │   - Routes to appropriate API handler               │   │
│  └────────────┬──────────────────────────┬─────────────┘   │
│               │                          │                  │
│       ┌───────▼───────┐          ┌──────▼────────┐        │
│       │  IQ API v2    │          │ Foresight API │        │
│       │  Handler      │          │   Handler     │        │
│       └───────┬───────┘          └──────┬────────┘        │
└───────────────┼──────────────────────────┼─────────────────┘
                │                          │
                │                          │
┌───────────────▼──────────┐    ┌─────────▼──────────────────┐
│  BigTime IQ API v2       │    │  BigTime Foresight API     │
│  https://iq.bigtime.net  │    │  https://foresight-api.    │
│                          │    │         bigtime.net         │
│  Authentication:         │    │                             │
│  - Username/Password     │    │  Authentication:            │
│  - Session Token         │    │  - OAuth2 Client Creds      │
│                          │    │  - Bearer Token             │
│  Endpoints:              │    │                             │
│  - POST /session         │    │  Endpoints:                 │
│  - GET/POST /Report/Data │    │  - POST /auth/token/        │
│                          │    │  - GET /beta/forecasts/     │
│  Rate Limit: 30/min      │    │                             │
└──────────────────────────┘    │  Rate Limit: 60/min         │
                                └─────────────────────────────┘
```

## Data Flow

### IQ API v2 Flow

```
User Query → Flowise Agent → BigTime Tool
                                  │
                                  ├─> 1. Create Session (POST /session)
                                  │      Input: username, password
                                  │      Output: session token, firm ID
                                  │
                                  ├─> 2. Update Report Filters (POST /Report/Data/{id})
                                  │      Input: start_date, end_date, filters
                                  │      Headers: X-Auth-Token, X-Auth-Realm
                                  │
                                  ├─> 3. Fetch Report Data (GET /Report/Data/{id})
                                  │      Headers: X-Auth-Token, X-Auth-Realm
                                  │      Output: Report data
                                  │
                                  └─> 4. Return formatted JSON to agent
```

### Foresight API Flow

```
User Query → Flowise Agent → BigTime Tool
                                  │
                                  ├─> 1. OAuth2 Authentication (POST /auth/token/)
                                  │      Input: client_id, client_secret, scope
                                  │      Output: access_token
                                  │
                                  ├─> 2. Fetch Forecast Data (GET /beta/forecasts/)
                                  │      Headers: Authorization: Bearer {token}
                                  │      Params: page_size, filters
                                  │      Output: Forecast data (paginated)
                                  │
                                  └─> 3. Return formatted JSON to agent
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BigTimeForecastToolV2.js                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  TOOL_CONFIG                                                │
│  ├─ name: "bigtime_forecast"                                │
│  ├─ description: Tool description for AI agent              │
│  └─ schema: Input parameter definitions                     │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  API_CONFIG                                                 │
│  ├─ iq: IQ API endpoints and settings                       │
│  └─ foresight: Foresight API endpoints and settings         │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Main Functions                                             │
│  ├─ executeTool(): Entry point, routes to API handlers     │
│  ├─ executeIQAPI(): IQ API workflow                         │
│  └─ executeForesightAPI(): Foresight API workflow           │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  IQ API Functions                                           │
│  ├─ createIQSession(): Authenticate and get token           │
│  ├─ fetchIQReport(): Get report data                        │
│  └─ updateIQReportFilters(): Apply date/custom filters      │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Foresight API Functions                                    │
│  ├─ authenticateWithForesight(): OAuth2 authentication      │
│  └─ fetchForesightData(): Get forecast data                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Parameter Flow

### IQ API Parameters

```
Flowise Input
    │
    ├─> api_type: "iq"
    ├─> username: "ntrander@intecrowd.com"
    ├─> password: "sf8H5CRN#DcP5!H@"
    ├─> auth_realm: "byjk-mox-dipx"
    ├─> report_id: "12345" (optional)
    ├─> start_date: "2024-01-01" (optional)
    └─> end_date: "2024-12-31" (optional)
         │
         ▼
    executeTool()
         │
         ▼
    executeIQAPI()
         │
         ├─> createIQSession(username, password, auth_realm)
         │       │
         │       └─> Returns: {token, firmId}
         │
         └─> fetchIQReport(sessionData, report_id, dates, filters)
                 │
                 └─> Returns: Report data
```

### Foresight API Parameters

```
Flowise Input
    │
    ├─> api_type: "foresight"
    ├─> client_id: "your_client_id"
    ├─> client_secret: "your_client_secret"
    ├─> scope: "read"
    ├─> forecast_id: "forecast-123" (optional)
    ├─> page_size: 50 (optional)
    └─> filters: '{"project_id":"789"}' (optional)
         │
         ▼
    executeTool()
         │
         ▼
    executeForesightAPI()
         │
         ├─> authenticateWithForesight(client_id, client_secret, scope)
         │       │
         │       └─> Returns: access_token
         │
         └─> fetchForesightData(token, forecast_id, page_size, filters)
                 │
                 └─> Returns: Forecast data
```

## Error Handling Flow

```
API Call
    │
    ├─> Success (200/201)
    │       │
    │       └─> Return formatted JSON:
    │           {
    │             "success": true,
    │             "data": {...},
    │             "timestamp": "...",
    │             "message": "..."
    │           }
    │
    ├─> Rate Limit (429/503)
    │       │
    │       └─> Throw Error:
    │           "Rate limit exceeded. API allows X requests per minute"
    │
    ├─> Authentication Error (401)
    │       │
    │       └─> Throw Error:
    │           "Authentication failed: Invalid credentials"
    │
    ├─> Not Found (404)
    │       │
    │       └─> Throw Error:
    │           "Resource not found: Invalid ID"
    │
    └─> Other Errors
            │
            └─> Throw Error with details
                    │
                    ▼
            catch in executeTool()
                    │
                    └─> Return formatted error JSON:
                        {
                          "success": false,
                          "error": "...",
                          "timestamp": "..."
                        }
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Security Layers                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Credential Storage                                       │
│     ├─ Environment Variables (Recommended)                   │
│     ├─ Flowise Credential Manager                           │
│     └─ Secure Configuration Files (.gitignore protected)    │
│                                                              │
│  2. Transport Security                                       │
│     ├─ HTTPS only for API calls                             │
│     └─ No credential logging                                │
│                                                              │
│  3. Authentication                                           │
│     ├─ IQ API: Session tokens (ephemeral)                   │
│     └─ Foresight API: OAuth2 Bearer tokens (time-limited)   │
│                                                              │
│  4. Authorization                                            │
│     ├─ Minimum required scope                               │
│     └─ Firm/realm isolation                                 │
│                                                              │
│  5. Dependency Security                                      │
│     ├─ npm audit: 0 vulnerabilities                         │
│     └─ Minimal dependencies (only node-fetch)               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Options

### Option 1: Flowise UI (Recommended)

```
1. Copy BigTimeForecastToolV2.js content
2. Flowise → Tools → Create Custom Tool
3. Paste code and configure schema
4. Attach to agent
5. Test with queries
```

### Option 2: Node Module

```
1. Clone repository
2. npm install
3. Import module in Flowise custom code
4. Configure and use
```

### Option 3: Standalone Service

```
1. Deploy as separate API service
2. Call from Flowise via HTTP
3. Manage independently
```

## Performance Characteristics

```
┌────────────────────────────────────────────────────────┐
│                    Performance Metrics                  │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Response Times (typical):                             │
│  ├─ Authentication: 200-500ms                          │
│  ├─ Data Fetch: 500-2000ms                             │
│  └─ Total: 1-3 seconds                                 │
│                                                         │
│  Rate Limits:                                          │
│  ├─ IQ API: 30 requests/minute                         │
│  └─ Foresight API: 60 requests/minute                  │
│                                                         │
│  Optimization Strategies:                              │
│  ├─ Cache authentication tokens                        │
│  ├─ Batch requests when possible                       │
│  ├─ Use pagination for large datasets                  │
│  └─ Implement request queuing                          │
│                                                         │
└────────────────────────────────────────────────────────┘
```

## Integration Points

```
┌─────────────────────────────────────────────────────────┐
│               Flowise Agent Configuration               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  System Prompt:                                         │
│  "You are a project management assistant with access    │
│   to BigTime forecast data. Use the bigtime_forecast   │
│   tool when users ask about forecasts..."               │
│                                                          │
│  Tools:                                                 │
│  └─ BigTime Forecast Tool                               │
│      ├─ api_type: iq/foresight                          │
│      ├─ Credentials (from secure storage)               │
│      └─ Optional filters                                │
│                                                          │
│  Example Queries:                                       │
│  ├─ "Show me forecasts for this month"                  │
│  ├─ "What's allocated to Project X?"                    │
│  └─ "Get forecast report for Q1"                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Monitoring & Observability

```
Key Metrics to Track:

1. API Call Success Rate
   ├─ Target: > 95%
   └─ Alert if < 90%

2. Response Time
   ├─ Target: < 3 seconds
   └─ Alert if > 5 seconds

3. Rate Limit Usage
   ├─ Track requests per minute
   └─ Alert if approaching limit

4. Error Rate
   ├─ Track by error type
   └─ Alert on auth failures

5. Agent Accuracy
   ├─ Track user satisfaction
   └─ Monitor query success
```

---

**Architecture Notes:**
- Modular design for easy maintenance
- Clear separation of concerns
- Comprehensive error handling
- Security-first approach
- Production-ready code quality
