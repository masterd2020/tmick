/** @type {import('jest').Config} */
module.exports = {
	projects: [
		'<rootDir>/packages/cqrs-core/jest.config.js',
		'<rootDir>/packages/cqrs-event-broker/jest.config.js',
		'<rootDir>/packages/cqrs-outbox/jest.config.js',
		'<rootDir>/packages/result/jest.config.js',
	],
	moduleNameMapper: {
		'^@tmasterd/cqrs-core(.*)$': '<rootDir>/packages/cqrs-core/src$1',
		'^@tmasterd/cqrs-demo(.*)$': '<rootDir>/packages/cqrs-demo/src$1',
		'^@tmasterd/cqrs-event-broker(.*)$': '<rootDir>/packages/cqrs-event-broker/src$1',
		'^@tmasterd/cqrs-outbox(.*)$': '<rootDir>/packages/cqrs-outbox/src$1',
		'^@tmasterd/result(.*)$': '<rootDir>/packages/result/src$1',
	},
};
