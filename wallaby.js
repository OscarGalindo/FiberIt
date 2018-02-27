module.exports = wallaby => ({
  files: [
    'src/**/*.ts',
  ],
  tests: [
    'test/**/*.spec.ts',
  ],
  debug: true,
  compilers: {
    '**/*.ts': wallaby.compilers.typeScript({
      module: 1,
      target: 1,
    })
  },
  testFramework: 'mocha',
  env: {type: 'node'},
  workers: {initial: 1, regular: 1},
  setup: () => {
    // const chai = require('chai');
    // chai.config.truncateThreshold = 0;
    // require('./test/config/config');
  }
});
