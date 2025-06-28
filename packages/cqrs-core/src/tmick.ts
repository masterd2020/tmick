/* eslint-disable indent */
import { ServiceIdentifier, ServiceFactory, ServiceConstructor, IServiceContainer, ICommand, IQuery, IDomainEvent, ICommandDispatcher, IQueryDispatcher, IEventDispatcher } from './types';
import { CustomServiceContainer } from './ioc/service-container';
import { HandlerRegistry } from './registry/handler-registry';
import { COMMAND_DISPATCHER_TOKEN, QUERY_DISPATCHER_TOKEN, EVENT_DISPATCHER_TOKEN, ISERVICECONTAINER_TOKEN } from './tokens';
import { CommandDispatcher } from './dispatchers/command-dispatcher';
import { QueryDispatcher } from './dispatchers/query-dispatcher';
import { EventDispatcher } from './dispatchers/event-dispatcher';

/**
 * The main entry point and orchestrator for the Tmick framework.
 * It manages the IoC container, auto-registration, and dispatchers for CQRS.
 */
export class Tmick {
	private container: IServiceContainer;
	private commandDispatcher: ICommandDispatcher;
	private queryDispatcher: IQueryDispatcher;
	private eventDispatcher: IEventDispatcher;
	private initialized = false;

	constructor() {
		this.container = new CustomServiceContainer();

		// Register the container itself immediately.
		// This is crucial as other services (like dispatchers) may depend on it.
		this.container.registerValue(ISERVICECONTAINER_TOKEN, this.container);

		// Dispatchers are initialized as null; they will be populated AFTER
		// autoScanAndRegisters is called and they are resolved from the container.
		this.commandDispatcher = null as any; // Using `as any` to allow late assignment
		this.queryDispatcher = null as any;
		this.eventDispatcher = null as any;
	}

	/**
	 * Registers a service using a factory function.
	 * @param identifier The unique identifier for the service.
	 * @param factory The factory function to create the service instance.
	 * @param singleton Whether the service should be a singleton (default: true).
	 * @returns The Tmick instance for chaining.
	 */
	registerFactory<T>(identifier: ServiceIdentifier<T>, factory: ServiceFactory<T>, singleton = true): this {
		this.container.registerFactory(identifier, factory, singleton);
		return this;
	}

	/**
	 * Registers a pre-existing instance as a service (always a singleton).
	 * @param identifier The unique identifier for the service.
	 * @param instance The pre-existing instance to register.
	 * @returns The Tmick instance for chaining.
	 */
	registerValue<T>(identifier: ServiceIdentifier<T>, instance: T): this {
		this.container.registerValue(identifier, instance);
		return this;
	}

	/**
	 * Registers a service using its constructor. Dependencies will be resolved automatically.
	 * @param identifier The unique identifier for the service.
	 * @param constructor The constructor function of the service class.
	 * @param singleton Whether the service should be a singleton (default: true).
	 * @param dependencies Explicitly provided dependencies (optional).
	 * @returns The Tmick instance for chaining.
	 */
	registerConstructor<T>(identifier: ServiceIdentifier<T>, constructor: ServiceConstructor<T>, singleton = true, dependencies: ServiceIdentifier[] = []): this {
		const canonicalDependencies = dependencies.map((dep) => this.container.getCanonicalIdentifier(dep));
		this.container.registerConstructor(identifier, constructor, singleton, canonicalDependencies);
		return this;
	}

	/**
	 * Registers a class directly by its constructor, primarily for convenience.
	 * It will resolve metadata dependencies automatically.
	 * @param constructor The constructor function of the service class.
	 * @param singleton Whether the service should be a singleton (default: true).
	 * @returns The Tmick instance for chaining.
	 */
	registerByClass<T>(constructor: ServiceConstructor<T>, singleton = true): this {
		this.container.registerByClass(constructor, singleton);
		return this;
	}

