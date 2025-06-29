import { FailureOnlyConfig, FailureOnlyHandler, Result, ResultConfig, ResultHandler, SuccessOnlyConfig, SuccessOnlyHandler } from './core';

export interface DefaultSuccess<D> {
	kind: 'success';
	status: true;
	message: string;
	data: D;
}

export interface DefaultFailure<E> {
	kind: 'failure';
	status: false;
	message: string;
	errorDetails: E;
}

export type DefaultResult<D, E> = Result<DefaultSuccess<D>, DefaultFailure<E>>;

// Factory for default Result handler
export function createDefaultResultHandler(): ResultHandler<DefaultSuccess<unknown>, DefaultFailure<unknown>> {
	const config: ResultConfig<DefaultSuccess<unknown>, DefaultFailure<unknown>> = {
		createSuccess: <Data>(message: string, data: Data): DefaultSuccess<Data> => ({
			kind: 'success',
			status: true,
			message,
			data,
		}),
		createFailure: <Error>(message: string, errorDetails: Error): DefaultFailure<Error> => ({
			kind: 'failure',
			status: false,
			message,
			errorDetails,
		}),
		isSuccess: (result: DefaultSuccess<unknown> | DefaultFailure<unknown>): result is DefaultSuccess<unknown> => result.kind === 'success',
		isFailure: (result: DefaultSuccess<unknown> | DefaultFailure<unknown>): result is DefaultFailure<unknown> => result.kind === 'failure',
	};
	return new ResultHandler(config);
}

// Factory for success-only handler
export function createSuccessOnlyHandler(): SuccessOnlyHandler<DefaultSuccess<unknown>> {
	const config: SuccessOnlyConfig<DefaultSuccess<unknown>> = {
		createSuccess: <Data>(message: string, data: Data): DefaultSuccess<Data> => ({
			kind: 'success',
			status: true,
			message,
			data,
		}),
		isSuccess: (result: DefaultSuccess<unknown>): result is DefaultSuccess<unknown> => result.kind === 'success',
	};

	return new SuccessOnlyHandler(config);
}

// Factory for failure-only handler
export function createFailureOnlyHandler(): FailureOnlyHandler<DefaultFailure<unknown>> {
	const config: FailureOnlyConfig<DefaultFailure<unknown>> = {
		createFailure: <Error>(message: string, errorDetails: Error): DefaultFailure<Error> => ({
			kind: 'failure',
			status: false,
			message,
			errorDetails,
		}),
		isFailure: (result: DefaultFailure<unknown>): result is DefaultFailure<unknown> => result.kind === 'failure',
	};

	return new FailureOnlyHandler(config);
}
// export function createFailureOnlyHandler<TFailure extends { message: string }>(config: FailureOnlyConfig<TFailure>): FailureOnlyHandler<TFailure> {
// 	return new FailureOnlyHandler(config);
// }

// Pre-instantiated default handler for immediate use
export const DefaultResult = createDefaultResultHandler();
export const DefaultSuccessOnly = createSuccessOnlyHandler();
export const DefaultFailureOnly = createFailureOnlyHandler();
