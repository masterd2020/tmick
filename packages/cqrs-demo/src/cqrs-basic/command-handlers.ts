import { ICommandHandler, CommandHandler, Inject, Injectable, IEventDispatcher, EVENT_DISPATCHER_TOKEN } from '@tmasterd/cqrs-core';

import { INoteRepository, InMemoryNoteRepository, ILogger, ConsoleLogger } from './service';
import { CreateNoteCommand, UpdateNoteCommand, DeleteNoteCommand } from './commands';
import { Note } from './domain';
import { NoteCreatedEvent, NoteUpdatedEvent, NoteDeletedEvent } from './events';

@Injectable()
@CommandHandler(CreateNoteCommand)
export class CreateNoteCommandHandler implements ICommandHandler<CreateNoteCommand, void> {
	constructor(
		@Inject(InMemoryNoteRepository) private noteRepository: INoteRepository,
		@Inject(ConsoleLogger) private logger: ILogger,
		@Inject(EVENT_DISPATCHER_TOKEN) private eventDispatcher: IEventDispatcher // To dispatch events
	) {}

	async handle(command: CreateNoteCommand): Promise<void> {
		this.logger.log(`Handling CreateNoteCommand for: "${command.title}"`);

		// The repository will assign an ID and creation dates
		const newNote = new Note('', command.title, command.content, new Date(), new Date());
		await this.noteRepository.save(newNote); // ID is generated here

		this.logger.log(`Note created: ${newNote.id}`);

		// Dispatch an event after successful creation
		await this.eventDispatcher.dispatch([new NoteCreatedEvent(newNote)]);
	}
}

@Injectable()
@CommandHandler(UpdateNoteCommand)
export class UpdateNoteCommandHandler implements ICommandHandler<UpdateNoteCommand, void> {
	constructor(
		@Inject(InMemoryNoteRepository) private noteRepository: INoteRepository,
		@Inject(ConsoleLogger) private logger: ILogger,
		@Inject(EVENT_DISPATCHER_TOKEN) private eventDispatcher: IEventDispatcher
	) {}

	async handle(command: UpdateNoteCommand): Promise<void> {
		this.logger.log(`Handling UpdateNoteCommand for ID: ${command.id}`);
		const existingNote = await this.noteRepository.findById(command.id);

		if (!existingNote) {
			this.logger.error(`Note with ID ${command.id} not found for update.`);
			throw new Error(`Note not found: ${command.id}`);
		}

		existingNote.title = command.title !== undefined ? command.title : existingNote.title;
		existingNote.content = command.content !== undefined ? command.content : existingNote.content;
		existingNote.updatedAt = new Date();

		await this.noteRepository.save(existingNote);
		this.logger.log(`Note updated: ${existingNote.id}`);

		await this.eventDispatcher.dispatch([new NoteUpdatedEvent(existingNote)]);
	}
}

@Injectable()
@CommandHandler(DeleteNoteCommand)
export class DeleteNoteCommandHandler implements ICommandHandler<DeleteNoteCommand, void> {
	constructor(
		@Inject(InMemoryNoteRepository) private noteRepository: INoteRepository,
		@Inject(ConsoleLogger) private logger: ILogger,
		@Inject(EVENT_DISPATCHER_TOKEN) private eventDispatcher: IEventDispatcher
	) {}

	async handle(command: DeleteNoteCommand): Promise<void> {
		this.logger.log(`Handling DeleteNoteCommand for ID: ${command.id}`);
		const deleted = await this.noteRepository.delete(command.id);

		if (!deleted) {
			this.logger.warn(`Note with ID ${command.id} not found for deletion.`);
			throw new Error(`Note not found: ${command.id}`);
		}
		this.logger.log(`Note deleted: ${command.id}`);
		await this.eventDispatcher.dispatch([new NoteDeletedEvent(command.id)]);
	}
}
