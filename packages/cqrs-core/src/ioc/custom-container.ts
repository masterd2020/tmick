import {
	ServiceIdentifier,
	ServiceFactory,
	ServiceConstructor,
	Token,
	ICustomContainer,
	FactoryServiceDescriptor,
	InstanceServiceDescriptor,
	ConstructorServiceDescriptor,
	ServiceDescriptor,
} from '../types';

/**
 * Implements the core logic of the IoC container, handling registration and resolution.
 * This class is an internal component of the framework.
 */
export class CustomContainer implements ICustomContainer {
	// Stores service configurations by their primary ServiceIdentifier
	private services = new Map<ServiceIdentifier<any>, ServiceDescriptor<any>>();

	// Cache for singleton instances
	private instances = new Map<ServiceIdentifier<any>, any>();

	// Maps string names to their actual ServiceIdentifier (Token or Constructor)
	private stringToIdentifierMap = new Map<string, ServiceIdentifier<any>>();

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	constructor() {}

	/**
	 * Helper to get the canonical identifier. If a string is provided,
	 * it tries to find its mapped Token or Constructor. If not found,
	 * it treats the string itself as the identifier.
	 */
	public getCanonicalIdentifier<T>(identifier: ServiceIdentifier<T>): ServiceIdentifier<T> {
		if (typeof identifier === 'string') {
			return (this.stringToIdentifierMap.get(identifier) as ServiceIdentifier<T>) || identifier;
		}

		return identifier;
	}

	/**
	 * Ensures a string identifier is mapped to a Token if it's not already
	 * mapped to a class constructor. This helps in consistent lookup.
	 */
	private addIdentifierMapping<T>(identifier: ServiceIdentifier<T>, primaryIdentifier?: ServiceIdentifier<T>): void {
		if (typeof identifier === 'string') {
			if (!this.stringToIdentifierMap.has(identifier)) {
				this.stringToIdentifierMap.set(identifier, primaryIdentifier || new Token<T>(identifier));
			}
		} else if (identifier instanceof Token) {
			if (!this.stringToIdentifierMap.has(identifier.name)) {
				this.stringToIdentifierMap.set(identifier.name, identifier);
			}
		} else if (typeof identifier === 'function' && identifier.prototype && identifier.prototype.constructor) {
			if (!this.stringToIdentifierMap.has(identifier.name)) {
				this.stringToIdentifierMap.set(identifier.name, identifier);
			}
		}
	}

	/**
	 * Registers a service using a factory function.
	 * @param identifier The unique identifier for the service.
	 * @param factory The factory function to create the service instance.
	 * @param singleton Whether the service should be a singleton (default: true).
	 */
	registerFactory<T>(identifier: ServiceIdentifier<T>, factory: ServiceFactory<T>, singleton = true): void {
		this.addIdentifierMapping(identifier);

		const canonicalIdentifier = this.getCanonicalIdentifier(identifier);
		if (this.services.has(canonicalIdentifier)) {
			console.warn(`Service '${this.getIdentifierName(identifier)}' already registered. Overwriting.`);
		}

		this.services.set(canonicalIdentifier, { identifier: canonicalIdentifier, factory, singleton } as FactoryServiceDescriptor<T>);
		this.instances.delete(canonicalIdentifier); // Clear old singleton instance if re-registering
	}

	/**
	 * Registers a service using its constructor. Dependencies will be resolved automatically.
	 * `canonicalDependencies` are pre-resolved dependencies, typically from decorator metadata.
	 * @param identifier The unique identifier for the service.
	 * @param constructor The constructor function of the service class.
	 * @param singleton Whether the service should be a singleton (default: true).
	 * @param canonicalDependencies Pre-resolved dependencies for the constructor.
	 */
	registerConstructor<T>(identifier: ServiceIdentifier<T>, constructor: ServiceConstructor<T>, singleton = true, canonicalDependencies?: ServiceIdentifier[]): void {
		this.addIdentifierMapping(identifier, constructor); // Map string identifier to the constructor
		const canonicalIdentifier = this.getCanonicalIdentifier(identifier);

		if (this.services.has(canonicalIdentifier)) {
			console.warn(`Service '${this.getIdentifierName(identifier)}' already registered. Overwriting.`);
		}

		this.services.set(canonicalIdentifier, {
			identifier: canonicalIdentifier,
			constructor,
			singleton,
			canonicalDependencies, // Store pre-resolved canonical dependencies
		} as ConstructorServiceDescriptor<T>);
		this.instances.delete(canonicalIdentifier); // Clear old singleton instance if re-registering
	}

