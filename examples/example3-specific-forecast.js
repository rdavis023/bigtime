/**
 * Example 3: Specific Forecast Retrieval
 * 
 * This example demonstrates how to retrieve a specific forecast by its ID.
 */

const BigTimeTool = require('../BigTimeForecastTool');

async function specificForecastRetrieval() {
  console.log('=== Specific Forecast Retrieval Example ===\n');
  
  // Replace with your actual credentials
  const CLIENT_ID = process.env.BIGTIME_CLIENT_ID || 'your_client_id_here';
  const CLIENT_SECRET = process.env.BIGTIME_CLIENT_SECRET || 'your_client_secret_here';
  
  // Replace with an actual forecast ID from your BigTime account
  const FORECAST_ID = 'forecast-123-abc';
  
  try {
    console.log(`Fetching forecast ${FORECAST_ID}...`);
    
    // Call the tool with specific forecast ID
    const result = await BigTimeTool.execute(
      CLIENT_ID,
      CLIENT_SECRET,
      'read',
      FORECAST_ID,     // specific forecast_id
      null,            // page_size (not applicable for single forecast)
      null             // filters (not applicable for single forecast)
    );
    
    // Parse and display results
    const parsedResult = JSON.parse(result);
    
    if (parsedResult.success) {
      console.log('✓ Success!');
      console.log(`Retrieved forecast: ${FORECAST_ID}`);
      console.log('\nForecast details:');
      console.log(JSON.stringify(parsedResult.data, null, 2));
    } else {
      console.error('✗ Error:', parsedResult.error);
      
      if (parsedResult.error.includes('404')) {
        console.log('\nTip: The forecast ID may not exist. Try running example1-basic-retrieval.js first to see available forecast IDs.');
      }
    }
    
  } catch (error) {
    console.error('✗ Unexpected error:', error.message);
  }
}

// Run if executed directly
if (require.main === module) {
  specificForecastRetrieval()
    .then(() => console.log('\nExample completed.'))
    .catch(err => console.error('Example failed:', err));
}

module.exports = specificForecastRetrieval;
