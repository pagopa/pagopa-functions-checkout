module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["dist", "/node_modules"],
  reporters: [
    'default',
    [ 'jest-junit', {
      outputDirectory: './test_reports',
      outputName: 'pagopa-functions-checkout-IT.xml',
    } ]
  ],
  testMatch: [
    "**/__integrations__/*.ts"
  ]
};
