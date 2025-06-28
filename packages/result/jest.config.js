/** @type {import('jest').Config} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
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
};
