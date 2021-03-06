module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["dist", "/node_modules"],
  reporters: [
    'default',
    [ 'jest-junit', {
      outputDirectory: './test_reports',
      outputName: 'pagopa-functions-checkout-TEST.xml',
    } ]
  ],
  coverageReporters: ["cobertura"],
  testMatch: [
    "**/__tests__/*.ts"
  ]
};
