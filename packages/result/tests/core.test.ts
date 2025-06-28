import { ResultConfig, createCustomResultHandler } from '../src/core';

describe('ResultHandler (Core) - Custom Implementation', () => {
	// Define custom success and failure structures for testing
	type CustomSuccess<D> = {
		_tag: 'OK';
		message: string;
		payload: D;
	};
	type CustomFailure<E> = {
		_tag: 'ERR';
		message: string;
		reason: E;
	};

	const customConfig: ResultConfig<CustomSuccess<unknown>, CustomFailure<unknown>> = {
		createSuccess: (message, data) => ({ _tag: 'OK', payload: data, message }),
		createFailure: (message, errorDetails) => ({ _tag: 'ERR', reason: errorDetails, message }),
		isSuccess: (result): result is CustomSuccess<unknown> => result._tag === 'OK',
		isFailure: (result): result is CustomFailure<unknown> => result._tag === 'ERR',
	};

	const handler = createCustomResultHandler(customConfig);

	const successResult = handler.success<{ id: number }>('Success!', { id: 1 });
	const failureResult = handler.failure<{ code: string }>('Failure!', { code: 'E101' });

	it('should create a success result with custom structure', () => {
		expect(handler.isSuccess(successResult)).toBe(true);
		expect(successResult).toEqual({ _tag: 'OK', payload: { id: 1 }, message: 'Success!' });
	});

	it('should create a failure result with custom structure', () => {
		expect(handler.isFailure(failureResult)).toBe(true);
		expect(failureResult).toEqual({ _tag: 'ERR', reason: { code: 'E101' }, message: 'Failure!' });
	});

	it('should correctly identify success and failure using type guards', () => {
		expect(handler.isSuccess(successResult)).toBe(true);
		expect(handler.isFailure(successResult)).toBe(false);
		expect(handler.isSuccess(failureResult)).toBe(false);
		expect(handler.isFailure(failureResult)).toBe(true);
	});
});
