import express from 'express';
import { Tmick } from '@tmasterd/cqrs-core';
import { NoteController } from './controller';

// Import handler classes to ensure they are registered with HandlerRegistry
// These imports are crucial for Tmick's autoScanAndRegisters to discover them.
import './command-handlers';
import './query-handlers';
import './event-handlers';

const app = express();

app.use(express.json()); // Middleware to parse JSON request bodies

/**
 * Starts the Express server, initializes Tmick, and sets up API routes.
 */
export async function startServer(port = 3000) {
	const tmickApp = new Tmick();

	// Auto-scan and registers all decorated services and handlers found.
	tmickApp.autoScanAndRegisters();
	tmickApp.initialize(); // Initialize the framework

	// Resolve the NoteController instance from the IoC container.
	// The container will automatically inject its dependencies (CommandDispatcher, QueryDispatcher, ConsoleLogger).
	const noteController = tmickApp.get(NoteController);

	console.log('Express server starting...');
	console.log('Tmick framework initialized for Express.');

	console.log('\n--- Debug Info After Auto-Registration ---');
	const debugInfo = tmickApp.getDebugInfo();
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

	// --- Route Definitions using the Controller ---
	// We use .bind(noteController) to ensure the 'this' context within the controller methods
	// correctly refers to the controller instance when called by Express.

	// POST /api/v1/notes - Create a new note
	app.post('/api/v1/notes', noteController.createNote.bind(noteController));

	// PUT /api/v1/notes/:id - Update an existing note
	app.put('/api/v1/notes/:id', noteController.updateNote.bind(noteController));

	// DELETE /api/v1/notes/:id - Delete a note
	app.delete('/api/v1/notes/:id', noteController.deleteNote.bind(noteController));

	// GET /api/v1/notes - Get all notes
	app.get('/api/v1/notes', noteController.getAllNotes.bind(noteController));

	// GET /api/v1/notes/:id - Get a single note by ID
	app.get('/api/v1/notes/:id', noteController.getNoteById.bind(noteController));

	// Start the Express server
	app.listen(port, () => {
		console.log(`Server running on http://localhost:${port}`);
		console.log('\n--- API Endpoints ---');
		console.log('   POST /api/v1/notes        -> Create a new note (Body: {title, content})');
		console.log('   GET /api/v1/notes         -> Get all notes');
		console.log('   GET /api/v1/notes/:id     -> Get a specific note by ID');
		console.log('   PUT /api/v1/notes/:id     -> Update a note (Body: {title?, content?})');
		console.log('   DELETE /api/v1/notes/:id  -> Delete a note');
		console.log('\nUse tools like Postman or curl to test these endpoints.');
	});
}
