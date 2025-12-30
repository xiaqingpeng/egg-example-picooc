'use strict';

const { Application } = require('egg');

const app = new Application({
  baseDir: __dirname,
  type: 'application',
  framework: require('egg').framework
});

(async () => {
  try {
    await app.ready();
    const ctx = app.createAnonymousContext();
    
    console.log('Testing getActivityStats...');
    const result = await ctx.service.analytics.getActivityStats('2025-12-30', '2025-12-30');
    console.log('Result:', JSON.stringify(result, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();
