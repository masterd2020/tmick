/* eslint-disable quotes */
import {
	HandlerRegistry,

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

	// Decorators
	Injectable,
	Singleton,
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

describe('HandlerRegistry', () => {
	beforeEach(() => {
		HandlerRegistry.clear();
	});

	it('should register command handlers', () => {
		HandlerRegistry.register(TestCommandHandler, 'TestCommand', 'command');

		const registrations = HandlerRegistry.getRegistrations();
		expect(registrations).toHaveLength(1);
		expect(registrations[0]).toMatchObject({
			handlerClass: TestCommandHandler,
			targetType: 'TestCommand',
			handlerType: 'command',
		});
	});

	it('should register query handlers', () => {
		HandlerRegistry.register(TestQueryHandler, 'TestQuery', 'query');

		const registrations = HandlerRegistry.getRegistrations();
		expect(registrations).toHaveLength(1);
		expect(registrations[0]).toMatchObject({
			handlerClass: TestQueryHandler,
			targetType: 'TestQuery',
			handlerType: 'query',
		});
	});

	it('should register event handlers', () => {
		HandlerRegistry.register(TestEventHandler, 'TestEvent', 'event');

		const registrations = HandlerRegistry.getRegistrations();
		expect(registrations).toHaveLength(1);
		expect(registrations[0]).toMatchObject({
			handlerClass: TestEventHandler,
			targetType: 'TestEvent',
			handlerType: 'event',
		});
	});

	it('should allow multiple event handlers for the same event', () => {
		class AnotherEventHandler implements IDomainEventHandler<TestEvent> {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			async handle(event: TestEvent): Promise<void> {}
		}

		HandlerRegistry.register(TestEventHandler, 'TestEvent', 'event');
		HandlerRegistry.register(AnotherEventHandler, 'TestEvent', 'event');

		const eventHandlersMap = HandlerRegistry.getEventHandlersMap();
		expect(eventHandlersMap.get('TestEvent')).toHaveLength(2);
	});

	it('should throw error for duplicate command handlers', () => {
		HandlerRegistry.register(TestCommandHandler, 'TestCommand', 'command');

		expect(() => {
			HandlerRegistry.register(TestCommandHandler, 'TestCommand', 'command');
		}).toThrow("Command handler for 'TestCommand' already registered.");
	});

	it('should throw error for duplicate query handlers', () => {
		HandlerRegistry.register(TestQueryHandler, 'TestQuery', 'query');

		expect(() => {
			HandlerRegistry.register(TestQueryHandler, 'TestQuery', 'query');
		}).toThrow("Query handler for 'TestQuery' already registered.");
	});

	it('should register service classes', () => {
		HandlerRegistry.registerServiceClass(TestService);

		const serviceClasses = HandlerRegistry.getServiceClasses();
		expect(serviceClasses).toContain(TestService);
	});

	it('should not register duplicate service classes', () => {
		HandlerRegistry.registerServiceClass(TestService);
		HandlerRegistry.registerServiceClass(TestService);

		const serviceClasses = HandlerRegistry.getServiceClasses();
		expect(serviceClasses.filter((cls) => cls === TestService)).toHaveLength(1);
	});
});
