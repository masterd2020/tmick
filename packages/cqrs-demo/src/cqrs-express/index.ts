// This ensures reflect-metadata is loaded before any decorated classes are processed
// import '../../../cqrs-core/src'; // Imports the main index.ts of the framework, which has 'reflect-metadata'

import { startServer } from './app';
export { startServer };

// startServer().catch(console.error);
