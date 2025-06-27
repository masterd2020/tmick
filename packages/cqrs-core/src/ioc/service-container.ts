import { ServiceIdentifier, ServiceFactory, ServiceConstructor, IServiceContainer, ICustomContainer } from '../types';
import { CustomContainer } from './custom-container';

/**
 * Implements the public-facing IServiceContainer interface,
 * acting as an abstraction layer over the internal CustomContainer.
 * This class is what application code interacts with for IoC operations.
 */
export class CustomServiceContainer implements IServiceContainer {
	private container: ICustomContainer;

	constructor() {
		this.container = new CustomContainer();
	}

	/**
	 * Registers a service using a factory function.
	 * @param identifier The unique identifier for the service.
	 * @param factory The factory function to create the service instance.
	 * @param singleton Whether the service should be a singleton (default: true).
	 */
	registerFactory<T>(identifier: ServiceIdentifier<T>, factory: ServiceFactory<T>, singleton = true): void {
		this.container.registerFactory(identifier, factory, singleton);
	}

	/**
	 * Registers a pre-existing instance as a service (always a singleton).
	 * @param identifier The unique identifier for the service.
	 * @param instance The pre-existing instance to register.
	 */
	registerValue<T>(identifier: ServiceIdentifier<T>, instance: T): void {
		this.container.registerInstance(identifier, instance);
	}

	/**
	 * Registers a service using its constructor. Dependencies will be resolved automatically.
	 * @param identifier The unique identifier for the service.
	 * @param constructor The constructor function of the service class.
	 * @param singleton Whether the service should be a singleton (default: true).
	 * @param canonicalDependencies Pre-resolved canonical dependencies for the constructor.
	 */
	registerConstructor<T>(identifier: ServiceIdentifier<T>, constructor: ServiceConstructor<T>, singleton = true, canonicalDependencies?: ServiceIdentifier[]): void {
		this.container.registerConstructor(identifier, constructor, singleton, canonicalDependencies);
	}

	/**
	 * Registers a class directly by its constructor, primarily for convenience.
	 * It will resolve metadata dependencies automatically.
	 * @param constructor The constructor function of the service class.
	 * @param singleton Whether the service should be a singleton (default: true).
	 */
	registerByClass<T>(constructor: ServiceConstructor<T>, singleton = true): void {
		const metadataDependencies = this.container.getMetadataDependencies(constructor);
		// Pre-resolve metadata dependencies to their canonical identifiers once at registration
		const canonicalDependencies = metadataDependencies.map((dep) => this.container.getCanonicalIdentifier(dep));
		this.container.registerConstructor(constructor, constructor, singleton, canonicalDependencies);
	}

	/**
	 * Retrieves a service instance from the container.
	 * @param identifier The unique identifier of the service to retrieve.
	 * @returns The service instance.
	 */
	get<T>(identifier: ServiceIdentifier<T>): T {
		return this.container.get<T>(identifier);
	}

	/**
	 * Checks if a service is registered in the container.
	 * @param identifier The unique identifier of the service.
	 * @returns True if the service is registered, false otherwise.
	 */
	has(identifier: ServiceIdentifier<any>): boolean {
		return this.container.has(identifier);
	}

	/**
	 * Clears all registered services and cached instances.
	 */
	clear(): void {
		this.container.clear();
	}

	/**
	 * Gets a list of all registered service identifiers (names).
	 * @returns An array of string identifiers.
	 */
	getRegisteredServices(): string[] {
		return this.container.getDebugInfo().registeredServiceIdentifiers;
	}

	/**
	 * Provides debug information about the underlying container.
	 * @returns Debug information including registered services and cache size.
	 */
	getContainerDebugInfo() {
		return this.container.getDebugInfo();
	}

	/**
	 * Exposes the underlying container's method to get dependency metadata from a class.
	 * This is primarily used by the `Tmick` class during auto-scanning.
	 * @param constructor The service constructor.
	 * @returns An array of ServiceIdentifiers representing the constructor's dependencies.
	 */
	public getMetadataDependencies(constructor: ServiceConstructor<any>): ServiceIdentifier[] {
		return this.container.getMetadataDependencies(constructor);
	}

	/**
	 * Exposes the underlying container's method to get the canonical identifier for a service.
	 * This is primarily used by the `Tmick` class during auto-scanning.
	 * @param identifier The service identifier.
	 * @returns The canonical ServiceIdentifier.
	 */
	public getCanonicalIdentifier<T>(identifier: ServiceIdentifier<T>): ServiceIdentifier<T> {
		return this.container.getCanonicalIdentifier(identifier);
	}
}
