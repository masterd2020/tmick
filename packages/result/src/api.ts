import { Result, ResultConfig, ResultHandler } from './core';

export interface ApiSuccess<D> {
	kind: 'success';
	status: true;
	message: string;
	data: D;
	code: number;
	timestamp: Date;
}

export interface ApiFailure<E> {
	kind: 'failure';
	status: false;
	message: string;
	errorDetails: E;
	code: number;
	timestamp: Date;
}

export type ApiResult<D, E> = Result<ApiSuccess<D>, ApiFailure<E>>;

// Extended API Result handler with HTTP status code methods
export class ApiResultHandler<D, E> extends ResultHandler<ApiSuccess<D>, ApiFailure<E>> {
	constructor(config: ResultConfig<ApiSuccess<D>, ApiFailure<E>>) {
		super(config);
	}

	// HTTP 2xx Success responses
	ok<Data>(message: string, data: Data): ApiSuccess<Data> {
		return { kind: 'success', status: true, message, data, code: 200, timestamp: new Date() };
	}

	created<Data>(message: string, data: Data): ApiSuccess<Data> {
		return { kind: 'success', status: true, message, data, code: 201, timestamp: new Date() };
	}

	accepted<Data>(message: string, data: Data): ApiSuccess<Data> {
		return { kind: 'success', status: true, message, data, code: 202, timestamp: new Date() };
	}

	noContent<Data = null>(message: string, data: Data = null as Data): ApiSuccess<Data> {
		return { kind: 'success', status: true, message, data, code: 204, timestamp: new Date() };
	}

	// HTTP 4xx Client Error responses
	badRequest<Error>(message: string, errorDetails: Error): ApiFailure<Error> {
		return { kind: 'failure', status: false, message, errorDetails, code: 400, timestamp: new Date() };
	}

	unauthorized<Error>(message: string, errorDetails: Error): ApiFailure<Error> {
		return { kind: 'failure', status: false, message, errorDetails, code: 401, timestamp: new Date() };
	}

	forbidden<Error>(message: string, errorDetails: Error): ApiFailure<Error> {
		return { kind: 'failure', status: false, message, errorDetails, code: 403, timestamp: new Date() };
	}

	notFound<Error>(message: string, errorDetails: Error): ApiFailure<Error> {
		return { kind: 'failure', status: false, message, errorDetails, code: 404, timestamp: new Date() };
	}

	conflict<Error>(message: string, errorDetails: Error): ApiFailure<Error> {
		return { kind: 'failure', status: false, message, errorDetails, code: 409, timestamp: new Date() };
	}

	unprocessableEntity<Error>(message: string, errorDetails: Error): ApiFailure<Error> {
		return { kind: 'failure', status: false, message, errorDetails, code: 422, timestamp: new Date() };
	}

	tooManyRequests<Error>(message: string, errorDetails: Error): ApiFailure<Error> {
		return { kind: 'failure', status: false, message, errorDetails, code: 429, timestamp: new Date() };
	}

	// HTTP 5xx Server Error responses
	internalServerError<Error>(message: string, errorDetails: Error): ApiFailure<Error> {
		return { kind: 'failure', status: false, message, errorDetails, code: 500, timestamp: new Date() };
	}

	notImplemented<Error>(message: string, errorDetails: Error): ApiFailure<Error> {
		return { kind: 'failure', status: false, message, errorDetails, code: 501, timestamp: new Date() };
	}

	badGateway<Error>(message: string, errorDetails: Error): ApiFailure<Error> {
		return { kind: 'failure', status: false, message, errorDetails, code: 502, timestamp: new Date() };
	}

	serviceUnavailable<Error>(message: string, errorDetails: Error): ApiFailure<Error> {
		return { kind: 'failure', status: false, message, errorDetails, code: 503, timestamp: new Date() };
	}

	gatewayTimeout<Error>(message: string, errorDetails: Error): ApiFailure<Error> {
		return { kind: 'failure', status: false, message, errorDetails, code: 504, timestamp: new Date() };
	}
}

// Factory for API Result handler
export function createApiResultHandler<D, E>(): ApiResultHandler<D, E> {
	const config: ResultConfig<ApiSuccess<unknown>, ApiFailure<unknown>> = {
		createSuccess: <Data>(message: string, data: Data): ApiSuccess<Data> => ({
			kind: 'success',
			status: true,
			message,
			data,
			code: 200,
			timestamp: new Date(),
		}),
		createFailure: <Error>(message: string, errorDetails: Error): ApiFailure<Error> => ({
			kind: 'failure',
			status: false,
			message,
			errorDetails,
			code: 500,
			timestamp: new Date(),
		}),
		isSuccess: (result): result is ApiSuccess<unknown> => (result as ApiSuccess<unknown>).kind === 'success',
		isFailure: (result): result is ApiFailure<unknown> => (result as ApiFailure<unknown>).kind === 'failure',
	};

	return new ApiResultHandler<D, E>(config as unknown as ResultConfig<ApiSuccess<D>, ApiFailure<E>>);
}

// Pre-instantiated API handler for immediate use
export const ApiResult = createApiResultHandler<unknown, unknown>();
