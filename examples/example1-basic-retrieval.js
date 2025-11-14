/**
 * Example 1: Basic Forecast Retrieval
 * 
 * This example demonstrates how to use the BigTime Forecast Tool
 * to retrieve all available forecasts without filters.
 */

const BigTimeTool = require('../BigTimeForecastTool');

async function basicForecastRetrieval() {
  console.log('=== Basic Forecast Retrieval Example ===\n');
  
  // Replace with your actual credentials
  const CLIENT_ID = process.env.BIGTIME_CLIENT_ID || 'your_client_id_here';
  const CLIENT_SECRET = process.env.BIGTIME_CLIENT_SECRET || 'your_client_secret_here';
  
  try {
    console.log('Fetching all forecasts...');
    
    // Call the tool with minimal parameters
    const result = await BigTimeTool.execute(
      CLIENT_ID,        // client_id
      CLIENT_SECRET,    // client_secret
      'read',           // scope
      null,             // forecast_id (null = get all)
      50,               // page_size
      null              // filters
    );
    
    // Parse and display results
    const parsedResult = JSON.parse(result);
    
    if (parsedResult.success) {
      console.log('✓ Success!');
      console.log(`Retrieved ${parsedResult.data.results?.length || 0} forecasts`);
      console.log('\nSample data:');
      console.log(JSON.stringify(parsedResult.data.results?.slice(0, 2), null, 2));
    } else {
      console.error('✗ Error:', parsedResult.error);
    }
    
  } catch (error) {
    console.error('✗ Unexpected error:', error.message);
  }
}

// Run if executed directly
if (require.main === module) {
  basicForecastRetrieval()
    .then(() => console.log('\nExample completed.'))
    .catch(err => console.error('Example failed:', err));
}

module.exports = basicForecastRetrieval;
