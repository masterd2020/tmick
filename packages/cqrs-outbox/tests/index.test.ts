import { CQRSOutboxPatternGreet } from '../src/index';

describe('CQRS Outbox Package', () => {
	describe('greet', () => {
		it('should return a greeting with the provided name', () => {
			expect(CQRSOutboxPatternGreet('World')).toBe('Hello, World! from Outbox Pattern');
			expect(CQRSOutboxPatternGreet('User')).toBe('Hello, User! from Outbox Pattern');
		});
	});
});