	/**
	 * Registers a pre-existing instance as a service (always a singleton).
	 * @param identifier The unique identifier for the service.
	 * @param instance The pre-existing instance to register.
	 */
	registerInstance<T>(identifier: ServiceIdentifier<T>, instance: T): void {
		this.addIdentifierMapping(identifier);
		const canonicalIdentifier = this.getCanonicalIdentifier(identifier);

		if (this.services.has(canonicalIdentifier)) {
			console.warn(`Service '${this.getIdentifierName(identifier)}' already registered. Overwriting.`);
		}

		this.services.set(canonicalIdentifier, { identifier: canonicalIdentifier, instance, singleton: true } as InstanceServiceDescriptor<T>);
		this.instances.set(canonicalIdentifier, instance); // Pre-fill instance cache
	}

	/**
	 * Retrieves a service instance from the container.
	 * @param identifier The unique identifier of the service to retrieve.
	 * @returns The service instance.
	 * @throws Error if the service is not registered.
	 */
	get<T>(identifier: ServiceIdentifier<T>): T {
		const canonicalIdentifier = this.getCanonicalIdentifier(identifier);

		// Check if instance is already cached (for singletons)
		if (this.instances.has(canonicalIdentifier)) {
			return this.instances.get(canonicalIdentifier) as T;
		}

		const descriptor = this.services.get(canonicalIdentifier);
		if (!descriptor) {
			// As a fallback, try auto-registration if it's a class not yet explicitly registered.
			// In a well-configured app using Tmick.autoScanAndRegisters, this path should be rare.
			const autoRegisteredService = this.handleAutoRegistration(identifier);
			if (autoRegisteredService) {
				return autoRegisteredService;
			}

			throw new Error(`Service '${this.getIdentifierName(identifier)}' not registered.`);
		}

		const instance = this.resolveService(descriptor);

		if (descriptor.singleton) {
			this.instances.set(canonicalIdentifier, instance);
		}

		return instance;
	}

	/**
	 * Checks if a service is registered in the container.
	 * @param identifier The unique identifier of the service.
	 * @returns True if the service is registered, false otherwise.
	 */
	has<T>(identifier: ServiceIdentifier<T>): boolean {
		const canonicalIdentifier = this.getCanonicalIdentifier(identifier);
		return this.services.has(canonicalIdentifier) || this.stringToIdentifierMap.has(this.getIdentifierName(identifier));
	}

	/**
	 * Clears all registered services and cached instances from the container.
	 */
	clear(): void {
		this.services.clear();
		this.instances.clear();
		this.stringToIdentifierMap.clear();
	}

	/**
	 * Attempts to auto-register a class if it's decorated with @Injectable
	 * and not yet registered. This is a fallback; primary auto-registration
	 * is handled by `Tmick.autoScanAndRegisters`.
	 * @param identifier The identifier (potentially a class constructor) to auto-register.
	 * @returns The resolved service instance, or null if not auto-registered.
	 */
	private handleAutoRegistration<T>(identifier: ServiceIdentifier<T>): T | null {
		if (typeof identifier === 'function' && identifier.prototype && identifier.prototype.constructor) {
			const constructorIdentifier = identifier as ServiceConstructor<T>;
			const serviceMetadata = Reflect.getMetadata('cqrs:injectable-service', constructorIdentifier);

			if (serviceMetadata) {
				const { singleton = true, id } = serviceMetadata;
				const serviceId = id || constructorIdentifier;

				const metadataDependencies = this.getMetadataDependencies(constructorIdentifier);
				const canonicalDependencies = metadataDependencies.map((dep) => this.getCanonicalIdentifier(dep));

				const autoDescriptor: ConstructorServiceDescriptor<T> = {
					identifier: serviceId,
					constructor: constructorIdentifier,
					singleton,
					canonicalDependencies,
				};

				this.services.set(serviceId, autoDescriptor);
				if (serviceId !== constructorIdentifier) {
					this.services.set(constructorIdentifier, autoDescriptor);
				}

				const instance = this.resolveService(autoDescriptor);

				if (singleton) {
					this.instances.set(serviceId, instance);
					if (serviceId !== constructorIdentifier) {
						this.instances.set(constructorIdentifier, instance);
					}
				}
				return instance;
			}
		}
		return null;
	}

