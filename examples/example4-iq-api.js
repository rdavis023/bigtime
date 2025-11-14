/**
 * Example: Using BigTime IQ API v2 with Session Authentication
 * 
 * This example demonstrates how to use the tool with the BigTime IQ API v2
 * using username/password authentication (as provided in the Google Sheet).
 */

const BigTimeToolV2 = require('../BigTimeForecastToolV2');

async function iqApiExample() {
  console.log('=== BigTime IQ API v2 Example ===\n');
  
  // These credentials match the Google Sheet variables
  // Note: In production, use environment variables or secure credential storage
  const IQ_USERNAME = 'ntrander@intecrowd.com';  // Decoded from base64
  const IQ_PASSWORD = 'sf8H5CRN#DcP5!H@';       // Decoded from base64
  const IQ_AUTH_REALM = 'byjk-mox-dipx';
  
  try {
    console.log('Connecting to BigTime IQ API v2...');
    console.log(`Username: ${IQ_USERNAME}`);
    console.log(`Auth Realm: ${IQ_AUTH_REALM}\n`);
    
    // Example 1: Create session without fetching specific report
    console.log('--- Example 1: Create Session ---');
    const sessionResult = await BigTimeToolV2.execute(
      'iq',              // api_type
      IQ_USERNAME,       // username
      IQ_PASSWORD,       // password
      IQ_AUTH_REALM,     // auth_realm
      null,              // client_id (not used for IQ API)
      null,              // client_secret (not used for IQ API)
      null,              // scope (not used for IQ API)
      null,              // report_id (not provided yet)
      null,              // forecast_id (not used for IQ API)
      null,              // start_date
      null,              // end_date
      null,              // page_size (not used for IQ API)
      null               // filters
    );
    
    const parsed1 = JSON.parse(sessionResult);
    if (parsed1.success) {
      console.log('✓ Session created successfully!');
      console.log('Response:', JSON.stringify(parsed1, null, 2));
    } else {
      console.error('✗ Error:', parsed1.error);
    }
    
    // Example 2: Fetch a specific report with date filters
    console.log('\n--- Example 2: Fetch Report with Date Range ---');
    console.log('Note: Replace REPORT_ID with an actual report ID from your BigTime account\n');
    
    const REPORT_ID = 'YOUR_REPORT_ID_HERE';  // Replace with actual report ID
    
    if (REPORT_ID !== 'YOUR_REPORT_ID_HERE') {
      const reportResult = await BigTimeToolV2.execute(
        'iq',              // api_type
        IQ_USERNAME,       // username
        IQ_PASSWORD,       // password
        IQ_AUTH_REALM,     // auth_realm
        null,              // client_id
        null,              // client_secret
        null,              // scope
        REPORT_ID,         // report_id
        null,              // forecast_id
        '2024-01-01',      // start_date
        '2024-12-31',      // end_date
        null,              // page_size
        null               // filters
      );
      
      const parsed2 = JSON.parse(reportResult);
      if (parsed2.success) {
        console.log('✓ Report data retrieved successfully!');
        console.log('Response:', JSON.stringify(parsed2, null, 2));
      } else {
        console.error('✗ Error:', parsed2.error);
      }
    } else {
      console.log('Skipping report fetch - please provide a valid REPORT_ID');
      console.log('To find your report ID:');
      console.log('1. Log into BigTime');
      console.log('2. Go to Reports section');
      console.log('3. Open a report you want to query');
      console.log('4. Look for the report ID in the URL or report properties');
    }
    
  } catch (error) {
    console.error('✗ Unexpected error:', error.message);
  }
}

// Run if executed directly
if (require.main === module) {
  iqApiExample()
    .then(() => console.log('\nExample completed.'))
    .catch(err => console.error('Example failed:', err));
}

module.exports = iqApiExample;
