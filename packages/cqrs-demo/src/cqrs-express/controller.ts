import { Request, Response } from 'express';
import { Injectable, Inject, ICommandDispatcher, IQueryDispatcher, COMMAND_DISPATCHER_TOKEN, QUERY_DISPATCHER_TOKEN } from '@tmasterd/cqrs-core';
import { CreateNoteCommand, UpdateNoteCommand, DeleteNoteCommand } from './commands';
import { GetNoteByIdQuery, GetAllNotesQuery } from './queries';
import { INote } from './domain';
import { ILogger, ConsoleLogger } from './service';

@Injectable() // Mark this class as injectable so our Tmick container can manage its dependencies
export class NoteController {
	constructor(
		// Inject the dispatchers and logger directly into the controller
		@Inject(COMMAND_DISPATCHER_TOKEN) private commandDispatcher: ICommandDispatcher,
		@Inject(QUERY_DISPATCHER_TOKEN) private queryDispatcher: IQueryDispatcher,
		@Inject(ConsoleLogger) private logger: ILogger // Assuming ConsoleLogger is your ILogger implementation
	) {
		this.logger.log('NoteController instance created and dependencies injected.');
	}

	// Command Handler: Create a new note
	async createNote(req: Request, res: Response): Promise<void> {
		try {
			const { title, content } = req.body;
			if (!title || !content) {
				res.status(400).json({ error: 'Title and content are required.' });
				return;
			}

			this.logger.log(`[HTTP] Received request to create note: "${title}"`);
			const command = new CreateNoteCommand(title, content);
			await this.commandDispatcher.dispatch(command);

			// In a real application, the command handler might return the created ID or the full entity.
			// For this example, we'll fetch all notes and assume the last one is the new one (simplistic for demo).
			const allNotes = (await this.queryDispatcher.dispatch(new GetAllNotesQuery())) as INote[];
			const newNote = allNotes[allNotes.length - 1]; // This is a weak assumption for production!

			res.status(201).json({ message: 'Note created successfully', noteId: newNote?.id, note: newNote });
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Internal server error';
			this.logger.error(`[HTTP] Error creating note: ${errorMessage}`);
			res.status(500).json({ error: errorMessage });
		}
	}

	// Command Handler: Update an existing note
	async updateNote(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const { title, content } = req.body;

			if (!title && !content) {
				res.status(400).json({ error: 'At least title or content is required for update.' });
				return;
			}

			this.logger.log(`[HTTP] Received request to update note ID: ${id}`);
			const command = new UpdateNoteCommand(id, title, content);
			await this.commandDispatcher.dispatch(command);

			res.status(200).json({ message: `Note ${id} updated successfully` });
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Internal server error';
			this.logger.error(`[HTTP] Error updating note ${req.params.id}: ${errorMessage}`);

			if (errorMessage.includes('Note not found')) {
				res.status(404).json({ error: errorMessage });
				return;
			}

			res.status(500).json({ error: errorMessage || 'Internal server error' });
		}
	}

	// Command Handler: Delete a note
	async deleteNote(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			this.logger.log(`[HTTP] Received request to delete note ID: ${id}`);
			const command = new DeleteNoteCommand(id);
			await this.commandDispatcher.dispatch(command);

			res.status(204).send(); // No Content
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Internal server error';
			this.logger.error(`[HTTP] Error deleting note ${req.params.id}: ${errorMessage}`);

			if (errorMessage.includes('Note not found')) {
				res.status(404).json({ error: errorMessage });
				return;
			}

			res.status(500).json({ error: errorMessage || 'Internal server error' });
		}
	}

	// Query Handler: Get all notes
	async getAllNotes(req: Request, res: Response): Promise<void> {
		try {
			this.logger.log('[HTTP] Received request to get all notes');
			const notes: INote[] = await this.queryDispatcher.dispatch(new GetAllNotesQuery());
			res.status(200).json(notes);
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Internal server error';
			this.logger.error(`[HTTP] Error getting all notes: ${errorMessage}`);
			res.status(500).json({ error: errorMessage });
		}
	}

	// Query Handler: Get a single note by ID
	async getNoteById(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			this.logger.log(`[HTTP] Received request to get note ID: ${id}`);
			const note: INote | undefined = await this.queryDispatcher.dispatch(new GetNoteByIdQuery(id));

			if (note) {
				res.status(200).json(note);
			} else {
				res.status(404).json({ message: `Note with ID ${id} not found` });
			}
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Internal server error';
			this.logger.error(`[HTTP] Error getting note: ${errorMessage}`);
			res.status(500).json({ error: errorMessage });
		}
	}
}
