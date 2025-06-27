/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable quotes */
import {
	// Handlers
	CommandHandler,
	QueryHandler,
	EventHandler,

	// Framework
	HandlerRegistry,
	Tmick,
	Token,

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

@Injectable()
class ServiceWithDependency {
	constructor(
		@Inject(TEST_REPOSITORY_TOKEN) private repository: ITestRepository,
		@Inject(TestService) private testService: TestService
		// private testService: TestService
	) {}

	getInfo(): string {
		return `${this.repository.getData()}-${this.testService.getValue()}`;
	}
}

class TestRepository implements ITestRepository {
	getData(): string {
		return 'repository-data';
	}
}

describe('Tmick Framework Tests', () => {
	let tmick: Tmick;

	beforeEach(() => {
		// Clear any existing registrations
		HandlerRegistry.clear();
		tmick = new Tmick();
	});

	afterEach(() => {
		if (tmick) {
			tmick.dispose();
		}
	});

	describe('Tmick Framework Integration', () => {
		it('should auto-scan and register services', () => {
			@CommandHandler(TestCommand)
			class TestCommandHandler implements ICommandHandler<TestCommand, TestCommand> {
				async handle(command: TestCommand): Promise<TestCommand> {
					return command;
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
				async handle(event: TestEvent): Promise<void> {}
			}

			tmick.autoScanAndRegisters().initialize();
			const debugInfo = tmick.getDebugInfo();

			expect(debugInfo.serviceClassesRegisteredForScan).toContain('TestCommandHandler');
			expect(debugInfo.serviceClassesRegisteredForScan).toContain('TestQueryHandler');
			expect(debugInfo.serviceClassesRegisteredForScan).toContain('TestEventHandler');
		});

		it('should execute commands', async () => {
			@CommandHandler(TestCommand)
			class TestCommandHandler implements ICommandHandler<TestCommand, TestCommand> {
				async handle(command: TestCommand): Promise<TestCommand> {
					return command;
				}
			}

			tmick.autoScanAndRegisters().initialize();

			const command = new TestCommand('test-data');
			const response = await tmick.executeCommand(command);

			expect(response).toBe(command);
		});

		it('should execute queries', async () => {
			@QueryHandler(TestQuery)
			class TestQueryHandler implements IQueryHandler<TestQuery, TestQuery> {
				async handle(query: TestQuery): Promise<TestQuery> {
					return query;
				}
			}

			tmick.autoScanAndRegisters().initialize();

			const query = new TestQuery('test-data');
			const result = await tmick.executeQuery(query);

			expect(result).toBe(query);
		});

		it('should dispatch events', async () => {
			let called = false;

			@EventHandler(TestEvent)
			class TestEventHandler implements IDomainEventHandler<TestEvent> {
				async handle(event: TestEvent): Promise<void> {
					called = true;
				}
			}

			tmick.autoScanAndRegisters().initialize();

			const event = new TestEvent('test-data');
			await tmick.dispatchEvents([event]);

			expect(called).toBe(true);
		});

		it('should throw error when not initialized', async () => {
			const command = new TestCommand('test-data');

			await expect(tmick.executeCommand(command)).rejects.toThrow('Tmick Framework not initialized. Call initialize() first.');
		});

		it('should throw error when already initialized', () => {
			tmick.autoScanAndRegisters().initialize();

			expect(() => tmick.initialize()).toThrow('Tmick Framework already initialized.');
		});

		it('should register services with fluent interface', () => {
			const testInstance = new TestService();

			tmick
				.registerValue('testService', testInstance)
				.registerByClass(TestTransientService)
				.registerFactory('factoryService', () => new TestService())
				.autoScanAndRegisters()
				.initialize();

			const service = tmick.get<TestService>('testService');
			expect(service).toBe(testInstance);
		});

		it('should provide container access', () => {
			tmick.autoScanAndRegisters().initialize();

			const container = tmick.getContainer();
			expect(container).toBeDefined();
		});

		it('should provide comprehensive debug info', () => {
			tmick.autoScanAndRegisters().initialize();

			const debugInfo = tmick.getDebugInfo();
			expect(debugInfo).toHaveProperty('registeredServices');
			expect(debugInfo).toHaveProperty('handlerRegistrations');
			expect(debugInfo).toHaveProperty('serviceClassesRegisteredForScan');
			expect(debugInfo).toHaveProperty('initialized');
			expect(debugInfo).toHaveProperty('containerInfo');
			expect(debugInfo.initialized).toBe(true);
		});

		it('should dispose properly', () => {
			tmick.autoScanAndRegisters().initialize();
			tmick.dispose();

			const debugInfo = tmick.getDebugInfo();
			expect(debugInfo.initialized).toBe(false);
			expect(debugInfo.registeredServices).toHaveLength(0);
		});
	});

	describe('Token Support', () => {
		it('should work with Token identifiers', () => {
			const TEST_TOKEN = new Token<TestService>('TestService');
			tmick.registerValue(TEST_TOKEN, new TestService());
			tmick.autoScanAndRegisters().initialize();

			const service = tmick.get(TEST_TOKEN);
			expect(service).toBeInstanceOf(TestService);
		});

		it('should resolve dependencies using tokens', () => {
			tmick.registerValue(TEST_REPOSITORY_TOKEN, new TestRepository());
			tmick.autoScanAndRegisters().initialize();

			const service = tmick.get(ServiceWithDependency);
			expect(service.getInfo()).toBe('repository-data-test-value');
		});
	});

	describe('Error Handling', () => {
		it('should provide meaningful error messages for missing services', () => {
			tmick.autoScanAndRegisters().initialize();

			expect(() => tmick.get('NonExistentService')).toThrow("Service 'NonExistentService' not registered.");
		});
	});

	describe('Lifecycle Management', () => {
		it('should respect singleton lifecycle', () => {
			tmick.registerByClass(TestService, true);
			tmick.autoScanAndRegisters().initialize();

			const instance1 = tmick.get(TestService);
			const instance2 = tmick.get(TestService);
			expect(instance1).toBe(instance2);
		});

		it('should respect transient lifecycle', () => {
			tmick.registerByClass(TestTransientService, false);
			tmick.autoScanAndRegisters().initialize();

			const instance1 = tmick.get(TestTransientService);
			const instance2 = tmick.get(TestTransientService);
			expect(instance1).not.toBe(instance2);
		});
	});
});
