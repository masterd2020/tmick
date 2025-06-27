import { Tmick } from '@tmasterd/cqrs-core';
import { CreateNoteCommand, UpdateNoteCommand, DeleteNoteCommand } from './commands';
import { GetNoteByIdQuery, GetAllNotesQuery } from './queries';
import { INote } from './domain';

// Import handler classes to ensure they are registered with HandlerRegistry
import './command-handlers';
import './query-handlers';
import './event-handlers';

/**
 * Main function to run the basic CQRS example without Express.
 * Demonstrates direct interaction with Tmick's executeCommand/executeQuery methods.
 */
export async function runCqrsExample() {
	console.log('\n--- CQRS Framework Example (Notes CRUD) ---');
	const app = new Tmick();

	// 1. Auto-scan and register all decorated services and handlers (commands, queries, events)
	// This finds ConsoleLogger, InMemoryNoteRepository, and all Command/Query/Event handlers.
	app.autoScanAndRegisters();

	// 2. Initialize the framework
	app.initialize();

	console.log('\n--- Debug Info After Auto-Registration ---');
	const debugInfo = app.getDebugInfo();
	console.log('Debug Info:', {
		registeredServices: debugInfo.registeredServices,
		instanceCacheSize: debugInfo.containerInfo.instanceCacheSize,
		serviceClassesRegisteredForScan: debugInfo.serviceClassesRegisteredForScan,
		handlerRegistrationsCount: debugInfo.handlerRegistrations.length,
		handlerRegistrations: debugInfo.handlerRegistrations.map((reg) => ({
			handler: reg.handlerClass.name,
			target: reg.targetType,
			type: reg.handlerType,
		})),
	});
	console.log('--- End Debug Info ---');

	console.log('\n--- Executing Commands & Queries ---');

	// --- CREATE NOTE ---
	console.log('\n--- Create Note 1 ---');
	await app.executeCommand(new CreateNoteCommand('My First Note', 'This is the content of my first note.'));
	// Since InMemoryNoteRepository auto-generates IDs, we need to fetch all notes to get the ID
	const allNotesAfterCreate1 = (await app.executeQuery(new GetAllNotesQuery())) as INote[];
	const createdNoteId1 = allNotesAfterCreate1[0]?.id; // Assuming order is maintained for simplicity in demo
	console.log('Created Note 1 ID:', createdNoteId1);

	console.log('\n--- Create Note 2 ---');
	await app.executeCommand(new CreateNoteCommand('Shopping List', 'Milk, Eggs, Bread, Butter'));
	const allNotesAfterCreate2 = (await app.executeQuery(new GetAllNotesQuery())) as INote[];
	const createdNoteId2 = allNotesAfterCreate2[1]?.id; // Assuming order is maintained for simplicity in demo
	console.log('Created Note 2 ID:', createdNoteId2);

	console.log('\n--- Get All Notes ---');
	const notes: INote[] = await app.executeQuery(new GetAllNotesQuery());
	console.log(
		'All Notes:',
		notes.map((n) => ({ id: n.id, title: n.title, content: n.content.substring(0, Math.min(n.content.length, 20)) + '...' }))
	);

	// --- GET NOTE BY ID ---
	console.log('\n--- Get Note 1 by ID ---');
	const note1 = (await app.executeQuery(new GetNoteByIdQuery(createdNoteId1))) as INote;
	console.log('Fetched Note 1:', note1 ? { id: note1.id, title: note1.title, content: note1.content } : 'Not found');

	console.log('\n--- Attempt to Get Non-Existent Note ---');
	const nonExistentNote = await app.executeQuery(new GetNoteByIdQuery('non-existent-id'));
	console.log('Fetched Non-Existent Note:', nonExistentNote);

	// --- UPDATE NOTE ---
	console.log('\n--- Update Note 1 ---');
	await app.executeCommand(new UpdateNoteCommand(createdNoteId1, 'Updated First Note Title', 'This is the *updated* content of my first note, with more details.'));
	const updatedNote1 = (await app.executeQuery(new GetNoteByIdQuery(createdNoteId1))) as INote;
	console.log('Updated Note 1:', updatedNote1 ? { id: updatedNote1.id, title: updatedNote1.title, content: updatedNote1.content } : 'Not found');

	// --- DELETE NOTE ---
	console.log('\n--- Delete Note 2 ---');
	await app.executeCommand(new DeleteNoteCommand(createdNoteId2));
	const notesAfterDelete = (await app.executeQuery(new GetAllNotesQuery())) as INote[];
	console.log(
		'Notes after deleting Note 2:',
		notesAfterDelete.map((n) => ({ id: n.id, title: n.title }))
	);

	console.log('\n--- Attempt to Delete Non-Existent Note ---');
	try {
		await app.executeCommand(new DeleteNoteCommand('another-non-existent-id'));
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.error('Error during non-existent delete:', error.message);
		} else {
			console.error('An unknown error occurred during non-existent delete.');
		}
	}

	console.log('\n--- CQRS Example Complete ---');
	app.dispose(); // Clean up resources
}
