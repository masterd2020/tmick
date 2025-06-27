import { Injectable, Singleton, Inject } from '../decorators/ioc-handler';
import { IQueryDispatcher, IQuery, IServiceContainer, IQueryHandler, ServiceIdentifier } from '../types';
import { ISERVICECONTAINER_TOKEN } from '../tokens';

/**
 * Implements the Query Dispatcher, responsible for routing queries to their registered handlers.
 * Marked as @Injectable and @Singleton for dependency injection.
 */
@Injectable()
@Singleton()
export class QueryDispatcher implements IQueryDispatcher {
	// Maps query names (strings) to their handler ServiceIdentifiers
	private handlers = new Map<string, ServiceIdentifier<any>>();

	/**
	 * Constructs a QueryDispatcher, injecting the IServiceContainer to resolve handlers.
	 * @param container The IoC container instance.
	 */
	constructor(@Inject(ISERVICECONTAINER_TOKEN) private container: IServiceContainer) {}

	/**
	 * Registers a handler for a specific query type.
	 * @param queryName The string name of the query (typically `QueryClass.name`).
	 * @param handlerIdentifier The ServiceIdentifier of the query handler class.
	 * @throws Error if a handler is already registered for the given query.
	 */
	registerHandler(queryName: string, handlerIdentifier: ServiceIdentifier<any>): void {
		if (this.handlers.has(queryName)) {
			throw new Error(`Query handler for '${queryName}' already registered.`);
		}
		this.handlers.set(queryName, handlerIdentifier);
	}

	/**
	 * Dispatches a query to its registered handler and returns the result.
	 * @param query The query object to dispatch.
	 * @returns A Promise that resolves with the result of the query.
	 * @throws Error if no handler is registered for the query.
	 */
	async dispatch<TQuery extends IQuery<TResult>, TResult>(query: TQuery): Promise<TResult> {
		const queryName = query.constructor.name;
		const handlerIdentifier = this.handlers.get(queryName);

		if (!handlerIdentifier) {
			throw new Error(`No handler registered for query '${queryName}'.`);
		}

		// Resolve the handler instance from the container and execute its handle method
		const handler = this.container.get<IQueryHandler<TQuery, TResult>>(handlerIdentifier);
		return await handler.handle(query);
	}
}
