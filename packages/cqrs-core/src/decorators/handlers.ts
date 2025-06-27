import { ServiceConstructor, ICommand, IQuery, IDomainEvent } from '../types';
import { HandlerRegistry } from '../registry/handler-registry';
import { Injectable } from './ioc-handler';

/**
 * Decorator to register a class as a Command Handler.
 * It implicitly marks the handler class as @Injectable
 *
 * @param commandClass The class of the command this handler processes.
 */
export function CommandHandler(commandClass: ServiceConstructor<ICommand>) {
	return function (target: ServiceConstructor<any>) {
		const commandName = commandClass.name;
		HandlerRegistry.register(target, commandName, 'command');

		// Ensure handler classes are also registered for auto-scanning by Tmick
		// This is important because @Injectable is not explicitly used on the handler itself
		if (!Reflect.hasMetadata('cqrs:injectable-service', target)) {
			// Apply a default @Injectable behavior (defaulting to singleton)
			Injectable()(target);
		}
	};
}

/**
 * Decorator to register a class as a Query Handler.
 * It implicitly marks the handler class as @Injectable
 *
 * @param queryClass The class of the query this handler processes.
 */
export function QueryHandler(queryClass: ServiceConstructor<IQuery<any>>) {
	return function (target: ServiceConstructor<any>) {
		const queryName = queryClass.name;
		HandlerRegistry.register(target, queryName, 'query');

		// Ensure handler classes are also registered for auto-scanning by Tmick
		if (!Reflect.hasMetadata('cqrs:injectable-service', target)) {
			Injectable()(target);
		}
	};
}

/**
 * Decorator to register a class as an Event Handler.
 * It implicitly marks the handler class as @Injectable
 *
 * @param eventClass The class of the event this handler processes.
 */
export function EventHandler(eventClass: ServiceConstructor<IDomainEvent>) {
	return function (target: ServiceConstructor<any>) {
		const eventName = eventClass.name;
		HandlerRegistry.register(target, eventName, 'event');

		// Ensure handler classes are also registered for auto-scanning by Tmick
		if (!Reflect.hasMetadata('cqrs:injectable-service', target)) {
			Injectable()(target);
		}
	};
}
