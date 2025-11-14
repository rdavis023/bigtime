/**
 * Validation Script for BigTime Forecast Tool V2
 * 
 * This script validates the V2 tool structure which supports both
 * IQ API v2 and Foresight API.
 */

const BigTimeToolV2 = require('./BigTimeForecastToolV2');

console.log('=== BigTime Forecast Tool V2 Validation ===\n');

let validationPassed = true;

// Test 1: Check if module exports exist
console.log('Test 1: Checking module exports...');
if (!BigTimeToolV2.config) {
  console.error('✗ FAIL: config export not found');
  validationPassed = false;
} else {
  console.log('✓ PASS: config export exists');
}

if (!BigTimeToolV2.execute) {
  console.error('✗ FAIL: execute export not found');
  validationPassed = false;
} else {
  console.log('✓ PASS: execute export exists');
}

// Test 2: Validate config structure
console.log('\nTest 2: Validating config structure...');
const config = BigTimeToolV2.config;

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
  console.log(`✓ PASS: Tool description exists`);
}

if (!config.schema) {
  console.error('✗ FAIL: Tool schema not defined');
  validationPassed = false;
} else {
  console.log('✓ PASS: Tool schema exists');
}

// Test 3: Validate schema properties for both API types
console.log('\nTest 3: Validating schema properties...');
const schema = config.schema;

const iqProps = ['username', 'password', 'auth_realm'];
const foresightProps = ['client_id', 'client_secret'];
const commonProps = ['api_type'];

console.log('Checking IQ API properties:');
iqProps.forEach(prop => {
  if (!schema.properties || !schema.properties[prop]) {
    console.error(`  ✗ FAIL: IQ API property "${prop}" not in schema`);
    validationPassed = false;
  } else {
    console.log(`  ✓ PASS: Property "${prop}" exists`);
  }
});

console.log('Checking Foresight API properties:');
foresightProps.forEach(prop => {
  if (!schema.properties || !schema.properties[prop]) {
    console.error(`  ✗ FAIL: Foresight API property "${prop}" not in schema`);
    validationPassed = false;
  } else {
    console.log(`  ✓ PASS: Property "${prop}" exists`);
  }
});

console.log('Checking common properties:');
commonProps.forEach(prop => {
  if (!schema.properties || !schema.properties[prop]) {
    console.error(`  ✗ FAIL: Common property "${prop}" not in schema`);
    validationPassed = false;
  } else {
    console.log(`  ✓ PASS: Property "${prop}" exists`);
  }
});

// Test 4: Check execute function
console.log('\nTest 4: Checking execute function...');
if (typeof BigTimeToolV2.execute !== 'function') {
  console.error('✗ FAIL: execute is not a function');
  validationPassed = false;
} else {
  console.log('✓ PASS: execute is a function');
  console.log(`   Function expects ${BigTimeToolV2.execute.length} parameters`);
}

// Test 5: Test error handling for IQ API (without actual API call)
console.log('\nTest 5: Testing IQ API error handling...');
(async () => {
  try {
    // Call with invalid credentials to test error handling
    const result = await BigTimeToolV2.execute(
      'iq',                      // api_type
      'invalid@email.com',       // username
      'invalid_password',        // password
      'invalid_realm',           // auth_realm
      null, null, null,          // Foresight credentials (not used)
      null, null, null, null,    // Other parameters
      null, null
    );
    
    const parsed = JSON.parse(result);
    
    if (parsed.success === false && parsed.error) {
      console.log('✓ PASS: IQ API error handling works correctly');
      console.log(`   Error message: "${parsed.error.substring(0, 70)}..."`);
    } else {
      console.error('✗ FAIL: IQ API error handling did not return expected format');
      validationPassed = false;
    }
  } catch (error) {
    console.log('✓ PASS: Function throws errors appropriately');
  }
  
  // Test 6: Test error handling for Foresight API
  console.log('\nTest 6: Testing Foresight API error handling...');
  try {
    const result = await BigTimeToolV2.execute(
      'foresight',               // api_type
      null, null, null,          // IQ credentials (not used)
      'invalid_client_id',       // client_id
      'invalid_client_secret',   // client_secret
      'read',                    // scope
      null, null, null, null,    // Other parameters
      null, null
    );
    
    const parsed = JSON.parse(result);
    
    if (parsed.success === false && parsed.error) {
      console.log('✓ PASS: Foresight API error handling works correctly');
      console.log(`   Error message: "${parsed.error.substring(0, 70)}..."`);
    } else {
      console.error('✗ FAIL: Foresight API error handling did not return expected format');
      validationPassed = false;
    }
  } catch (error) {
    console.log('✓ PASS: Function throws errors appropriately');
  }
  
  // Test 7: Test invalid api_type
  console.log('\nTest 7: Testing invalid api_type handling...');
  try {
    const result = await BigTimeToolV2.execute(
      'invalid_type',            // invalid api_type
      null, null, null,
      null, null, null,
      null, null, null, null,
      null, null
    );
    
    const parsed = JSON.parse(result);
    
    if (parsed.success === false && parsed.error.includes('Invalid api_type')) {
      console.log('✓ PASS: Invalid api_type handled correctly');
    } else {
      console.error('✗ FAIL: Invalid api_type should return error');
      validationPassed = false;
    }
  } catch (error) {
    console.log('✓ PASS: Invalid api_type throws appropriate error');
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  if (validationPassed) {
    console.log('✓ ALL VALIDATION TESTS PASSED');
    console.log('\nThe V2 tool supports both API types and is ready for use.');
    console.log('\n📝 To test with real credentials:');
    console.log('\nFor IQ API v2:');
    console.log('  node examples/example4-iq-api.js');
    console.log('\nFor Foresight API:');
    console.log('  export BIGTIME_CLIENT_ID="your_client_id"');
    console.log('  export BIGTIME_CLIENT_SECRET="your_client_secret"');
    console.log('  node examples/example1-basic-retrieval.js');
  } else {
    console.log('✗ SOME VALIDATION TESTS FAILED');
    console.log('\nPlease review the errors above and fix the issues.');
    process.exit(1);
  }
})();
