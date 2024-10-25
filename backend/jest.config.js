module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  testMatch: ['<rootDir>/src/tests/**/*.test.js'],
  moduleDirectories: ['node_modules', 'src'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Add these lines to handle module aliases if you're using them
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
