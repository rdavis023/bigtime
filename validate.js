/**
 * Validation Script for BigTime Forecast Tool
 * 
 * This script validates the tool structure and configuration
 * without making actual API calls.
 */

const BigTimeTool = require('./BigTimeForecastTool');

console.log('=== BigTime Forecast Tool Validation ===\n');

let validationPassed = true;

// Test 1: Check if module exports exist
console.log('Test 1: Checking module exports...');
if (!BigTimeTool.config) {
  console.error('✗ FAIL: config export not found');
  validationPassed = false;
} else {
  console.log('✓ PASS: config export exists');
}

if (!BigTimeTool.execute) {
  console.error('✗ FAIL: execute export not found');
  validationPassed = false;
} else {
  console.log('✓ PASS: execute export exists');
}

// Test 2: Validate config structure
console.log('\nTest 2: Validating config structure...');
const config = BigTimeTool.config;

if (!config.name) {
  console.error('✗ FAIL: Tool name not defined');
  validationPassed = false;
} else {
  console.log(`✓ PASS: Tool name: "${config.name}"`);
}

if (!config.description) {
  console.error('✗ FAIL: Tool description not defined');
  validationPassed = false;
} else {
  console.log(`✓ PASS: Tool description: "${config.description.substring(0, 50)}..."`);
}

if (!config.schema) {
  console.error('✗ FAIL: Tool schema not defined');
  validationPassed = false;
} else {
  console.log('✓ PASS: Tool schema exists');
}

// Test 3: Validate schema properties
console.log('\nTest 3: Validating schema properties...');
const schema = config.schema;

const requiredProps = ['client_id', 'client_secret'];
requiredProps.forEach(prop => {
  if (!schema.properties || !schema.properties[prop]) {
    console.error(`✗ FAIL: Required property "${prop}" not in schema`);
    validationPassed = false;
  } else {
    console.log(`✓ PASS: Property "${prop}" exists in schema`);
  }
});

// Test 4: Validate required fields
console.log('\nTest 4: Validating required fields...');
if (!schema.required || !Array.isArray(schema.required)) {
  console.error('✗ FAIL: Required fields not properly defined');
  validationPassed = false;
} else {
  console.log(`✓ PASS: Required fields: ${schema.required.join(', ')}`);
  
  requiredProps.forEach(prop => {
    if (!schema.required.includes(prop)) {
      console.error(`✗ FAIL: "${prop}" should be in required array`);
      validationPassed = false;
    }
  });
}

// Test 5: Check execute function
console.log('\nTest 5: Checking execute function...');
if (typeof BigTimeTool.execute !== 'function') {
  console.error('✗ FAIL: execute is not a function');
  validationPassed = false;
} else {
  console.log('✓ PASS: execute is a function');
  console.log(`   Function expects ${BigTimeTool.execute.length} parameters`);
}

// Test 6: Test error handling (without actual API call)
console.log('\nTest 6: Testing error handling...');
(async () => {
  try {
    // Call with invalid credentials to test error handling
    const result = await BigTimeTool.execute(
      'invalid_client_id',
      'invalid_client_secret',
      'read',
      null,
      50,
      null
    );
    
    const parsed = JSON.parse(result);
    
    if (parsed.success === false && parsed.error) {
      console.log('✓ PASS: Error handling works correctly');
      console.log(`   Error message: "${parsed.error.substring(0, 50)}..."`);
    } else {
      console.error('✗ FAIL: Error handling did not return expected format');
      validationPassed = false;
    }
  } catch (error) {
    console.log('✓ PASS: Function throws errors appropriately');
    console.log(`   Error: "${error.message.substring(0, 50)}..."`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  if (validationPassed) {
    console.log('✓ ALL VALIDATION TESTS PASSED');
    console.log('\nThe tool structure is correct and ready for use.');
    console.log('To test with real API calls, set environment variables:');
    console.log('  export BIGTIME_CLIENT_ID="your_client_id"');
    console.log('  export BIGTIME_CLIENT_SECRET="your_client_secret"');
    console.log('\nThen run: node examples/example1-basic-retrieval.js');
  } else {
    console.log('✗ SOME VALIDATION TESTS FAILED');
    console.log('\nPlease review the errors above and fix the issues.');
    process.exit(1);
  }
})();