	/**
	 * Resolves a service instance based on its descriptor (factory, constructor, or instance).
	 * @param descriptor The service descriptor.
	 * @returns The resolved service instance.
	 * @throws Error if the descriptor is invalid.
	 */
	private resolveService<T>(descriptor: ServiceDescriptor<T>): T {
		if ('instance' in descriptor && descriptor.instance !== undefined) {
			return descriptor.instance;
		}

		if ('factory' in descriptor && descriptor.factory !== undefined) {
			return descriptor.factory(this);
		}

		if ('constructor' in descriptor && descriptor.constructor !== undefined) {
			const constructorDescriptor = descriptor as ConstructorServiceDescriptor<T>;
			// Dependencies are retrieved directly from the descriptor's `canonicalDependencies` array,
			// which was pre-populated at registration time.
			const dependencies = this.resolveDependencies(constructorDescriptor);
			return new constructorDescriptor.constructor(...dependencies);
		}

		throw new Error(`Cannot resolve service '${this.getIdentifierName(descriptor.identifier)}': No factory, constructor, or instance provided.`);
	}

	/**
	 * Resolves the dependencies for a constructor-based service.
	 * It uses the pre-resolved `canonicalDependencies` stored in the descriptor.
	 * @param descriptor The constructor service descriptor.
	 * @returns An array of resolved dependency instances.
	 */
	private resolveDependencies<T>(descriptor: ConstructorServiceDescriptor<T>): any[] {
		if (!descriptor.canonicalDependencies || descriptor.canonicalDependencies.length === 0) {
			return [];
		}
		return descriptor.canonicalDependencies.map((depIdentifier) => this.get(depIdentifier));
	}

	/**
	 * Retrieves dependency metadata from a class constructor, typically set by @Inject decorators.
	 * This method is used during the initial auto-scanning and registration process.
	 * @param constructor The service constructor.
	 * @returns An array of ServiceIdentifiers representing the constructor's dependencies.
	 */
	public getMetadataDependencies(constructor: ServiceConstructor<any>): ServiceIdentifier[] {
		const paramDeps = Reflect.getMetadata('cqrs:param-dependencies', constructor) || [];
		if (paramDeps.length > 0) {
			return paramDeps;
		}

		const classDeps = Reflect.getMetadata('cqrs:class-dependencies', constructor);
		if (classDeps) {
			return classDeps;
		}

		const stringDeps = Reflect.getMetadata('cqrs:dependencies', constructor) || [];
		if (stringDeps.length > 0) {
			return stringDeps;
		}
		return [];
	}

	/**
	 * Helper to get a human-readable name for a ServiceIdentifier.
	 * @param identifier The service identifier.
	 * @returns The name as a string.
	 */
	private getIdentifierName(identifier: ServiceIdentifier<any>): string {
		if (typeof identifier === 'string') {
			return identifier;
		}

		if (identifier instanceof Token) {
			return identifier.name;
		}

		if (typeof identifier === 'function' && identifier.prototype && identifier.prototype.constructor) {
			return identifier.name;
		}

		return 'Unknown';
	}

	/**
	 * Provides debug information about the container's state.
	 * @returns An object containing registered service identifiers and instance cache size.
	 */
	getDebugInfo(): { registeredServiceIdentifiers: string[]; instanceCacheSize: number } {
		const registeredServiceIdentifiers = Array.from(this.services.keys()).map(this.getIdentifierName);
		return {
			registeredServiceIdentifiers,
			instanceCacheSize: this.instances.size,
		};
	}
}
