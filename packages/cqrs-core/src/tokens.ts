import { Token, ICommandDispatcher, IEventDispatcher, IQueryDispatcher, IServiceContainer } from './types';

// Tokens for framework's core services
export const EVENT_DISPATCHER_TOKEN = new Token<IEventDispatcher>('IEventDispatcher');
export const COMMAND_DISPATCHER_TOKEN = new Token<ICommandDispatcher>('ICommandDispatcher');
export const QUERY_DISPATCHER_TOKEN = new Token<IQueryDispatcher>('IQueryDispatcher');
export const ISERVICECONTAINER_TOKEN = new Token<IServiceContainer>('IServiceContainer');
