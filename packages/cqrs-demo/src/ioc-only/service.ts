import { Injectable, Singleton } from '@tmasterd/cqrs-core';

/**
 * Interface for a simple logger.
 */
export interface ILogger {
	log(message: string, ...args: any[]): void;
	warn(message: string, ...args: any[]): void;
	error(message: string, ...args: any[]): void;
}

/**
 * A basic console logger implementation.
 */
@Injectable()
@Singleton() // Explicitly mark as Singleton, though it's the default for @Injectable
export class ConsoleLogger implements ILogger {
	constructor() {
		console.log('ConsoleLogger instance created (Singleton)');
	}

	log(message: string, ...args: any[]): void {
		console.log(`[LOG] ${message}`, ...args);
	}

	warn(message: string, ...args: any[]): void {
		console.warn(`[WARN] ${message}`, ...args);
	}

	error(message: string, ...args: any[]): void {
		console.error(`[ERROR] ${message}`, ...args);
	}
}
