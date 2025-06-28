export interface TaskCompleted<D> {
	kind: 'completed';
	message: string;
	data: D;
	duration: number;
	timestamp: Date;
}

export interface TaskFailed<E> {
	kind: 'failed';
	message: string;
	errorDetails: E;
	duration: number;
	timestamp: Date;
	retryable: boolean;
}

export interface TaskPending<D> {
	kind: 'pending';
	message: string;
	data: D;
	estimatedDuration?: number;
	timestamp: Date;
}

export interface TaskRunning<D> {
	kind: 'running';
	message: string;
	data: D;
	progress: number; // 0-100
	timestamp: Date;
	startTime: Date;
}

export type TaskResult<D, E> = TaskCompleted<D> | TaskFailed<E> | TaskPending<D> | TaskRunning<D>;

export class TaskResultHandler<D, E> {
	completed<TD = D>(message: string, data: TD, duration = 0): TaskCompleted<TD> {
		return {
			kind: 'completed',
			message,
			data,
			duration,
			timestamp: new Date(),
		};
	}

	failed<TE = E>(message: string, errorDetails: TE, duration = 0, retryable = true): TaskFailed<TE> {
		return {
			kind: 'failed',
			message,
			errorDetails,
			duration,
			timestamp: new Date(),
			retryable,
		};
	}

	pending<TD = D>(message: string, data: TD, estimatedDuration?: number): TaskPending<TD> {
		return {
			kind: 'pending',
			message,
			data,
			estimatedDuration,
			timestamp: new Date(),
		};
	}

	running<TD = D>(message: string, data: TD, progress: number, startTime: Date = new Date()): TaskRunning<TD> {
		return {
			kind: 'running',
			message,
			data,
			progress: Math.max(0, Math.min(100, progress)),
			timestamp: new Date(),
			startTime,
		};
	}

	// Type guards
	isCompleted<Data, Error>(result: TaskResult<Data, Error>): result is TaskCompleted<Data> {
		return result.kind === 'completed';
	}

	isFailed<Data, Error>(result: TaskResult<Data, Error>): result is TaskFailed<Error> {
		return result.kind === 'failed';
	}

	isPending<Data, Error>(result: TaskResult<Data, Error>): result is TaskPending<Data> {
		return result.kind === 'pending';
	}

	isRunning<Data, Error>(result: TaskResult<Data, Error>): result is TaskRunning<Data> {
		return result.kind === 'running';
	}

	isActive<Data, Error>(result: TaskResult<Data, Error>): result is TaskPending<Data> | TaskRunning<Data> {
		return result.kind === 'pending' || result.kind === 'running';
	}

	isFinished<Data, Error>(result: TaskResult<Data, Error>): result is TaskCompleted<Data> | TaskFailed<Error> {
		return result.kind === 'completed' || result.kind === 'failed';
	}

	// Match pattern for handling all states
	match<Data, Error, R>(
		result: TaskResult<Data, Error>,
		handlers: {
			completed: (data: Data, message: string, duration: number) => R;
			failed: (errorDetails: Error, message: string, duration: number, retryable: boolean) => R;
			pending: (data: Data, message: string, estimatedDuration?: number) => R;
			running: (data: Data, message: string, progress: number, startTime: Date) => R;
		}
	): R {
		switch (result.kind) {
			case 'completed':
				return handlers.completed(result.data, result.message, result.duration);
			case 'failed':
				return handlers.failed(result.errorDetails, result.message, result.duration, result.retryable);
			case 'pending':
				return handlers.pending(result.data, result.message, result.estimatedDuration);
			case 'running':
				return handlers.running(result.data, result.message, result.progress, result.startTime);
		}
	}
}

// Factory for Task Result handler
export function createTaskResultHandler<D, E>(): TaskResultHandler<D, E> {
	return new TaskResultHandler<D, E>();
}

// Pre-instantiated Task handler for immediate use
export const TaskResult = new TaskResultHandler<unknown, unknown>();
