import { Injectable, Singleton, Inject } from '../decorators/ioc-handler';
import { ICommandDispatcher, ICommand, IServiceContainer, ICommandHandler, ServiceIdentifier } from '../types';
import { ISERVICECONTAINER_TOKEN } from '../tokens';

/**
 * Implements the Command Dispatcher, responsible for routing commands to their registered handlers.
 * Marked as @Injectable and @Singleton for dependency injection.
 */
@Injectable()
@Singleton()
export class CommandDispatcher implements ICommandDispatcher {
	// Maps command names (strings) to their handler ServiceIdentifiers
	private handlers = new Map<string, ServiceIdentifier<any>>();

	/**
	 * Constructs a CommandDispatcher, injecting the IServiceContainer to resolve handlers.
	 * @param container The IoC container instance.
	 */
	constructor(@Inject(ISERVICECONTAINER_TOKEN) private container: IServiceContainer) {}

	/**
	 * Registers a handler for a specific command type.
	 * @param commandName The string name of the command (typically `CommandClass.name`).
	 * @param handlerIdentifier The ServiceIdentifier of the command handler class.
	 * @throws Error if a handler is already registered for the given command.
	 */
	registerHandler(commandName: string, handlerIdentifier: ServiceIdentifier<any>): void {
		if (this.handlers.has(commandName)) {
			throw new Error(`Command handler for '${commandName}' already registered.`);
		}
		this.handlers.set(commandName, handlerIdentifier);
	}

	/**
	 * Dispatches a command to its registered handler.
	 * @param command The command object to dispatch.
	 * @throws Error if no handler is registered for the command.
	 */
	async dispatch<T extends ICommand, TResult>(command: T): Promise<TResult> {
		const commandName = command.constructor.name;
		const handlerIdentifier = this.handlers.get(commandName);

		if (!handlerIdentifier) {
			throw new Error(`No handler registered for command '${commandName}'.`);
		}

		// Resolve the handler instance from the container and execute its handle method
		const handler = this.container.get<ICommandHandler<T, TResult>>(handlerIdentifier);
		return await handler.handle(command);
	}
}
