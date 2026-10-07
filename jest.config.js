export default {
  testEnvironment: "node",
  transform: {},
  setupFiles: ["<rootDir>/tests/setup/env.js"],
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  testTimeout: 90000000,
  verbose: true,
};