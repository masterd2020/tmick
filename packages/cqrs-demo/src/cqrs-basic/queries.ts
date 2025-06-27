import { IQuery } from '@tmasterd/cqrs-core';
import { INote } from './domain';

// Query to get a single note by its ID
export class GetNoteByIdQuery implements IQuery<INote | undefined> {
	constructor(public readonly id: string) {}
}

// Query to get all notes
export class GetAllNotesQuery implements IQuery<INote[]> {
	// No parameters needed for getting all notes
}
