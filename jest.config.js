/** @type {import('jest').Config} */
module.exports = {
  testMatch: ["**/tests/**/*.test.js"], 
  testPathIgnorePatterns: ["/tests/e2e/", "/node_modules/"],
};
