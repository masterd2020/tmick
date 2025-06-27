import { ICommand } from '@tmasterd/cqrs-core';

// Command to create a new note
export class CreateNoteCommand implements ICommand {
	constructor(
		public readonly title: string,
		public readonly content: string
	) {}
}

// Command to update an existing note
export class UpdateNoteCommand implements ICommand {
	constructor(
		public readonly id: string,
		public readonly title?: string,
		public readonly content?: string
	) {}
}

// Command to delete a note
export class DeleteNoteCommand implements ICommand {
	constructor(public readonly id: string) {}
}
