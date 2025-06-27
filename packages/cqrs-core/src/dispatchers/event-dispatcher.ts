import { Injectable, Singleton, Inject } from '../decorators/ioc-handler';
import { IEventDispatcher, IDomainEvent, IServiceContainer, IDomainEventHandler, ServiceIdentifier } from '../types';
import { ISERVICECONTAINER_TOKEN } from '../tokens';

/**
 * Implements the Event Dispatcher, responsible for publishing domain events to their registered handlers.
 * Supports multiple handlers per event type.
 * Marked as @Injectable and @Singleton for dependency injection.
 */
@Injectable()
@Singleton()
export class EventDispatcher implements IEventDispatcher {
	// Maps event names (strings) to an array of their handler ServiceIdentifiers
	private handlers = new Map<string, ServiceIdentifier<any>[]>();

	/**
	 * Constructs an EventDispatcher, injecting the IServiceContainer to resolve handlers.
	 * @param container The IoC container instance.
	 */
	constructor(@Inject(ISERVICECONTAINER_TOKEN) private container: IServiceContainer) {}

	/**
	 * Registers a handler for a specific event type.
	 * Multiple handlers can be registered for the same event.
	 * @param eventName The string name of the event (typically `EventClass.name`).
	 * @param handlerIdentifier The ServiceIdentifier of the event handler class.
	 */
	registerHandler(eventName: string, handlerIdentifier: ServiceIdentifier<any>): void {
		const existingHandlers = this.handlers.get(eventName) || [];
		existingHandlers.push(handlerIdentifier);
		this.handlers.set(eventName, existingHandlers);
	}

	/**
	 * Dispatches a list of domain events to all their registered handlers.
	 * Each event is processed in order, and all handlers for a given event
	 * are executed concurrently.
	 * @param events An array of domain event objects to dispatch.
	 */
	async dispatch(events: IDomainEvent[]): Promise<void> {
		for (const event of events) {
			const eventName = event.constructor.name;
			const handlerIdentifiers = this.handlers.get(eventName) || [];

			// Execute all handlers for the current event concurrently
			const promises = handlerIdentifiers.map(async (identifier) => {
				// Resolve the handler instance from the container and execute its handle method
				const handler = this.container.get<IDomainEventHandler<typeof event>>(identifier);
				return handler.handle(event);
			});

			// Wait for all handlers for the current event to complete
			await Promise.all(promises);
		}
	}
}
