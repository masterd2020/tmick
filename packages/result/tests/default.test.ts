import { createDefaultResultHandler } from '../src/default';

describe('DefaultResultHandler', () => {
	const handler = createDefaultResultHandler();

	const successResult = handler.success<{ name: string }>('Item retrieved', { name: 'Widget' });
	const failureResult = handler.failure<{ reason: string }>('Item not found', { reason: '404_NOT_FOUND' });

	it('should create a default success result', () => {
		expect(successResult.kind).toBe('success');
		expect(successResult.status).toBe(true);
		expect(successResult.message).toBe('Item retrieved');
		expect(successResult.data).toEqual({ name: 'Widget' });
	});

	it('should create a default failure result', () => {
		expect(failureResult.kind).toBe('failure');
		expect(failureResult.status).toBe(false);
		expect(failureResult.message).toBe('Item not found');
		expect(failureResult.errorDetails).toEqual({ reason: '404_NOT_FOUND' });
	});

	it('should correctly use type guards', () => {
		expect(handler.isSuccess(successResult)).toBe(true);
		expect(handler.isFailure(successResult)).toBe(false);
		expect(handler.isSuccess(failureResult)).toBe(false);
		expect(handler.isFailure(failureResult)).toBe(true);
	});
});
