import { IDomainEventHandler, EventHandler, Inject, Injectable } from '@tmasterd/cqrs-core';
import { ILogger, ConsoleLogger } from './service';
import { NoteCreatedEvent, NoteUpdatedEvent, NoteDeletedEvent } from './events';

@Injectable()
@EventHandler(NoteCreatedEvent)
export class NoteCreatedEventHandler implements IDomainEventHandler<NoteCreatedEvent> {
	constructor(@Inject(ConsoleLogger) private logger: ILogger) {}

	async handle(event: NoteCreatedEvent): Promise<void> {
		this.logger.log(`[EVENT] NoteCreatedEvent received for ID: ${event.note.id} - "${event.note.title}"`);
		// Example: Send a notification, update a read model, etc.
		// console.log(`[NOTIFICATION] A new note titled "${event.note.title}" has been created.`);
	}
}

@Injectable()
@EventHandler(NoteUpdatedEvent)
export class NoteUpdatedEventHandler implements IDomainEventHandler<NoteUpdatedEvent> {
	constructor(@Inject(ConsoleLogger) private logger: ILogger) {}

	async handle(event: NoteUpdatedEvent): Promise<void> {
		this.logger.log(`[EVENT] NoteUpdatedEvent received for ID: ${event.note.id} - "${event.note.title}"`);
		// Example: Log changes, synchronize with external systems
	}
}

@Injectable()
@EventHandler(NoteDeletedEvent)
export class NoteDeletedEventHandler implements IDomainEventHandler<NoteDeletedEvent> {
	constructor(@Inject(ConsoleLogger) private logger: ILogger) {}

	async handle(event: NoteDeletedEvent): Promise<void> {
		this.logger.log(`[EVENT] NoteDeletedEvent received for ID: ${event.noteId}`);
		// Example: Clean up related data, archive note
	}
}
