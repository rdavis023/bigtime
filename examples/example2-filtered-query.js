/**
 * Example 2: Filtered Forecast Query
 * 
 * This example demonstrates how to use custom filters to retrieve
 * specific forecast data based on project ID and date range.
 */

const BigTimeTool = require('../BigTimeForecastTool');

async function filteredForecastQuery() {
  console.log('=== Filtered Forecast Query Example ===\n');
  
  // Replace with your actual credentials
  const CLIENT_ID = process.env.BIGTIME_CLIENT_ID || 'your_client_id_here';
  const CLIENT_SECRET = process.env.BIGTIME_CLIENT_SECRET || 'your_client_secret_here';
  
  try {
    console.log('Fetching forecasts with filters...');
    
    // Define custom filters
    const filters = {
      project_id: "123",
      start_date: "2024-01-01",
      end_date: "2024-12-31"
    };
    
    console.log('Filters:', JSON.stringify(filters, null, 2));
    
    // Call the tool with filters
    const result = await BigTimeTool.execute(
      CLIENT_ID,
      CLIENT_SECRET,
      'read',
      null,                        // forecast_id
      25,                          // page_size (smaller for filtered results)
      JSON.stringify(filters)      // filters as JSON string
    );
    
    // Parse and display results
    const parsedResult = JSON.parse(result);
    
    if (parsedResult.success) {
      console.log('✓ Success!');
      console.log(`Retrieved ${parsedResult.data.results?.length || 0} filtered forecasts`);
      console.log('\nFiltered data:');
      console.log(JSON.stringify(parsedResult.data, null, 2));
    } else {
      console.error('✗ Error:', parsedResult.error);
    }
    
  } catch (error) {
    console.error('✗ Unexpected error:', error.message);
  }
}

// Run if executed directly
if (require.main === module) {
  filteredForecastQuery()
    .then(() => console.log('\nExample completed.'))
    .catch(err => console.error('Example failed:', err));
}

module.exports = filteredForecastQuery;
