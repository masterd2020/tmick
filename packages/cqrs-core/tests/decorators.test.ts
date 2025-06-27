/* eslint-disable @typescript-eslint/no-empty-function */
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
	Transient,
	Inject,
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

describe('Decorators', () => {
	beforeEach(() => {
		HandlerRegistry.clear();
	});

	it('should register command handler with @CommandHandler decorator', () => {
		@CommandHandler(TestCommand)
		class DecoratedCommandHandler implements ICommandHandler<TestCommand, void> {
			async handle(command: TestCommand): Promise<void> {}
		}

		const registrations = HandlerRegistry.getRegistrations();
		const commandRegistration = registrations.find((r) => r.handlerType === 'command');
		expect(commandRegistration).toBeDefined();
		expect(commandRegistration?.targetType).toBe('TestCommand');
	});

	it('should register query handler with @QueryHandler decorator', () => {
		@QueryHandler(TestQuery)
		class DecoratedQueryHandler implements IQueryHandler<TestQuery, string> {
			async handle(query: TestQuery): Promise<string> {
				return 'result';
			}
		}

		const registrations = HandlerRegistry.getRegistrations();
		const queryRegistration = registrations.find((r) => r.handlerType === 'query');
		expect(queryRegistration).toBeDefined();
		expect(queryRegistration?.targetType).toBe('TestQuery');
	});

	it('should register event handler with @EventHandler decorator', () => {
		@EventHandler(TestEvent)
		class DecoratedEventHandler implements IDomainEventHandler<TestEvent> {
			async handle(event: TestEvent): Promise<void> {}
		}

		const registrations = HandlerRegistry.getRegistrations();
		const eventRegistration = registrations.find((r) => r.handlerType === 'event');
		expect(eventRegistration).toBeDefined();
		expect(eventRegistration?.targetType).toBe('TestEvent');
	});

	it('should mark handler as injectable', () => {
		@CommandHandler(TestCommand)
		class HandlerWithInjectableMetadata implements ICommandHandler<TestCommand, void> {
			async handle(command: TestCommand): Promise<void> {}
		}

		const metadata = Reflect.getMetadata('cqrs:injectable-service', HandlerWithInjectableMetadata);
		expect(metadata).toBeDefined();
	});

	it('should set lifecycle metadata with @Singleton', () => {
		@Injectable()
		@Singleton()
		class SingletonService {}

		const metadata = Reflect.getMetadata('cqrs:lifecycle', SingletonService);
		expect(metadata).toEqual({ singleton: true });
	});

	it('should set lifecycle metadata with @Transient', () => {
		@Injectable()
		@Transient()
		class TransientService {}

		const metadata = Reflect.getMetadata('cqrs:lifecycle', TransientService);
		expect(metadata).toEqual({ singleton: false });
	});

	it('should set parameter dependencies with @Inject', () => {
		class ServiceWithInject {
			constructor(@Inject('dependency1') dep1: any, @Inject('dependency2') dep2: any) {}
		}

		const dependencies = Reflect.getMetadata('cqrs:param-dependencies', ServiceWithInject);
		expect(dependencies).toEqual(['dependency1', 'dependency2']);
	});
});
