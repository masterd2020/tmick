import { Result, ResultConfig, ResultHandler } from './core';

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

// Pre-instantiated default handler for immediate use
export const DefaultResult = createDefaultResultHandler();
