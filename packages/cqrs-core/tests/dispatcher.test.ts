/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable quotes */
import {
	// Handlers
	CommandHandler,
	QueryHandler,
	EventHandler,

	// Interfaces
	ICommand,
	IQuery,
	IDomainEvent,
	ICommandHandler,
	IQueryHandler,
	IDomainEventHandler,

	// Dispatchers
	EventDispatcher,
	QueryDispatcher,
	CommandDispatcher,

	// Decorators
	Injectable,
	Singleton,
	Transient,
	Inject,
	CustomServiceContainer,
	Token,
	ISERVICECONTAINER_TOKEN,
} from '@tmasterd/cqrs-core';

class TestCommand implements ICommand {
	constructor(public data: string) {}
}

class TestQuery implements IQuery<string> {
	constructor(public data: string) {}
}

class TestEvent implements IDomainEvent {
	readonly occurredOn = new Date();
	readonly eventVersion = 1;
	readonly aggregateId = 'test-aggregate';

	constructor(public data: string) {}
}

// Test Handlers
@CommandHandler(TestCommand)
class TestCommandHandler implements ICommandHandler<TestCommand, void> {
	async handle(command: TestCommand): Promise<void> {
		// Mock implementation
	}
}

@QueryHandler(TestQuery)
class TestQueryHandler implements IQueryHandler<TestQuery, string> {
	async handle(query: TestQuery): Promise<string> {
		return `Result: ${query.data}`;
	}
}

@EventHandler(TestEvent)
class TestEventHandler implements IDomainEventHandler<TestEvent> {
	async handle(event: TestEvent): Promise<void> {
		// Mock implementation
	}
}

@Injectable()
@Singleton()
class TestService {
	getValue(): string {
		return 'test-value';
	}
}

@Injectable()
@Transient()
class TestTransientService {
	getValue(): string {
		return 'transient-value';
	}
}

interface ITestRepository {
	getData(): string;
}

const TEST_REPOSITORY_TOKEN = new Token<ITestRepository>('ITestRepository');

class TestRepository implements ITestRepository {
	getData(): string {
		return 'repository-data';
	}
}

@Injectable()
class ServiceWithDependency {
	constructor(
		@Inject(TEST_REPOSITORY_TOKEN) private repository: ITestRepository,
		private testService: TestService
	) {}

	getInfo(): string {
		return `${this.repository.getData()}-${this.testService.getValue()}`;
	}
}

describe('CommandDispatcher', () => {
	let container: CustomServiceContainer;
	let dispatcher: CommandDispatcher;

	beforeEach(() => {
		container = new CustomServiceContainer();
		container.registerValue(ISERVICECONTAINER_TOKEN, container);
		dispatcher = new CommandDispatcher(container);
	});

	it('should register and dispatch commands', async () => {
		const handler = new TestCommandHandler();
		const handleSpy = jest.spyOn(handler, 'handle');

		container.registerValue('TestCommandHandler', handler);
		dispatcher.registerHandler('TestCommand', 'TestCommandHandler');

		const command = new TestCommand('test-data');
		await dispatcher.dispatch(command);

		expect(handleSpy).toHaveBeenCalledWith(command);
	});

	it('should throw error for duplicate command handlers', () => {
		dispatcher.registerHandler('TestCommand', 'handler1');

		expect(() => {
			dispatcher.registerHandler('TestCommand', 'handler2');
		}).toThrow("Command handler for 'TestCommand' already registered.");
	});

	it('should throw error for unregistered command', async () => {
		const command = new TestCommand('test-data');

		await expect(dispatcher.dispatch(command)).rejects.toThrow("No handler registered for command 'TestCommand'.");
	});
});

describe('QueryDispatcher', () => {
	let container: CustomServiceContainer;
	let dispatcher: QueryDispatcher;

	beforeEach(() => {
		container = new CustomServiceContainer();
		container.registerValue(ISERVICECONTAINER_TOKEN, container);
		dispatcher = new QueryDispatcher(container);
	});

	it('should register and dispatch queries', async () => {
		const handler = new TestQueryHandler();
		const handleSpy = jest.spyOn(handler, 'handle').mockResolvedValue('mocked-result');

		container.registerValue('TestQueryHandler', handler);
		dispatcher.registerHandler('TestQuery', 'TestQueryHandler');

		const query = new TestQuery('test-data');
		const result = await dispatcher.dispatch(query);

		expect(handleSpy).toHaveBeenCalledWith(query);
		expect(result).toBe('mocked-result');
	});

	it('should throw error for duplicate query handlers', () => {
		dispatcher.registerHandler('TestQuery', 'handler1');

		expect(() => {
			dispatcher.registerHandler('TestQuery', 'handler2');
		}).toThrow("Query handler for 'TestQuery' already registered.");
	});

	it('should throw error for unregistered query', async () => {
		const query = new TestQuery('test-data');

		await expect(dispatcher.dispatch(query)).rejects.toThrow("No handler registered for query 'TestQuery'.");
	});
});

describe('EventDispatcher', () => {
	let container: CustomServiceContainer;
	let dispatcher: EventDispatcher;

	beforeEach(() => {
		container = new CustomServiceContainer();
		container.registerValue(ISERVICECONTAINER_TOKEN, container);
		dispatcher = new EventDispatcher(container);
	});

	it('should register and dispatch events', async () => {
		const handler = new TestEventHandler();
		const handleSpy = jest.spyOn(handler, 'handle');

		container.registerValue('TestEventHandler', handler);
		dispatcher.registerHandler('TestEvent', 'TestEventHandler');

		const event = new TestEvent('test-data');
		await dispatcher.dispatch([event]);

		expect(handleSpy).toHaveBeenCalledWith(event);
	});

	it('should handle multiple handlers for the same event', async () => {
		const handler1 = new TestEventHandler();
		const handler2 = new TestEventHandler();
		const handle1Spy = jest.spyOn(handler1, 'handle');
		const handle2Spy = jest.spyOn(handler2, 'handle');

		container.registerValue('TestEventHandler1', handler1);
		container.registerValue('TestEventHandler2', handler2);
		dispatcher.registerHandler('TestEvent', 'TestEventHandler1');
		dispatcher.registerHandler('TestEvent', 'TestEventHandler2');

		const event = new TestEvent('test-data');
		await dispatcher.dispatch([event]);

		expect(handle1Spy).toHaveBeenCalledWith(event);
		expect(handle2Spy).toHaveBeenCalledWith(event);
	});

	it('should handle multiple events', async () => {
		const handler = new TestEventHandler();
		const handleSpy = jest.spyOn(handler, 'handle');

		container.registerValue('TestEventHandler', handler);
		dispatcher.registerHandler('TestEvent', 'TestEventHandler');

		const event1 = new TestEvent('test-data-1');
		const event2 = new TestEvent('test-data-2');
		await dispatcher.dispatch([event1, event2]);

		expect(handleSpy).toHaveBeenCalledTimes(2);
		expect(handleSpy).toHaveBeenNthCalledWith(1, event1);
		expect(handleSpy).toHaveBeenNthCalledWith(2, event2);
	});
});
