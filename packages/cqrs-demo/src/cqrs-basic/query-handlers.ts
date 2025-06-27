import { IQueryHandler, QueryHandler, Inject, Injectable } from '@tmasterd/cqrs-core';
import { INoteRepository, InMemoryNoteRepository, ILogger, ConsoleLogger } from './service';
import { GetNoteByIdQuery, GetAllNotesQuery } from './queries';
import { INote } from './domain';

@Injectable()
@QueryHandler(GetNoteByIdQuery)
export class GetNoteByIdQueryHandler implements IQueryHandler<GetNoteByIdQuery, INote | undefined> {
	constructor(
		@Inject(InMemoryNoteRepository) private noteRepository: INoteRepository,
		@Inject(ConsoleLogger) private logger: ILogger
	) {}

	async handle(query: GetNoteByIdQuery): Promise<INote | undefined> {
		this.logger.log(`Handling GetNoteByIdQuery for ID: ${query.id}`);
		return await this.noteRepository.findById(query.id);
	}
}

@Injectable()
@QueryHandler(GetAllNotesQuery)
export class GetAllNotesQueryHandler implements IQueryHandler<GetAllNotesQuery, INote[]> {
	constructor(
		@Inject(InMemoryNoteRepository) private noteRepository: INoteRepository,
		@Inject(ConsoleLogger) private logger: ILogger
	) {}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async handle(query: GetAllNotesQuery): Promise<INote[]> {
		this.logger.log('Handling GetAllNotesQuery');
		return await this.noteRepository.findAll();
	}
}
