/** @type {import('jest').Config} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',

	// IMPORTANT: rootDir must be relative to the config file itself.
	// Here, it means the root of the '@tmasterd/cqrs-core' package.
	rootDir: './',

	transform: {
		'^.+\\.(ts|tsx)$': [
			'ts-jest',
			{
				tsconfig: '<rootDir>/tsconfig.test.json',
				useESM: false,
			},
		],
	},

	testMatch: ['<rootDir>/tests/**/*.spec.ts', '<rootDir>/tests/**/*.test.ts'],
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
	moduleNameMapper: {
		'^@tmasterd/cqrs-core(.*)$': '<rootDir>/src$1',
		// If this package needs to import other monorepo packages by alias,
		// you'd typically also map them here, relative to this package's rootDir.
		// Example if cqrs-core imports cqrs-demo:
		// '^@tmasterd/cqrs-demo(.*)$': '<rootDir>/../cqrs-demo/src$1',
	},
};
