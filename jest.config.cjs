module.exports = {
  preset: 'jest-expo',
  watchman: false,
  testMatch: ['<rootDir>/src/**/*.test.[jt]s?(x)'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}', '!src/**/*.d.ts'],
  coverageThreshold: {
    global: { statements: 80, branches: 80, functions: 80, lines: 80 },
  },
};
