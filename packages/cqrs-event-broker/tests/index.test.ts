import { CQRSEventBrokerGreet } from '../src/index';

describe('Core package', () => {
	describe('greet', () => {
		it('should return a greeting with the provided name', () => {
			expect(CQRSEventBrokerGreet('World')).toBe('Hello, World! from CQRS Event Broker');
			expect(CQRSEventBrokerGreet('User')).toBe('Hello, User! from CQRS Event Broker');
		});
	});
});
