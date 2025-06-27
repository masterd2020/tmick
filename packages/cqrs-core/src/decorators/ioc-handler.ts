import { ServiceConstructor, ServiceIdentifier, InjectableOptions } from '../types';
import { HandlerRegistry } from '../registry/handler-registry';

/**
 * Decorator to mark a class as a service that can be injected.
 * Optionally accepts a ServiceIdentifier to register the service under a specific ID.
 * If no ID is provided, the class constructor itself is used as the identifier.
 * It also registers the class with HandlerRegistry for auto-scanning by Tmick.
 * Lifecycle (singleton/transient) is determined by @Singleton/@Transient decorators.
 *
 * @param optionsOrIdentifier An optional ServiceIdentifier or InjectableOptions object.
 */
export function Injectable(optionsOrIdentifier: ServiceIdentifier<any> | InjectableOptions = {}) {
	return function <T extends ServiceConstructor<any>>(constructor: T) {
		let identifier: ServiceIdentifier<any>;

		if (typeof optionsOrIdentifier === 'object' && optionsOrIdentifier !== null && !('prototype' in optionsOrIdentifier)) {
			// It's an InjectableOptions object
			const opts = optionsOrIdentifier as InjectableOptions;
			identifier = opts.id || constructor;
		} else {
			// It's a ServiceIdentifier or empty object, use it directly or fallback to constructor
			identifier = (optionsOrIdentifier as ServiceIdentifier<any>) || constructor;
		}

		// Default to singleton if no explicit lifecycle decorator is applied
		let singleton = true;
		const lifecycleMetadata = Reflect.getMetadata('cqrs:lifecycle', constructor);
		if (lifecycleMetadata !== undefined && lifecycleMetadata.singleton !== undefined) {
			singleton = lifecycleMetadata.singleton;
		}

		// Define metadata that Tmick's autoScanAndRegisters will use
		Reflect.defineMetadata(
			'cqrs:injectable-service', // Metadata key for auto-registration
			{
				id: identifier,
				singleton: singleton,
			},
			constructor
		);

		// Register this class with HandlerRegistry so Tmick can discover it for auto-registration
		HandlerRegistry.registerServiceClass(constructor);

		return constructor;
	};
}

/**
 * Decorator to mark an injectable service as a singleton.
 * Should be used in conjunction with @Injectable.
 * Classes decorated with @Injectable are singleton by default if no other lifecycle decorator is used.
 */
export function Singleton() {
	return function <T extends ServiceConstructor<any>>(constructor: T) {
		Reflect.defineMetadata('cqrs:lifecycle', { singleton: true }, constructor);
	};
}

/**
 * Decorator to mark an injectable service as transient (a new instance per resolution).
 * Should be used in conjunction with @Injectable.
 */
export function Transient() {
	return function <T extends ServiceConstructor<any>>(constructor: T) {
		Reflect.defineMetadata('cqrs:lifecycle', { singleton: false }, constructor);
	};
}

/**
 * Decorator for constructor parameters to explicitly define a dependency.
 * This is used when TypeScript's emit decorator metadata isn't sufficient
 * (e.g., for interface tokens, primitives, or when explicit control is desired).
 *
 * @param identifier The ServiceIdentifier of the dependency to inject.
 */
export function Inject(identifier: ServiceIdentifier<any>) {
	return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
		const existingDeps = Reflect.getMetadata('cqrs:param-dependencies', target) || [];
		if (existingDeps.length <= parameterIndex) {
			existingDeps.length = parameterIndex + 1; // Ensure array size can accommodate index
		}

		existingDeps[parameterIndex] = identifier;
		Reflect.defineMetadata('cqrs:param-dependencies', existingDeps, target);
	};
}
