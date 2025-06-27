/**
 * Represents a unique identifier for a service in the IoC container.
 * Can be a string, a class constructor, or a Token instance.
 */
export type ServiceIdentifier<T = any> = string | (new (...args: any[]) => T) | Token<T>;

/**
 * A factory function that creates an instance of a service.
 */
export type ServiceFactory<T> = (container: ICustomContainer) => T;

/**
 * Constructor type for services.
 */
export type ServiceConstructor<T> = new (...args: any[]) => T;

/**
 * A unique token used to identify services, especially for interfaces
 * or when string names might clash.
 */
export class Token<T> {
	public readonly name: string;
	constructor(name: string) {
		this.name = name;
	}
}

// CQRS Interfaces
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ICommand {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-interface
export interface IQuery<TResult> {}

export interface IDomainEvent {
	readonly occurredOn: Date;
	readonly eventVersion: number;
	readonly aggregateId: string;
}

export interface ICommandHandler<TCommand extends ICommand, TResult> {
	handle(command: TCommand): Promise<TResult>;
}

export interface IQueryHandler<TQuery extends IQuery<TResult>, TResult> {
	handle(query: TQuery): Promise<TResult>;
}

export interface IDomainEventHandler<TEvent extends IDomainEvent> {
	handle(event: TEvent): Promise<void>;
}

/**
 * Represents the internal configuration for a service in the container.
 * Using union types where each type has its specific required property.
 */
export interface FactoryServiceDescriptor<T> {
	identifier: ServiceIdentifier<T>;
	factory: ServiceFactory<T>; // This property is required for a factory descriptor
	singleton: boolean;
}

export interface ConstructorServiceDescriptor<T> {
	identifier: ServiceIdentifier<T>;
	constructor: ServiceConstructor<T>; // This property is required for a constructor descriptor
	singleton: boolean;
	canonicalDependencies?: ServiceIdentifier[]; // Store canonical dependency identifiers here
}

export interface InstanceServiceDescriptor<T> {
	identifier: ServiceIdentifier<T>;
	instance: T; // This property is required for an instance descriptor
	singleton: true; // Always true for instances
}

// Union type for ServiceDescriptor
export type ServiceDescriptor<T> = FactoryServiceDescriptor<T> | ConstructorServiceDescriptor<T> | InstanceServiceDescriptor<T>;

/**
 * Internal interface for the low-level IoC container,
 * used by CustomServiceContainer.
 */
export interface ICustomContainer {
	registerFactory<T>(identifier: ServiceIdentifier<T>, factory: ServiceFactory<T>, singleton?: boolean): void;
	registerConstructor<T>(identifier: ServiceIdentifier<T>, constructor: ServiceConstructor<T>, singleton?: boolean, canonicalDependencies?: ServiceIdentifier[]): void;
	registerInstance<T>(identifier: ServiceIdentifier<T>, instance: T): void;
	get<T>(identifier: ServiceIdentifier<T>): T;
	has<T>(identifier: ServiceIdentifier<T>): boolean;
	clear(): void;
	getDebugInfo(): { registeredServiceIdentifiers: string[]; instanceCacheSize: number };
	getMetadataDependencies(constructor: ServiceConstructor<any>): ServiceIdentifier[];
	getCanonicalIdentifier<T>(identifier: ServiceIdentifier<T>): ServiceIdentifier<T>;
}

/**
 * Public interface for the framework's IoC container abstraction.
 */
export interface IServiceContainer {
	registerFactory<T>(identifier: ServiceIdentifier<T>, factory: ServiceFactory<T>, singleton?: boolean): void;
	registerValue<T>(identifier: ServiceIdentifier<T>, instance: T): void;
	registerConstructor<T>(identifier: ServiceIdentifier<T>, constructor: ServiceConstructor<T>, singleton?: boolean, canonicalDependencies?: ServiceIdentifier[]): void;
	registerByClass<T>(constructor: ServiceConstructor<T>, singleton?: boolean): void;
	get<T>(identifier: ServiceIdentifier<T>): T;
	has(identifier: ServiceIdentifier<any>): boolean;
	clear(): void;
	getRegisteredServices(): string[];
	getContainerDebugInfo(): { registeredServiceIdentifiers: string[]; instanceCacheSize: number };
	getMetadataDependencies(constructor: ServiceConstructor<any>): ServiceIdentifier[];
	getCanonicalIdentifier<T>(identifier: ServiceIdentifier<T>): ServiceIdentifier<T>;
}

export interface ICommandDispatcher {
	registerHandler(commandName: string, handlerServiceName: ServiceIdentifier<any>): void;
	dispatch<T extends ICommand>(command: T): Promise<void>;
}

export interface IQueryDispatcher {
	registerHandler(queryName: string, handlerServiceName: ServiceIdentifier<any>): void;
	dispatch<TQuery extends IQuery<TResult>, TResult>(query: TQuery): Promise<TResult>;
}

export interface IEventDispatcher {
	registerHandler(eventName: string, handlerServiceName: ServiceIdentifier<any>): void;
	dispatch(events: IDomainEvent[]): Promise<void>;
}

export interface HandlerRegistration {
	handlerClass: ServiceConstructor<any>;
	targetType: string; // command, query, or event name
	handlerType: 'command' | 'query' | 'event';
}

export interface InjectableOptions {
	id?: ServiceIdentifier<any>; // Optional identifier for the service
}
