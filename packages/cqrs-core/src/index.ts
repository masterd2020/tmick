if (typeof Reflect === 'undefined' || !Reflect?.getMetadata) {
	throw new Error('Tmick requires a reflect polyfill. Please add \'import "reflect-metadata"\' to the top of your entry point.');
}

// Export all core types
export * from './types';

// Export IoC related components
export * from './ioc/custom-container';
export * from './ioc/service-container';

// Export decorators
export * from './decorators/ioc-handler'; // This exports Injectable, Singleton, Transient, Inject
export * from './decorators/handlers'; // This exports CommandHandler, QueryHandler, EventHandler

// Export dispatcher implementations (can be resolved from container or used directly)
export * from './dispatchers/command-dispatcher';
export * from './dispatchers/query-dispatcher';
export * from './dispatchers/event-dispatcher';

// Export the HandlerRegistry (for advanced use/debugging)
export * from './registry/handler-registry';

// Export framework-specific tokens
export * from './tokens';

// Export the main framework orchestrator
export * from './tmick';
