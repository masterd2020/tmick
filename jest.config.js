/** @type {import('jest').Config} */
module.exports = {
	// Use ts-jest as the transformer for TypeScript files
	preset: 'ts-jest',

	// Set the test environment
	testEnvironment: 'node',

	// Process TypeScript files with ts-jest
	transform: {
		'^.+\\.tsx?$': [
			'ts-jest',
			{
				useESM: true,
			},
		],
	},

	// Tell Jest which extensions to look for
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

	// For ESM support
	extensionsToTreatAsEsm: ['.ts', '.tsx'],

	// Add any custom transformers or ignore patterns if needed
	transformIgnorePatterns: ['node_modules/(?!(some-module-that-needs-transforming)/)'],

	// Set up module name mapper for path aliases if you're using them
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
	},
};
