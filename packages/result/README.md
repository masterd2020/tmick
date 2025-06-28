# @tmasterd/result

[![npm version](https://img.shields.io/npm/v/@tmasterd/result.svg)](https://www.npmjs.com/package/@tmasterd/result)
[![npm version](https://img.shields.io/npm/dw/@tmasterd/result.svg)](https://www.npmjs.com/package/@tmasterd/result)
[![npm version](https://img.shields.io/npm/dm/@tmasterd/result.svg)](https://www.npmjs.com/package/@tmasterd/result)
[![npm version](https://img.shields.io/npm/dt/@tmasterd/result.svg)](https://www.npmjs.com/package/@tmasterd/result)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful, type-safe TypeScript library for handling results, errors, and asynchronous operations with elegant pattern matching and comprehensive error handling.

## 🚀 Features

- **Type-Safe Result Handling**: Eliminate `try-catch` blocks with expressive Result types
- **Multiple Result Patterns**: Default, API, and Task result handlers for different use cases
- **Flexible Architecture**: Create custom result structures or use pre-built ones
- **HTTP Status Code Integration**: Built-in API result handler with standard HTTP status codes
- **Task State Management**: Track pending, running, completed, and failed states
- **Zero Dependencies**: Lightweight with no external dependencies
- **Full TypeScript Support**: Complete type safety with generics

## 📦 Installation

```bash
npm install @tmasterd/result
```

## 🎯 Quick Start

### Default Result Handler

The simplest way to get started with success/failure results:

```typescript
import { DefaultResult } from '@tmasterd/result';

// Create success result
const success = DefaultResult.success('User created successfully', {
	id: 1,
	name: 'John Doe',
});

// Create failure result
const failure = DefaultResult.failure('Validation failed', {
	field: 'email',
	message: 'Invalid email format',
});

// Type-safe checking
if (DefaultResult.isSuccess(success)) {
	console.log(success.data); // { id: 1, name: 'John Doe' }
}

if (DefaultResult.isFailure(failure)) {
	console.log(failure.errorDetails); // { field: 'email', message: 'Invalid email format' }
}
```

### API Result Handler

Perfect for HTTP APIs with built-in status codes:

```typescript
import { ApiResult } from '@tmasterd/result';

// HTTP success responses
const userCreated = ApiResult.created('User created', { id: 1, name: 'John' });
const dataFetched = ApiResult.ok('Data retrieved', { users: [] });
const noContent = ApiResult.noContent('Resource deleted');

// HTTP error responses
const validationError = ApiResult.badRequest('Invalid input', { field: 'email' });
const notFound = ApiResult.notFound('User not found', { id: 123 });
const serverError = ApiResult.internalServerError('Database connection failed', {
	error: 'CONNECTION_TIMEOUT',
});

// All results include HTTP status codes and timestamps
console.log(userCreated.code); // 201
console.log(notFound.code); // 404
console.log(serverError.timestamp); // Date object
```

### Task Result Handler

Ideal for tracking long-running operations:

```typescript
import { TaskResult } from '@tmasterd/result';

// Track task states
const pending = TaskResult.pending('Processing payment...', { orderId: '12345' });
const running = TaskResult.running('Uploading file...', { fileName: 'document.pdf' }, 45);
const completed = TaskResult.completed('Upload finished', { fileUrl: '/uploads/document.pdf' }, 2300);
const failed = TaskResult.failed('Upload failed', { reason: 'Network timeout' }, 1500, true);

// Type-safe state checking
if (TaskResult.isRunning(running)) {
	console.log(`Progress: ${running.progress}%`); // Progress: 45%
}

if (TaskResult.isCompleted(completed)) {
	console.log(`Task completed in ${completed.duration}ms`);
}

// Pattern matching for all states
const result = TaskResult.match(running, {
	completed: (data, message, duration) => `✅ ${message}`,
	failed: (error, message, duration, retryable) => `❌ ${message}`,
	pending: (data, message, estimated) => `⏳ ${message}`,
	running: (data, message, progress) => `🔄 ${message} (${progress}%)`,
});
```

## 🛠 Advanced Usage

### Custom Result Structures

Create your own result types for specific domains:

```typescript
import { createCustomResultHandler, ResultConfig } from '@tmasterd/result';

interface DatabaseSuccess<T> {
	kind: 'db_success';
	message: string;
	data: T;
	queryTime: number;
	rowsAffected?: number;
}

interface DatabaseFailure<E> {
	kind: 'db_failure';
	message: string;
	errorDetails: E;
	sqlState?: string;
	query?: string;
}

const config: ResultConfig<DatabaseSuccess<unknown>, DatabaseFailure<unknown>> = {
	createSuccess: (message, data) => ({
		kind: 'db_success',
		message,
		data,
		queryTime: Date.now(),
	}),
	createFailure: (message, errorDetails) => ({
		kind: 'db_failure',
		message,
		errorDetails,
		sqlState: 'UNKNOWN',
	}),
	isSuccess: (result) => result.kind === 'db_success',
	isFailure: (result) => result.kind === 'db_failure',
};

const DbResult = createCustomResultHandler(config);

// Use your custom result handler
const queryResult = DbResult.success('Users retrieved', { users: [], count: 10 });
```

### Real-World Example: User Service

```typescript
import { ApiResult, TaskResult } from '@tmasterd/result';

interface User {
	id: number;
	email: string;
	name: string;
}

interface ValidationError {
	field: string;
	message: string;
}

class UserService {
	async createUser(userData: Partial<User>) {
		// Validation
		if (!userData.email) {
			return ApiResult.badRequest('Email is required', {
				field: 'email',
				message: 'Email field cannot be empty',
			});
		}

		try {
			// Simulate API call
			const user = await this.saveToDatabase(userData);
			return ApiResult.created('User created successfully', user);
		} catch (error) {
			return ApiResult.internalServerError('Failed to create user', error);
		}
	}

	async processLargeDataset(data: any[]) {
		const task = TaskResult.pending('Starting data processing...', {
			totalItems: data.length,
		});

		// Simulate processing with progress updates
		for (let i = 0; i < data.length; i++) {
			const progress = Math.round((i / data.length) * 100);

			if (progress % 10 === 0) {
				// Update every 10%
				return TaskResult.running(`Processing item ${i + 1} of ${data.length}`, { currentItem: i + 1, totalItems: data.length }, progress);
			}
		}

		return TaskResult.completed(
			'Data processing completed',
			{
				processedItems: data.length,
			},
			5000
		);
	}

	private async saveToDatabase(userData: Partial<User>): Promise<User> {
		// Simulate database operation
		return {
			id: Math.random(),
			email: userData.email!,
			name: userData.name || 'Unknown',
		};
	}
}

// Usage
const userService = new UserService();

const result = await userService.createUser({ email: 'john@example.com' });

if (ApiResult.isSuccess(result)) {
	console.log('User created:', result.data);
	console.log('Status code:', result.code); // 201
} else {
	console.error('Error:', result.message);
	console.error('Details:', result.errorDetails);
	console.error('Status code:', result.code); // 400 or 500
}
```

## 📚 API Reference

### DefaultResult

Pre-configured handler for basic success/failure results.

**Methods:**

- `success<T>(message: string, data: T)` - Create success result
- `failure<E>(message: string, errorDetails: E)` - Create failure result
- `isSuccess(result)` - Type guard for success
- `isFailure(result)` - Type guard for failure

### ApiResult

HTTP-aware result handler with status codes.

**Success Methods:**

- `ok<T>(message, data)` - 200 OK
- `created<T>(message, data)` - 201 Created
- `accepted<T>(message, data)` - 202 Accepted
- `noContent<T>(message, data?)` - 204 No Content

**Client Error Methods:**

- `badRequest<E>(message, error)` - 400 Bad Request
- `unauthorized<E>(message, error)` - 401 Unauthorized
- `forbidden<E>(message, error)` - 403 Forbidden
- `notFound<E>(message, error)` - 404 Not Found
- `conflict<E>(message, error)` - 409 Conflict
- `unprocessableEntity<E>(message, error)` - 422 Unprocessable Entity
- `tooManyRequests<E>(message, error)` - 429 Too Many Requests

**Server Error Methods:**

- `internalServerError<E>(message, error)` - 500 Internal Server Error
- `notImplemented<E>(message, error)` - 501 Not Implemented
- `badGateway<E>(message, error)` - 502 Bad Gateway
- `serviceUnavailable<E>(message, error)` - 503 Service Unavailable
- `gatewayTimeout<E>(message, error)` - 504 Gateway Timeout

### TaskResult

State-aware handler for long-running operations.

**State Methods:**

- `pending<T>(message, data, estimatedDuration?)` - Task is queued
- `running<T>(message, data, progress, startTime?)` - Task is executing
- `completed<T>(message, data, duration?)` - Task finished successfully
- `failed<E>(message, error, duration?, retryable?)` - Task failed

**Type Guards:**

- `isCompleted(result)`, `isFailed(result)`, `isPending(result)`, `isRunning(result)`
- `isActive(result)` - pending or running
- `isFinished(result)` - completed or failed

**Pattern Matching:**

- `match(result, handlers)` - Handle all possible states

## 🎨 Type Safety

All result handlers provide complete type safety:

```typescript
const result = DefaultResult.success('Data loaded', { users: [], count: 0 });

if (DefaultResult.isSuccess(result)) {
	// TypeScript knows this is a success result
	result.data.users; // ✅ Type-safe access
	result.data.count; // ✅ Type-safe access
	// result.errorDetails; // ❌ TypeScript error - not available on success
}

if (DefaultResult.isFailure(result)) {
	// TypeScript knows this is a failure result
	result.errorDetails; // ✅ Type-safe access
	// result.data; // ❌ TypeScript error - not available on failure
}
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [GitHub Repository](https://github.com/masterd2020/tmick)
- [npm Package](https://www.npmjs.com/package/@tmasterd/result)
- [Issue Tracker](https://github.com/masterd2020/tmick/issues)

---

Made with ❤️ by the @tmasterd team
