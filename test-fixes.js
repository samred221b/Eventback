// Test script to verify all the fixes are working
import { processEventsData, validateCoordinates, formatPrice, formatDate } from './utils/dataProcessor.js';
import rawEventsData from './assets/mock/events.json';

console.log('🧪 Testing Eventopia Fixes...\n');

// Test 1: Coordinate parsing
console.log('1️⃣ Testing Coordinate Parsing:');
const processedEvents = processEventsData(rawEventsData);
processedEvents.forEach(event => {
  const coords = event.location.coordinates;
  console.log(`   Event: ${event.title}`);
  console.log(`   Raw coordinates: ${rawEventsData.find(e => e.id === event.id).location.coordinates}`);
  console.log(`   Parsed coordinates: [${coords[0]}, ${coords[1]}] (${typeof coords[0]}, ${typeof coords[1]})`);
  console.log(`   Valid: ${validateCoordinates(coords) ? '✅' : '❌'}`);
  console.log('');
});

// Test 2: Price formatting
console.log('2️⃣ Testing Price Formatting:');
processedEvents.forEach(event => {
  console.log(`   ${event.title}: ${formatPrice(event.price, event.currency)}`);
});
console.log('');

// Test 3: Date formatting
console.log('3️⃣ Testing Date Formatting:');
processedEvents.forEach(event => {
  console.log(`   ${event.title}: ${formatDate(event.date)}`);
});
console.log('');

// Test 4: Type validation
console.log('4️⃣ Testing Type Validation:');
processedEvents.forEach(event => {
  const coords = event.location.coordinates;
  const lat = coords[0];
  const lng = coords[1];
  
  console.log(`   ${event.title}:`);
  console.log(`     Latitude: ${lat} (${typeof lat}) ${typeof lat === 'number' ? '✅' : '❌'}`);
  console.log(`     Longitude: ${lng} (${typeof lng}) ${typeof lng === 'number' ? '✅' : '❌'}`);
  console.log(`     Price: ${event.price} (${typeof event.price}) ${typeof event.price === 'number' ? '✅' : '❌'}`);
});

console.log('\n🎉 All tests completed!');
