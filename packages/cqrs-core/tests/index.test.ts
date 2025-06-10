import { CQRSCoreGreet } from '../src/index';

describe('CQRS Core Package', () => {
	describe('greet', () => {
		it('should return a greeting with the provided name', () => {
			expect(CQRSCoreGreet('World')).toBe('Hello, World! from CQRS Core');
			expect(CQRSCoreGreet('User')).toBe('Hello, User! from CQRS Core');
		});
	});
});
