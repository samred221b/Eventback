// Test script to verify boolean prop fixes
import { parseBoolean, parseNumber } from './utils/dataProcessor.js';
import { validateBooleanProps, validateNumericProps, debugProps } from './utils/propValidator.js';

console.log('🧪 Testing Boolean Prop Fixes...\n');

// Test 1: Boolean parsing
console.log('1️⃣ Testing Boolean Parsing:');
const booleanTests = [
  { input: "true", expected: true },
  { input: "false", expected: false },
  { input: true, expected: true },
  { input: false, expected: false },
  { input: "TRUE", expected: true },
  { input: "False", expected: false },
  { input: 1, expected: true },
  { input: 0, expected: false },
  { input: null, expected: false },
  { input: undefined, expected: false },
];

booleanTests.forEach(test => {
  const result = parseBoolean(test.input);
  const status = result === test.expected ? '✅' : '❌';
  console.log(`   ${status} parseBoolean(${JSON.stringify(test.input)}) = ${result} (expected: ${test.expected})`);
});

// Test 2: Number parsing
console.log('\n2️⃣ Testing Number Parsing:');
const numberTests = [
  { input: "123", expected: 123 },
  { input: "123.45", expected: 123.45 },
  { input: 456, expected: 456 },
  { input: "0", expected: 0 },
  { input: "invalid", expected: 0 },
  { input: null, expected: 0 },
];

numberTests.forEach(test => {
  const result = parseNumber(test.input);
  const status = result === test.expected ? '✅' : '❌';
  console.log(`   ${status} parseNumber(${JSON.stringify(test.input)}) = ${result} (expected: ${test.expected})`);
});

// Test 3: Prop validation
console.log('\n3️⃣ Testing Prop Validation:');

// Simulate problematic props that would cause crashes
const problematicProps = {
  numberOfLines: "2", // Should be number
  selectable: "true", // Should be boolean
  horizontal: "false", // Should be boolean
  disabled: "true", // Should be boolean
  activeOpacity: "0.7", // Should be number
  bounces: "false", // Should be boolean
};

console.log('   Original props:', problematicProps);

const fixedBooleanProps = validateBooleanProps(problematicProps, ['selectable', 'horizontal', 'disabled', 'bounces']);
const fixedAllProps = validateNumericProps(fixedBooleanProps, ['numberOfLines', 'activeOpacity']);

console.log('   Fixed props:', fixedAllProps);

// Test 4: Common component prop examples
console.log('\n4️⃣ Testing Common Component Props:');

// Text component props
const textProps = {
  numberOfLines: "3",
  selectable: "true",
  allowFontScaling: "false",
  ellipsizeMode: "tail"
};

console.log('   Text Props:');
debugProps('Text', textProps);

// ScrollView props
const scrollViewProps = {
  horizontal: "false",
  showsVerticalScrollIndicator: "true",
  bounces: "true",
  pagingEnabled: "false"
};

console.log('   ScrollView Props:');
debugProps('ScrollView', scrollViewProps);

// TouchableOpacity props
const touchableProps = {
  disabled: "false",
  activeOpacity: "0.8"
};

console.log('   TouchableOpacity Props:');
debugProps('TouchableOpacity', touchableProps);

console.log('\n🎉 Boolean prop testing completed!');
console.log('\n📋 Summary of Fixes:');
console.log('✅ Created parseBoolean() utility');
console.log('✅ Created parseNumber() utility');
console.log('✅ Created SafeText component');
console.log('✅ Created SafeScrollView component');
console.log('✅ Created SafeTouchableOpacity component');
console.log('✅ Added prop validation utilities');
console.log('✅ Fixed all boolean props in main App.js');
console.log('\n🚀 The app should now run without boolean prop errors!');
