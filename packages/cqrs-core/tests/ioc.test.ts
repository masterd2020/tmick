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

	// Decorators
	Injectable,
	Singleton,
	Transient,
	Inject,

	// IOC
	CustomContainer,
	CustomServiceContainer,
	Token,
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

describe('CustomContainer', () => {
	let container: CustomContainer;

	beforeEach(() => {
		container = new CustomContainer();
	});

	it('should register and resolve factory services', () => {
		const factory = jest.fn(() => new TestService());
		container.registerFactory('testService', factory);

		const instance = container.get('testService');
		expect(instance).toBeInstanceOf(TestService);
		expect(factory).toHaveBeenCalledWith(container);
	});

	it('should register and resolve constructor services', () => {
		container.registerConstructor('testService', TestService);

		const instance = container.get('testService');
		expect(instance).toBeInstanceOf(TestService);
	});

	it('should register and resolve instance services', () => {
		const testInstance = new TestService();
		container.registerInstance('testService', testInstance);

		const instance = container.get('testService');
		expect(instance).toBe(testInstance);
	});

	it('should handle singleton lifecycle correctly', () => {
		container.registerConstructor('testService', TestService, true);

		const instance1 = container.get('testService');
		const instance2 = container.get('testService');
		expect(instance1).toBe(instance2);
	});

	it('should handle transient lifecycle correctly', () => {
		container.registerConstructor('testService', TestService, false);

		const instance1 = container.get('testService');
		const instance2 = container.get('testService');
		expect(instance1).not.toBe(instance2);
	});

	it('should throw error for unregistered service', () => {
		expect(() => container.get('nonExistent')).toThrow("Service 'nonExistent' not registered.");
	});

	it('should check if service exists', () => {
		container.registerConstructor('testService', TestService);

		expect(container.has('testService')).toBe(true);
		expect(container.has('nonExistent')).toBe(false);
	});

	it('should clear all services', () => {
		container.registerConstructor('testService', TestService);
		container.clear();

		expect(container.has('testService')).toBe(false);
	});

	it('should resolve dependencies', () => {
		container.registerInstance(TEST_REPOSITORY_TOKEN, new TestRepository());
		container.registerConstructor('testService', TestService);
		container.registerConstructor('serviceWithDep', ServiceWithDependency, true, [TEST_REPOSITORY_TOKEN, TestService]);

		const instance = container.get<ServiceWithDependency>('serviceWithDep');
		expect(instance.getInfo()).toBe('repository-data-test-value');
	});

	it('should provide debug info', () => {
		container.registerConstructor('testService', TestService);
		const debugInfo = container.getDebugInfo();

		expect(debugInfo.registeredServiceIdentifiers).toContain('TestService');
		expect(debugInfo.instanceCacheSize).toBe(0);
	});
});

describe('CustomServiceContainer', () => {
	let container: CustomServiceContainer;

	beforeEach(() => {
		container = new CustomServiceContainer();
	});

	it('should register services by class', () => {
		container.registerByClass(TestService);

		const instance = container.get(TestService);
		expect(instance).toBeInstanceOf(TestService);
	});

	it('should register factory services', () => {
		const factory = () => new TestService();
		container.registerFactory('testService', factory);

		const instance = container.get('testService');
		expect(instance).toBeInstanceOf(TestService);
	});

	it('should register value services', () => {
		const testInstance = new TestService();
		container.registerValue('testService', testInstance);

		const instance = container.get('testService');
		expect(instance).toBe(testInstance);
	});

	it('should get registered services list', () => {
		container.registerByClass(TestService);
		const services = container.getRegisteredServices();

		expect(services).toContain('TestService');
	});
});
