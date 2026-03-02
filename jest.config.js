require('dotenv').config({ path: '.env.development' });

module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  testTimeout: 30000,
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
  transformIgnorePatterns: ['/node_modules/(?!(uuid)/)'],
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};
