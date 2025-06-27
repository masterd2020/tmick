/* eslint-disable indent */
import { ServiceConstructor, HandlerRegistration } from '../types';

/**
 * A static registry for mapping Commands, Queries, and Events to their respective handler classes.
 * Also keeps track of all classes marked with @Injectable (or handler decorators which imply it)
 * for auto-scanning by the Tmick framework.
 */
export class HandlerRegistry {
	private static commandHandlersMap = new Map<string, ServiceConstructor<any>>();
	private static queryHandlersMap = new Map<string, ServiceConstructor<any>>();
	private static eventHandlersMap = new Map<string, ServiceConstructor<any>[]>();
	private static serviceClasses: ServiceConstructor<any>[] = [];

	/**
	 * Registers a handler class for a specific command, query, or event type.
	 * @param handlerClass The class of the handler.
	 * @param targetType The name of the command, query, or event class it handles.
	 * @param handlerType The type of handler ('command', 'query', or 'event').
	 * @throws Error if a command or query handler is already registered for the given type.
	 */
	static register(handlerClass: ServiceConstructor<any>, targetType: string, handlerType: 'command' | 'query' | 'event') {
		switch (handlerType) {
			case 'command':
				if (this.commandHandlersMap.has(targetType)) {
					throw new Error(`Command handler for '${targetType}' already registered.`);
				}
				this.commandHandlersMap.set(targetType, handlerClass);
				break;
			case 'query':
				if (this.queryHandlersMap.has(targetType)) {
					throw new Error(`Query handler for '${targetType}' already registered.`);
				}
				this.queryHandlersMap.set(targetType, handlerClass);
				break;
			case 'event':
				const existingEventHandlers = this.eventHandlersMap.get(targetType) || [];
				existingEventHandlers.push(handlerClass);
				this.eventHandlersMap.set(targetType, existingEventHandlers);
				break;
		}

		// Ensure that any class registered as a handler is also marked as a service class for auto-scanning.
		this.registerServiceClass(handlerClass);
	}

	/**
	 * Registers a class marked with @Injectable for auto-scanning by the framework.
	 * Ensures each class is registered only once.
	 * @param serviceClass The class constructor.
	 */
	static registerServiceClass(serviceClass: ServiceConstructor<any>) {
		if (!this.serviceClasses.includes(serviceClass)) {
			this.serviceClasses.push(serviceClass);
		}
	}

	/**
	 * Retrieves all registered command, query, and event handlers.
	 * @returns An array of HandlerRegistration objects.
	 */
	static getRegistrations(): HandlerRegistration[] {
		const all: HandlerRegistration[] = [];
		this.commandHandlersMap.forEach((handlerClass, targetType) => all.push({ handlerClass, targetType, handlerType: 'command' }));
		this.queryHandlersMap.forEach((handlerClass, targetType) => all.push({ handlerClass, targetType, handlerType: 'query' }));
		this.eventHandlersMap.forEach((handlerClasses, targetType) => handlerClasses.forEach((handlerClass) => all.push({ handlerClass, targetType, handlerType: 'event' })));
		return all;
	}

	/**
	 * Retrieves all classes that have been marked for auto-scanning (e.g., via @Injectable, @CommandHandler).
	 * @returns An array of service class constructors.
	 */
	static getServiceClasses(): ServiceConstructor<any>[] {
		return this.serviceClasses;
	}

	/**
	 * Gets the map of registered command handlers.
	 * @returns A Map where keys are command names (strings) and values are handler constructors.
	 */
	static getCommandHandlersMap(): Map<string, ServiceConstructor<any>> {
		return this.commandHandlersMap;
	}

	/**
	 * Gets the map of registered query handlers.
	 * @returns A Map where keys are query names (strings) and values are handler constructors.
	 */
	static getQueryHandlersMap(): Map<string, ServiceConstructor<any>> {
		return this.queryHandlersMap;
	}

	/**
	 * Gets the map of registered event handlers.
	 * @returns A Map where keys are event names (strings) and values are arrays of handler constructors.
	 */
	static getEventHandlersMap(): Map<string, ServiceConstructor<any>[]> {
		return this.eventHandlersMap;
	}

	/**
	 * Clears all registrations and cached service classes.
	 * Useful for testing or framework reset.
	 */
	static clear() {
		this.commandHandlersMap.clear();
		this.queryHandlersMap.clear();
		this.eventHandlersMap.clear();
		this.serviceClasses = [];
	}
}
