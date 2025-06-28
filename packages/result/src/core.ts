// Generic Result type that accepts any success and failure structures
export type Result<TSuccess, TFailure> = TSuccess | TFailure;

// Type guard helpers - these need to be provided by the user for their custom structures
export interface ResultConfig<TSuccess, TFailure> {
	createSuccess: <D>(message: string, data: D) => TSuccess;
	createFailure: <E>(message: string, errorDetails: E) => TFailure;
	isSuccess: (result: TSuccess | TFailure) => result is TSuccess;
	isFailure: (result: TSuccess | TFailure) => result is TFailure;
}

// Main Result handler class that works with any structure
// export class ResultHandler<TSuccess extends { message: string }, TFailure extends { message: string }> {
export class ResultHandler<TSuccess, TFailure> {
	constructor(private config: ResultConfig<TSuccess, TFailure>) {}

	// Method-level generic TD (Task Data) that defaults to unknown for flexibility
	success<TD = unknown>(message: string, data: TD): TSuccess & { data: TD } {
		return this.config.createSuccess(message, data) as TSuccess & { data: TD };
	}

	// Method-level generic TE (Task Error) that defaults to unknown for flexibility
	failure<TE = unknown>(message: string, errorDetails: TE): TFailure & { errorDetails: TE } {
		return this.config.createFailure(message, errorDetails) as TFailure & { errorDetails: TE };
	}

	// Type guards
	isSuccess(result: Result<TSuccess, TFailure>): result is TSuccess {
		return this.config.isSuccess(result);
	}

	isFailure(result: Result<TSuccess, TFailure>): result is TFailure {
		return this.config.isFailure(result);
	}

	// // Map over success data
	// map<D, U>(result: Result<TSuccess & { data: D }, TFailure>, fn: (data: D) => U, successMessage?: string): Result<TSuccess & { data: U }, TFailure> {
	// 	if (this.isSuccess(result)) {
	// 		const mappedData = fn(result.data);
	// 		const original = result as TSuccess & { data: D } & { message: string };
	// 		return {
	// 			...original,
	// 			data: mappedData,
	// 			message: successMessage || original.message,
	// 		} as TSuccess & { data: U };
	// 	}

	// 	return result;
	// }

	// // Chain operations that return Results
	// flatMap<D, NewSuccess, NewFailure>(result: Result<TSuccess & { data: D }, TFailure>, fn: (data: D) => Result<NewSuccess, NewFailure>): Result<NewSuccess, TFailure | NewFailure> {
	// 	if (this.isSuccess(result)) {
	// 		return fn(result.data);
	// 	}

	// 	return result as TFailure;
	// }

	// // Map over error details
	// mapError<E, U>(result: Result<TSuccess, TFailure & { errorDetails: E }>, fn: (errorDetails: E) => U, errorMessage?: string): Result<TSuccess, TFailure & { errorDetails: U }> {
	// 	if (this.isFailure(result)) {
	// 		const failureResult = result as TFailure & { errorDetails: E } & { message: string };
	// 		const mappedError = fn(failureResult.errorDetails);
	// 		return {
	// 			...failureResult,
	// 			errorDetails: mappedError,
	// 			message: errorMessage || failureResult.message,
	// 		} as TFailure & { errorDetails: U };
	// 	}

	// 	return result;
	// }

	// // Unwrap data or throw
	// unwrap<D>(result: Result<TSuccess & { data: D }, TFailure>): D {
	// 	if (this.isSuccess(result)) {
	// 		return result.data;
	// 	}

	// 	const failureResult = result as TFailure & { errorDetails: unknown };
	// 	throw new Error(`${failureResult.message}: ${JSON.stringify(failureResult.errorDetails)}`);
	// }

	// // Unwrap data or return default
	// unwrapOr<D>(result: Result<TSuccess & { data: D }, TFailure>, defaultValue: D): D {
	// 	return this.isSuccess(result) ? result.data : defaultValue;
	// }

	// // Unwrap data or compute default
	// unwrapOrElse<D>(result: Result<TSuccess & { data: D }, TFailure>, fn: (failure: TFailure) => D): D {
	// 	return this.isSuccess(result) ? result.data : fn(result as TFailure);
	// }

	// // Match pattern for handling both cases
	// match<D, E, R>(
	// 	result: Result<TSuccess & { data: D }, TFailure & { errorDetails: E }>,
	// 	handlers: {
	// 		success: (data: D, message: string) => R;
	// 		failure: (errorDetails: E, message: string) => R;
	// 	}
	// ): R {
	// 	if (this.isSuccess(result)) {
	// 		const successResult = result as TSuccess & { data: D };
	// 		return handlers.success(successResult.data, successResult.message);
	// 	} else {
	// 		const failureResult = result as TFailure & { errorDetails: E };
	// 		return handlers.failure(failureResult.errorDetails, failureResult.message);
	// 	}
	// }
}

// Factory for a completely custom Result handler
export function createCustomResultHandler<TSuccess extends { message: string }, TFailure extends { message: string }>(config: ResultConfig<TSuccess, TFailure>): ResultHandler<TSuccess, TFailure> {
	return new ResultHandler(config);
}
