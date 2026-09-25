const { askAI } = require('./aiService');

async function testConnection() {
  console.log('Testing OpenRouter AI connection...');
  const result = await askAI("Say 'AI connection successful!' in a fun way");
  console.log('\n--- AI Response ---');
  console.log(result);
  console.log('-------------------\n');
}

testConnection();