	/**
	 * Scans all classes registered via decorators (@Injectable, @CommandHandler, etc.)
	 * and automatically registers them with the IoC container.
	 * After services are registered, it configures the Command, Query, and Event Dispatchers.
	 * This is the primary method for setting up the framework.
	 * @returns The Tmick instance for chaining.
	 */
	autoScanAndRegisters(): this {
		// Collect all service classes discovered by Injectable/Handler decorators.
		const allServiceClasses = HandlerRegistry.getServiceClasses();

		// Keep track of processed classes to avoid redundant processing.
		const processedClasses = new Set<ServiceConstructor<any>>();

		for (const serviceClass of allServiceClasses) {
			if (processedClasses.has(serviceClass)) {
				continue;
			}

			const injectableMetadata = Reflect.getMetadata('cqrs:injectable-service', serviceClass);
			// Default to singleton if no explicit lifecycle decorator is present
			const singleton = injectableMetadata?.singleton ?? true;

			// Pre-resolve metadata dependencies for the current class
			const metadataDependencies = this.container.getMetadataDependencies(serviceClass);
			const canonicalDependencies = metadataDependencies.map((dep) => this.container.getCanonicalIdentifier(dep));

			// Register the class with the container using its resolved dependencies.
			this.container.registerConstructor(serviceClass, serviceClass, singleton, canonicalDependencies);

			// If it has a specific identifier from @Injectable({ id: ... }), register it under that too.
			if (injectableMetadata && injectableMetadata.id && injectableMetadata.id !== serviceClass) {
				this.container.registerConstructor(injectableMetadata.id, serviceClass, singleton, canonicalDependencies);
			}

			processedClasses.add(serviceClass);
		}

		// After all services (including dispatchers themselves) are registered in the container,
		// then resolve and configure the dispatchers.
		this.commandDispatcher = this.container.get(CommandDispatcher);
		this.queryDispatcher = this.container.get(QueryDispatcher);
		this.eventDispatcher = this.container.get(EventDispatcher);

		// Also register the dispatcher *instances* by their specific tokens.
		// This allows other parts of the application to inject them using these tokens.
		this.container.registerValue(COMMAND_DISPATCHER_TOKEN, this.commandDispatcher);
		this.container.registerValue(QUERY_DISPATCHER_TOKEN, this.queryDispatcher);
		this.container.registerValue(EVENT_DISPATCHER_TOKEN, this.eventDispatcher);

		// Now, iterate through the HandlerRegistry to configure the dispatchers with their handlers.
		HandlerRegistry.getRegistrations().forEach((registration) => {
			switch (registration.handlerType) {
				case 'command':
					this.commandDispatcher.registerHandler(registration.targetType, registration.handlerClass);
					break;
				case 'query':
					this.queryDispatcher.registerHandler(registration.targetType, registration.handlerClass);
					break;
				case 'event':
					this.eventDispatcher.registerHandler(registration.targetType, registration.handlerClass);
					break;
			}
		});

		return this;
	}

	/**
	 * Initializes the framework. This method should be called after `autoScanAndRegisters`.
	 * @returns The Tmick instance for chaining.
	 * @throws Error if the framework is already initialized.
	 */
	initialize(): this {
		if (this.initialized) {
			throw new Error('Tmick Framework already initialized.');
		}
		this.initialized = true;
		return this;
	}

	/**
	 * Retrieves a service instance from the container.
	 * The framework must be initialized before calling this method.
	 * @param identifier The unique identifier of the service to retrieve.
	 * @returns The service instance.
	 * @throws Error if the framework is not initialized or service not found.
	 */
	get<T>(identifier: ServiceIdentifier<T>): T {
		if (!this.initialized) {
			throw new Error('Tmick Framework not initialized. Call initialize() first.');
		}
		return this.container.get<T>(identifier);
	}

	/**
	 * Executes a command by dispatching it to its registered handler.
	 * The framework must be initialized before calling this method.
	 * @param command The command object to execute.
	 * @returns A Promise that resolves when the command handling is complete.
	 * @throws Error if the framework is not initialized or no handler for the command.
	 */
	async executeCommand<T extends ICommand, TResult>(command: T): Promise<TResult> {
		if (!this.initialized) {
			throw new Error('Tmick Framework not initialized. Call initialize() first.');
		}

		return this.commandDispatcher.dispatch(command);
	}

	/**
	 * Executes a query by dispatching it to its registered handler and returns the result.
	 * The framework must be initialized before calling this method.
	 * @param query The query object to execute.
	 * @returns A Promise that resolves with the result of the query.
	 * @throws Error if the framework is not initialized or no handler for the query.
	 */
	async executeQuery<TQuery extends IQuery<TResult>, TResult>(query: TQuery): Promise<TResult> {
		if (!this.initialized) {
			throw new Error('Tmick Framework not initialized. Call initialize() first.');
		}
		return this.queryDispatcher.dispatch(query);
	}

	/**
	 * Dispatches a list of domain events to their registered handlers.
	 * The framework must be initialized before calling this method.
	 * @param events An array of domain event objects to dispatch.
	 * @returns A Promise that resolves when all event handling is complete.
	 * @throws Error if the framework is not initialized.
	 */
	async dispatchEvents(events: IDomainEvent[]): Promise<void> {
		if (!this.initialized) {
			throw new Error('Tmick Framework not initialized. Call initialize() first.');
		}
		return this.eventDispatcher.dispatch(events);
	}

	/**
	 * Retrieves the underlying IServiceContainer instance.
	 * @returns The IServiceContainer instance.
	 * @throws Error if the framework is not initialized.
	 */
	getContainer(): IServiceContainer {
		if (!this.initialized) {
			throw new Error('Tmick Framework not initialized. Call initialize() first.');
		}
		return this.container;
	}

	/**
	 * Provides comprehensive debug information about the framework's state.
	 * @returns An object containing various debug details.
	 */
	getDebugInfo() {
		const containerInfo = this.container.getContainerDebugInfo();
		return {
			registeredServices: this.container.getRegisteredServices(),
			handlerRegistrations: HandlerRegistry.getRegistrations(),
			serviceClassesRegisteredForScan: HandlerRegistry.getServiceClasses().map((cls) => cls.name),
			initialized: this.initialized,
			containerInfo,
		};
	}

	/**
	 * Disposes of the framework, clearing all registrations and resetting its state.
	 * Useful for testing or shutting down the application gracefully.
	 */
	dispose(): void {
		this.container.clear();
		HandlerRegistry.clear();
		this.initialized = false;
	}
}
