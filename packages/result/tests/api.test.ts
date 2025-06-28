import { ApiResult, createApiResultHandler } from '../src';

describe('ApiResult', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date('2024-01-01T10:00:00Z'));
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	describe('HTTP Success Methods', () => {
		it('should create 200 OK response', () => {
			const result = ApiResult.ok('Request successful', { id: 1, name: 'Test' });

			expect(result.kind).toBe('success');
			expect(result.code).toBe(200);
			expect(result.message).toBe('Request successful');
			expect(result.data).toEqual({ id: 1, name: 'Test' });
			expect(result.timestamp).toBeInstanceOf(Date);
		});

		it('should create 201 Created response', () => {
			const result = ApiResult.created('Resource created', { id: 2 });

			expect(result.code).toBe(201);
			expect(result.kind).toBe('success');
		});

		it('should create 202 Accepted response', () => {
			const result = ApiResult.accepted('Request accepted', { jobId: 'abc123' });

			expect(result.code).toBe(202);
			expect(result.kind).toBe('success');
		});

		it('should create 204 No Content response', () => {
			const result = ApiResult.noContent('Resource deleted');

			expect(result.code).toBe(204);
			expect(result.data).toBeNull();
		});

		it('should create 204 with custom data', () => {
			const result = ApiResult.noContent('Custom no content', { processed: true });

			expect(result.code).toBe(204);
			expect(result.data).toEqual({ processed: true });
		});
	});

	describe('HTTP Client Error Methods', () => {
		it('should create 400 Bad Request response', () => {
			const error = { field: 'email', message: 'Invalid format' };
			const result = ApiResult.badRequest('Validation failed', error);

			expect(result.kind).toBe('failure');
			expect(result.code).toBe(400);
			expect(result.errorDetails).toEqual(error);
		});

		it('should create 401 Unauthorized response', () => {
			const result = ApiResult.unauthorized('Invalid credentials', { reason: 'expired_token' });

			expect(result.code).toBe(401);
			expect(result.kind).toBe('failure');
		});

		it('should create 403 Forbidden response', () => {
			const result = ApiResult.forbidden('Access denied', { requiredRole: 'admin' });

			expect(result.code).toBe(403);
		});

		it('should create 404 Not Found response', () => {
			const result = ApiResult.notFound('Resource not found', { id: 'nonexistent' });

			expect(result.code).toBe(404);
		});

		it('should create 409 Conflict response', () => {
			const result = ApiResult.conflict('Resource conflict', { existingId: 'abc123' });

			expect(result.code).toBe(409);
		});

		it('should create 422 Unprocessable Entity response', () => {
			const result = ApiResult.unprocessableEntity('Validation failed', {
				errors: [{ field: 'age', message: 'Must be positive' }],
			});

			expect(result.code).toBe(422);
		});

		it('should create 429 Too Many Requests response', () => {
			const result = ApiResult.tooManyRequests('Rate limit exceeded', {
				retryAfter: 60,
			});

			expect(result.code).toBe(429);
		});
	});

	describe('HTTP Server Error Methods', () => {
		it('should create 500 Internal Server Error response', () => {
			const result = ApiResult.internalServerError('Server error', {
				stack: 'Error stack trace',
			});

			expect(result.code).toBe(500);
			expect(result.kind).toBe('failure');
		});

		it('should create 501 Not Implemented response', () => {
			const result = ApiResult.notImplemented('Feature not implemented', {
				feature: 'advanced_search',
			});

			expect(result.code).toBe(501);
		});

		it('should create 502 Bad Gateway response', () => {
			const result = ApiResult.badGateway('Upstream error', {
				upstreamService: 'payment-service',
			});

			expect(result.code).toBe(502);
		});

		it('should create 503 Service Unavailable response', () => {
			const result = ApiResult.serviceUnavailable('Service down for maintenance', {
				estimatedDowntime: '30 minutes',
			});

			expect(result.code).toBe(503);
		});

		it('should create 504 Gateway Timeout response', () => {
			const result = ApiResult.gatewayTimeout('Upstream timeout', {
				timeout: 30000,
			});

			expect(result.code).toBe(504);
		});
	});

	describe('Factory Function', () => {
		it('should create typed handler with factory', () => {
			interface UserData {
				id: string;
				name: string;
			}
			interface ErrorData {
				code: string;
				details: string;
			}

			const handler = createApiResultHandler<UserData, ErrorData>();
			const result = handler.ok('User found', { id: '1', name: 'John' });

			expect(result.code).toBe(200);
			expect(result.data.name).toBe('John');
		});
	});
});
