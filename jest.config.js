module.exports = {
  preset: 'ts-jest',
  globals: {
    __DEV__: true,
    __BROWSER__: false,
    __JSDOM__: true
  },
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'lcov', 'text'],
  collectCoverageFrom: ['/src/*.ts', '/src/**/*.ts'],
  watchPathIgnorePatterns: ['/node_modules/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  moduleNameMapper: {
    hookux: '<rootDir>/src'
  },
  rootDir: __dirname,
  testMatch: ['<rootDir>/src/**/__tests__/**/*spec.[jt]s?(x)']
};
