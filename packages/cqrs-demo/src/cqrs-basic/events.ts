import { IDomainEvent } from '@tmasterd/cqrs-core';
import { INote } from './domain';

// Event published after a note is created
export class NoteCreatedEvent implements IDomainEvent {
	readonly occurredOn: Date = new Date();
	readonly eventVersion: number = 1;
	readonly aggregateId: string;

	constructor(public readonly note: INote) {
		this.aggregateId = note.id;
	}
}

// Event published after a note is updated
export class NoteUpdatedEvent implements IDomainEvent {
	readonly occurredOn: Date = new Date();
	readonly eventVersion: number = 1;
	readonly aggregateId: string;

	constructor(public readonly note: INote) {
		this.aggregateId = note.id;
	}
}

// Event published after a note is deleted
export class NoteDeletedEvent implements IDomainEvent {
	readonly occurredOn: Date = new Date();
	readonly eventVersion: number = 1;
	readonly aggregateId: string;

	constructor(public readonly noteId: string) {
		this.aggregateId = noteId;
	}
}
