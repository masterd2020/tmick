# Tmick: A Lightweight IoC and CQRS Framework for TypeScript

[![npm version](https://img.shields.io/npm/v/@tmasterd/cqrs-core.svg)](https://www.npmjs.com/package/@tmasterd/cqrs-core)
[![npm version](https://img.shields.io/npm/dw/@tmasterd/cqrs-core.svg)](https://www.npmjs.com/package/@tmasterd/cqrs-core)
[![npm version](https://img.shields.io/npm/dm/@tmasterd/cqrs-core.svg)](https://www.npmjs.com/package/@tmasterd/cqrs-core)
[![npm version](https://img.shields.io/npm/dt/@tmasterd/cqrs-core.svg)](https://www.npmjs.com/package/@tmasterd/cqrs-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Tmick is a lightweight yet powerful Inversion of Control (IoC) and Command Query Responsibility Segregation (CQRS) framework designed for TypeScript applications. It provides a robust dependency injection container, along with patterns for building scalable and maintainable applications using CQRS principles.

## Features

- **Inversion of Control (IoC) Container**: A flexible container for managing service dependencies.

    - **Dependency Injection (DI)**: Supports constructor injection using decorators.

    - **Service Lifecycles**: Easily define services as `Singleton` (default) or `Transient`.

    - **Token-based Injection**: Inject configurations, interfaces, or other values using unique `Token` identifiers.

- **Command Query Responsibility Segregation (CQRS)**:

    - **Commands**: Encapsulate actions that change application state.

    - **Queries**: Encapsulate actions that retrieve data without side effects.

    - **Domain Events**: Communicate changes within the domain, allowing for decoupled event handlers.

    - **Handlers**: Dedicated classes for processing commands, queries, and events.

    - **Dispatchers**: Centralized mechanisms for sending commands, queries, and events to their respective handlers.

- **Auto-Scanning & Registration**: Automatically discovers and registers services and handlers decorated with `@Injectable`, `@CommandHandler`, `@QueryHandler`, and `@EventHandler`.

- **Minimal Overhead**: Designed to be lightweight and easy to integrate into existing TypeScript projects.

## Installation

To use Tmick in your project, install it via npm or yarn:

```bash
npm install @tmasterd/cqrs-core reflect-metadata
# or
yarn add @tmasterd/cqrs-core reflect-metadata
```

**Important Note on `reflect-metadata`**:
Tmick heavily relies on TypeScript decorators and the `reflect-metadata` polyfill. You **MUST** ensure that `reflect-metadata` is imported at the very top of your application's entry file (e.g., `src/index.ts` or `src/main.ts`) before any decorated classes are defined.

**Example `src/index.ts`:**

```typescript
// src/index.ts
import 'reflect-metadata'; // CRITICAL: This must be the very first import!
import { Tmick } from '@tmasterd/cqrs-core'; // Import Tmick from the package
// ... your application code
```

Also, ensure your `tsconfig.json` has the following compiler options enabled:

```json
{
	"compilerOptions": {
		"emitDecoratorMetadata": true,
		"experimentalDecorators": true
		// ... other options
	}
}
```

## Usage

### 1. IoC Container Basics

The core of Tmick's dependency injection is the `Tmick` class and its associated decorators.

```typescript
// my-service.ts
import { Injectable, Singleton, Transient, Inject, Token } from '@tmasterd/cqrs-core';

// Define an interface for better type safety and flexibility
interface ILogger {
	log(message: string): void;
}

// Implement a logger service as a Singleton
@Injectable()
@Singleton()
class ConsoleLogger implements ILogger {
	log(message: string): void {
		console.log(`[App Log] ${message}`);
	}
}

// Implement a data service as a Transient service
@Injectable()
@Transient()
class DataService {
	constructor(@Inject(ConsoleLogger) private logger: ILogger) {
		// Inject the logger
		this.logger.log('DataService instance created.');
	}

	fetchData(): string {
		return 'Some fetched data.';
	}
}

// You can also inject values using a Token
const APP_SETTINGS_TOKEN = new Token<{ apiUrl: string }>('AppSettings');

@Injectable()
class ApiClient {
	constructor(
		@Inject(APP_SETTINGS_TOKEN) private settings: { apiUrl: string },
		@Inject(ConsoleLogger) private logger: ILogger
	) {
		this.logger.log(`ApiClient created with API URL: ${settings.apiUrl}`);
	}

	callApi(): string {
		return `Calling ${this.settings.apiUrl}/data`;
	}
}

// In your application's entry point (e.g., index.ts or main.ts)
import { Tmick } from '@tmasterd/cqrs-core';
// IMPORTANT: Make sure 'reflect-metadata' is imported at the very top of your application's main entry file.

const app = new Tmick();

// Auto-scan and register all decorated classes (ConsoleLogger, DataService, ApiClient)
app.autoScanAndRegisters();

// Initialize the framework (important for dispatchers, though optional for pure IoC)
app.initialize();

// Register a value using the token
app.getContainer().registerValue(APP_SETTINGS_TOKEN, { apiUrl: '[https://api.example.com](https://api.example.com)' });

// Resolve services from the container
const logger1 = app.get(ConsoleLogger);
const logger2 = app.get(ConsoleLogger);
console.log('Logger instances are same (singleton):', logger1 === logger2); // true

const dataService1 = app.get(DataService);
const dataService2 = app.get(DataService);
console.log('DataService instances are same (transient):', dataService1 === dataService2); // false

const apiClient = app.get(ApiClient);
console.log(apiClient.callApi()); // Output: Calling [https://api.example.com/data](https://api.example.com/data)
```

### 2. CQRS Implementation

Tmick provides interfaces and decorators to structure your application using CQRS.

#### Commands and Command Handlers

Commands are plain data objects representing an intent to change state. Command Handlers execute these intents.

```typescript
// my-commands.ts
import { ICommand } from '@tmasterd/cqrs-core';

export class CreateUserCommand implements ICommand {
	constructor(
		public readonly name: string,
		public readonly email: string
	) {}
}

// my-command-handlers.ts
import { Injectable, CommandHandler, Inject, ICommandHandler } from '@tmasterd/cqrs-core';
import { ILogger } from './my-service'; // Your logger service
import { CreateUserCommand } from './my-commands';

@Injectable()
@CommandHandler(CreateUserCommand)
class CreateUserCommandHandler implements ICommandHandler<CreateUserCommand> {
	constructor(@Inject(ILogger) private logger: ILogger) {} // Inject dependencies

	async handle(command: CreateUserCommand): Promise<void> {
		this.logger.log(`Creating user: ${command.name} (${command.email})`);
		// ... logic to persist user ...
		console.log(`User ${command.name} created successfully.`);
	}
}
```

#### Queries and Query Handlers

Queries are plain data objects representing a request for data. Query Handlers retrieve the data.

```typescript
// my-queries.ts
import { IQuery } from '@tmasterd/cqrs-core';

export interface UserDto {
	id: string;
	name: string;
	email: string;
}

export class GetUserByIdQuery implements IQuery<UserDto | undefined> {
	constructor(public readonly userId: string) {}
}

// my-query-handlers.ts
import { Injectable, QueryHandler, Inject, IQueryHandler } from '@tmasterd/cqrs-core';
import { ILogger } from './my-service'; // Your logger service
import { GetUserByIdQuery, UserDto } from './my-queries';

@Injectable()
@QueryHandler(GetUserByIdQuery)
class GetUserByIdQueryHandler implements IQueryHandler<GetUserByIdQuery, UserDto | undefined> {
	constructor(@Inject(ILogger) private logger: ILogger) {}

	async handle(query: GetUserByIdQuery): Promise<UserDto | undefined> {
		this.logger.log(`Fetching user by ID: ${query.userId}`);
		// ... logic to retrieve user from read model/database ...
		if (query.userId === 'user-123') {
			return { id: 'user-123', name: 'John Doe', email: 'john@example.com' };
		}
		return undefined;
	}
}
```

#### Domain Events and Event Handlers

Events represent something that _has happened_. Event Handlers react to these events.

```typescript
// my-events.ts
import { IDomainEvent } from '@tmasterd/cqrs-core';

export class UserCreatedEvent implements IDomainEvent {
  readonly occurredOn: Date = new Date();
  readonly eventVersion: number = 1;
  readonly aggregateId: string; // The ID of the user created

  constructor(public readonly userId: string, public readonly userName: string) {
    this.aggregateId = userId;
  }
}

// my-event-handlers.ts
import { Injectable, EventHandler, Inject, IDomainEventHandler } from '@tmasterd/cqrs-core';
import { ILogger } => './my-service'; // Your logger service
import { UserCreatedEvent } from './my-events';

@Injectable()
@EventHandler(UserCreatedEvent)
class UserCreatedEventHandler implements IDomainEventHandler<UserCreatedEvent> {
  constructor(@Inject(ILogger) private logger: ILogger) {}

  async handle(event: UserCreatedEvent): Promise<void> {
    this.logger.log(`[EVENT] UserCreatedEvent received for user: ${event.userName} (ID: ${event.userId})`);
    // Example: Send a welcome email, update search index, etc.
  }
}
```

#### Dispatching in `Tmick`

```typescript
// app.ts
import { Tmick, IEventDispatcher, EVENT_DISPATCHER_TOKEN } from '@tmasterd/cqrs-core';
import { CreateUserCommand } from './my-commands';
import { GetUserByIdQuery } from './my-queries';
import { UserCreatedEvent } from './my-events';

// IMPORTANT: Ensure all handler files are imported somewhere in your application's startup
// so their decorators are executed and they register with HandlerRegistry.
import './my-command-handlers';
import './my-query-handlers';
import './my-event-handlers';
import './my-service'; // Also import your services

async function runApp() {
	const tmickApp = new Tmick();

	// This is crucial: auto-scan and registers all decorated classes (services, handlers)
	tmickApp.autoScanAndRegisters();
	tmickApp.initialize(); // Finalize setup

	console.log('--- Running CQRS Example ---');

	// Execute a command
	await tmickApp.executeCommand(new CreateUserCommand('Jane Doe', 'jane@example.com'));

	// Execute a query
	const user = await tmickApp.executeQuery(new GetUserByIdQuery('user-123'));
	console.log('Fetched User:', user);

	// Dispatch an event directly (though usually events are dispatched by command handlers)
	const eventDispatcher = tmickApp.get<IEventDispatcher>(EVENT_DISPATCHER_TOKEN);
	await eventDispatcher.dispatch([new UserCreatedEvent('user-456', 'New User')]);

	tmickApp.dispose(); // Clean up resources
}

runApp().catch(console.error);
```

## API Reference (Key Components)

| Component                                                                                                 | Description                                                                                                                                                                                                                                   |
| :-------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Tmick`                                                                                                   | The main framework class. Manages the IoC container, auto-registration, and dispatchers. Methods: `autoScanAndRegisters()`, `initialize()`, `get()`, `executeCommand()`, `executeQuery()`, `dispatchEvents()`, `getContainer()`, `dispose()`. |
| `Token<T>`                                                                                                | A class used to create unique identifiers for services, especially for interfaces or non-class values.                                                                                                                                        |
| `@Injectable()`                                                                                           | Class decorator to mark a class as a service eligible for dependency injection and auto-scanning.                                                                                                                                             |
| `@Singleton()`                                                                                            | Class decorator to mark an `@Injectable` service as a singleton (default).                                                                                                                                                                    |
| `@Transient()`                                                                                            | Class decorator to mark an `@Injectable` service as transient (new instance per resolution).                                                                                                                                                  |
| `@Inject(identifier)`                                                                                     | Parameter decorator for constructor arguments to specify the `ServiceIdentifier` of the dependency to inject.                                                                                                                                 |
| `ICommand`                                                                                                | Base interface for all command objects.                                                                                                                                                                                                       |
| `IQuery<TResult>`                                                                                         | Base interface for all query objects, typed with their expected result.                                                                                                                                                                       |
| `IDomainEvent`                                                                                            | Base interface for all domain event objects.                                                                                                                                                                                                  |
| `@CommandHandler(Cmd)`                                                                                    | Class decorator to register a class as a handler for a specific `ICommand`.                                                                                                                                                                   |
| `@QueryHandler(Query)`                                                                                    | Class decorator to register a class as a handler for a specific `IQuery`.                                                                                                                                                                     |
| `@EventHandler(Event)`                                                                                    | Class decorator to register a class as a handler for a specific `IDomainEvent`.                                                                                                                                                               |
| `IServiceContainer`                                                                                       | Interface for the public-facing IoC container. Methods: `registerFactory()`, `registerValue()`, `registerConstructor()`, `registerByClass()`, `get()`, `has()`.                                                                               |
| `COMMAND_DISPATCHER_TOKEN`, `QUERY_DISPATCHER_TOKEN`, `EVENT_DISPATCHER_TOKEN`, `ISERVICECONTAINER_TOKEN` | Pre-defined `Token` instances for injecting framework's core dispatchers and the container itself.                                                                                                                                            |

## Examples

To try out the examples, first ensure you have the demo package installed:

```bash
npm install @tmasterd/cqrs-demo
# or
yarn add @tmasterd/cqrs-demo
```

Then, create a small TypeScript file in your project (e.g., `run-demo.ts`) and import the desired example function. Make sure your project is configured for TypeScript (as described in the Installation section) and you have `ts-node` installed (`npm install -g ts-node` or `yarn global add ts-node`) for direct execution, or compile and run.

1.  **IoC Only Example**:
    Create a file (e.g., `run-ioc.ts`):

    ```typescript
    // run-ioc.ts
    import 'reflect-metadata'; // Ensure this is at the top of your main entry file
    import { runIocOnlyExample } from '@tmasterd/cqrs-demo';

    runIocOnlyExample().catch(console.error);
    ```

    Run it:

    ```bash
    ts-node run-ioc.ts
    ```

    This shows how to use Tmick purely as a dependency injection container, demonstrating singleton and transient lifecycles and token-based injection.

2.  **Basic CQRS Example**:
    Create a file (e.g., `run-cqrs-basic.ts`):

    ```typescript
    // run-cqrs-basic.ts
    import 'reflect-metadata'; // Ensure this is at the top of your main entry file
    import { runCqrsExample } from '@tmasterd/cqrs-demo';

    runCqrsExample().catch(console.error);
    ```

    Run it:

    ```bash
    ts-node run-cqrs-basic.ts
    ```

    This demonstrates the core CQRS flow for a simple Notes application, including creating, updating, deleting notes via commands, and fetching notes via queries, along with event handling.

3.  **CQRS with Express.js Example**:
    Create a file (e.g., `run-cqrs-express.ts`):

    ```typescript
    // run-cqrs-express.ts
    import 'reflect-metadata'; // Ensure this is at the top of your main entry file
    import { startServer } from '@tmasterd/cqrs-demo';

    startServer(3000).catch(console.error);
    ```

    Run it:

    ```bash
    ts-node run-cqrs-express.ts
    ```

    This sets up an Express.js server that exposes RESTful API endpoints for the Notes application, with the business logic implemented using Tmick's CQRS framework and injected into an Express controller.
    After running, open your browser or use `curl`/Postman to hit `http://localhost:3000/api/v1/notes`.

    **Example `curl` commands:**

    - **Create Note**:
        ```bash
        curl -X POST -H "Content-Type: application/json" -d '{"title": "My New Note", "content": "This is a note from curl."}' http://localhost:3000/api/v1/notes
        ```
    - **Get All Notes**:
        ```bash
        curl http://localhost:3000/api/v1/notes
        ```
    - **Get Note by ID**: (Replace `<note_id>` with an ID from the create response or get all)
        ```bash
        curl http://localhost:3000/api/v1/notes/<note_id>
        ```
    - **Update Note**:
        ```bash
        curl -X PUT -H "Content-Type: application/json" -d '{"content": "Updated content here."}' http://localhost:3000/api/v1/notes/<note_id>
        ```
    - **Delete Note**:
        ```bash
        curl -X DELETE http://localhost:3000/api/v1/notes/<note_id>
        ```

## Contributing

We welcome contributions! Please feel free to open issues or submit pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
