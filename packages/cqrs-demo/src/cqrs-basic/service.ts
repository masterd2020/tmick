import { Injectable, Singleton, Inject } from '@tmasterd/cqrs-core';
import { INote } from './domain';

// Service 1: Logger (Singleton)
export interface ILogger {
	log(message: string, ...args: any[]): void;
	error(message: string, ...args: any[]): void;
	warn(message: string, ...args: any[]): void;
}

@Injectable()
@Singleton()
export class ConsoleLogger implements ILogger {
	constructor() {
		console.log('ConsoleLogger instance created (Singleton)');
	}
	log(message: string, ...args: any[]): void {
		console.log(`[LOG] ${message}`, ...args);
	}
	error(message: string, ...args: any[]): void {
		console.error(`[ERROR] ${message}`, ...args);
	}
	warn(message: string, ...args: any[]): void {
		console.warn(`[WARN] ${message}`, ...args);
	}
}

// Service 2: Note Repository (In-memory for simplicity)
export interface INoteRepository {
	save(note: INote): Promise<void>;
	findById(id: string): Promise<INote | undefined>;
	findAll(): Promise<INote[]>;
	delete(id: string): Promise<boolean>;
}

@Injectable()
@Singleton() // Repository often singleton
export class InMemoryNoteRepository implements INoteRepository {
	private notes: Map<string, INote> = new Map();
	private nextId = 1;

	constructor(@Inject(ConsoleLogger) private logger: ILogger) {
		this.logger.log('InMemoryNoteRepository instance created (Singleton)');
	}

	async save(note: INote): Promise<void> {
		if (!note.id) {
			note.id = `note-${this.nextId++}`;
			note.createdAt = new Date();
		}
		note.updatedAt = new Date();
		this.notes.set(note.id, { ...note }); // Store a copy
		this.logger.log(`Note saved: ${note.id} - "${note.title}"`);
	}

	async findById(id: string): Promise<INote | undefined> {
		this.logger.log(`Fetching note by ID: ${id}`);
		return this.notes.get(id);
	}

	async findAll(): Promise<INote[]> {
		this.logger.log('Fetching all notes');
		return Array.from(this.notes.values());
	}

	async delete(id: string): Promise<boolean> {
		const deleted = this.notes.delete(id);
		if (deleted) {
			this.logger.log(`Note deleted: ${id}`);
		} else {
			this.logger.warn(`Attempted to delete non-existent note: ${id}`);
		}
		return deleted;
	}
}
