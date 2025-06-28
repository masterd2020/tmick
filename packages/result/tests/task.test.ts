import { TaskResult, createTaskResultHandler } from '../src';

describe('TaskResult', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date('2024-01-01T10:00:00Z'));
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	describe('Task State Creation', () => {
		it('should create completed task', () => {
			const result = TaskResult.completed('Task finished', { result: 'success' }, 1500);

			expect(result.kind).toBe('completed');
			expect(result.message).toBe('Task finished');
			expect(result.data).toEqual({ result: 'success' });
			expect(result.duration).toBe(1500);
			expect(result.timestamp).toBeInstanceOf(Date);
		});

		it('should create failed task', () => {
			const error = { code: 'TIMEOUT', details: 'Operation timed out' };
			const result = TaskResult.failed('Task failed', error, 3000, false);

			expect(result.kind).toBe('failed');
			expect(result.errorDetails).toEqual(error);
			expect(result.duration).toBe(3000);
			expect(result.retryable).toBe(false);
		});

		it('should create failed task with default retryable true', () => {
			const result = TaskResult.failed('Task failed', { error: 'network' });

			expect(result.retryable).toBe(true);
			expect(result.duration).toBe(0);
		});

		it('should create pending task', () => {
			const result = TaskResult.pending('Task queued', { taskId: 'abc123' }, 5000);

			expect(result.kind).toBe('pending');
			expect(result.estimatedDuration).toBe(5000);
			expect(result.data.taskId).toBe('abc123');
		});

		it('should create pending task without estimated duration', () => {
			const result = TaskResult.pending('Task queued', { taskId: 'xyz789' });

			expect(result.estimatedDuration).toBeUndefined();
		});

		it('should create running task', () => {
			const startTime = new Date('2024-01-01T09:30:00Z');
			const result = TaskResult.running('Processing', { step: 1 }, 45, startTime);

			expect(result.kind).toBe('running');
			expect(result.progress).toBe(45);
			expect(result.startTime).toBe(startTime);
		});

		it('should create running task with default start time', () => {
			const result = TaskResult.running('Processing', { step: 1 }, 25);

			expect(result.startTime).toBeInstanceOf(Date);
		});

		it('should clamp progress between 0 and 100', () => {
			const negativeResult = TaskResult.running('Processing', {}, -10);
			const overResult = TaskResult.running('Processing', {}, 150);

			expect(negativeResult.progress).toBe(0);
			expect(overResult.progress).toBe(100);
		});
	});

	describe('Type Guards', () => {
		const completedTask = TaskResult.completed('Done', { value: 1 });
		const failedTask = TaskResult.failed('Error', { code: 500 });
		const pendingTask = TaskResult.pending('Waiting', { id: 1 });
		const runningTask = TaskResult.running('Processing', { id: 1 }, 50);

		it('should identify completed tasks', () => {
			expect(TaskResult.isCompleted(completedTask)).toBe(true);
			expect(TaskResult.isCompleted(failedTask)).toBe(false);
			expect(TaskResult.isCompleted(pendingTask)).toBe(false);
			expect(TaskResult.isCompleted(runningTask)).toBe(false);
		});

		it('should identify failed tasks', () => {
			expect(TaskResult.isFailed(failedTask)).toBe(true);
			expect(TaskResult.isFailed(completedTask)).toBe(false);
			expect(TaskResult.isFailed(pendingTask)).toBe(false);
			expect(TaskResult.isFailed(runningTask)).toBe(false);
		});

		it('should identify pending tasks', () => {
			expect(TaskResult.isPending(pendingTask)).toBe(true);
			expect(TaskResult.isPending(completedTask)).toBe(false);
			expect(TaskResult.isPending(failedTask)).toBe(false);
			expect(TaskResult.isPending(runningTask)).toBe(false);
		});

		it('should identify running tasks', () => {
			expect(TaskResult.isRunning(runningTask)).toBe(true);
			expect(TaskResult.isRunning(completedTask)).toBe(false);
			expect(TaskResult.isRunning(failedTask)).toBe(false);
			expect(TaskResult.isRunning(pendingTask)).toBe(false);
		});

		it('should identify active tasks (pending or running)', () => {
			expect(TaskResult.isActive(pendingTask)).toBe(true);
			expect(TaskResult.isActive(runningTask)).toBe(true);
			expect(TaskResult.isActive(completedTask)).toBe(false);
			expect(TaskResult.isActive(failedTask)).toBe(false);
		});

		it('should identify finished tasks (completed or failed)', () => {
			expect(TaskResult.isFinished(completedTask)).toBe(true);
			expect(TaskResult.isFinished(failedTask)).toBe(true);
			expect(TaskResult.isFinished(pendingTask)).toBe(false);
			expect(TaskResult.isFinished(runningTask)).toBe(false);
		});
	});

	describe('Match Pattern', () => {
		it('should match completed task', () => {
			const task = TaskResult.completed('Done', { result: 'success' }, 2000);
			const message = TaskResult.match(task, {
				completed: (data, msg, duration) => `✅ ${msg} in ${duration}ms`,
				failed: (error, msg) => `❌ ${msg}`,
				pending: (data, msg) => `⏳ ${msg}`,
				running: (data, msg, progress) => `🔄 ${msg} (${progress}%)`,
			});

			expect(message).toBe('✅ Done in 2000ms');
		});

		it('should match failed task', () => {
			const task = TaskResult.failed('Error occurred', { code: 'NET_ERR' }, 1000, true);
			const message = TaskResult.match(task, {
				completed: (data, msg) => `✅ ${msg}`,
				failed: (error, msg, duration, retryable) => `❌ ${msg}: ${error.code} (retryable: ${retryable})`,
				pending: (data, msg) => `⏳ ${msg}`,
				running: (data, msg, progress) => `🔄 ${msg}`,
			});

			expect(message).toBe('❌ Error occurred: NET_ERR (retryable: true)');
		});

		it('should match pending task', () => {
			const task = TaskResult.pending('Queued', { id: 1 }, 3000);
			const message = TaskResult.match(task, {
				completed: (data, msg) => `✅ ${msg}`,
				failed: (error, msg) => `❌ ${msg}`,
				pending: (data, msg, estimated) => `⏳ ${msg} (ETA: ${estimated}ms)`,
				running: (data, msg, progress) => `🔄 ${msg}`,
			});

			expect(message).toBe('⏳ Queued (ETA: 3000ms)');
		});

		it('should match running task', () => {
			const task = TaskResult.running('Processing', { step: 3 }, 75);
			const message = TaskResult.match(task, {
				completed: (data, msg) => `✅ ${msg}`,
				failed: (error, msg) => `❌ ${msg}`,
				pending: (data, msg) => `⏳ ${msg}`,
				running: (data, msg, progress, startTime) => `🔄 ${msg} - ${progress}% (started: ${startTime.toISOString()})`,
			});

			expect(message).toContain('🔄 Processing - 75%');
		});
	});

	describe('Generic Type Support', () => {
		it('should support custom data types', () => {
			interface FileData {
				filename: string;
				size: number;
			}

			interface ProcessingError {
				code: string;
				filename: string;
			}

			const handler = createTaskResultHandler<FileData, ProcessingError>();

			const task = handler.completed(
				'File processed',
				{
					filename: 'document.pdf',
					size: 1024000,
				},
				5000
			);

			expect(task.data.filename).toBe('document.pdf');
			expect(task.data.size).toBe(1024000);
		});
	});

	describe('Factory Function', () => {
		it('should create handler with factory function', () => {
			const handler = createTaskResultHandler();
			const task = handler.pending('Test task', { id: 'test' });

			expect(handler.isPending(task)).toBe(true);
			expect(task.kind).toBe('pending');
		});
	});
});
