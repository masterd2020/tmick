import { Tmick, Injectable, Singleton, Transient, Inject, Token, IServiceContainer, ISERVICECONTAINER_TOKEN } from '@tmasterd/cqrs-core';

import { ILogger, ConsoleLogger } from './service';

// Define some new services for this example
interface IEmailService {
	sendEmail(to: string, subject: string, body: string): void;
}

@Injectable()
@Transient() // New instance each time
class SmtpEmailService implements IEmailService {
	// Inject ConsoleLogger. Since ConsoleLogger is a Singleton, the same instance will be injected.
	constructor(@Inject(ConsoleLogger) private logger: ILogger) {
		this.logger.log('SmtpEmailService instance created (Transient)');
	}

	sendEmail(to: string, subject: string, body: string): void {
		this.logger.log(`[Email] Sending email to ${to} with subject "${subject}" and body: "${body.substring(0, 30)}..."`);
	}
}

interface IReportingService {
	generateReport(data: any[]): string;
}

@Injectable()
@Singleton() // Singleton instance
class AnalyticsReportingService implements IReportingService {
	constructor(
		@Inject(ConsoleLogger) private logger: ILogger, // Injects the singleton logger
		@Inject(SmtpEmailService) private emailService: IEmailService // Injects a new transient SmtpEmailService each time AnalyticsReportingService is created (only once for singleton)
	) {
		this.logger.log('AnalyticsReportingService instance created (Singleton)');
	}

	generateReport(data: any[]): string {
		const report = `Report generated on ${new Date().toLocaleString()} for ${data.length} items.`;
		this.logger.log(`[Report] ${report}`);
		this.emailService.sendEmail('admin@example.com', 'Daily Report', report);
		return report;
	}
}

// A service that depends on a token for configuration
const APP_CONFIG_TOKEN = new Token<{ apiUrl: string; version: string }>('AppConfig');

@Injectable()
@Singleton()
class ApiClient {
	private config: { apiUrl: string; version: string };
	constructor(
		@Inject(ConsoleLogger) private logger: ILogger, // Injects the singleton logger
		@Inject(APP_CONFIG_TOKEN) config: { apiUrl: string; version: string } // Injects configuration via a Token
	) {
		this.config = config;
		this.logger.log(`ApiClient instance created (Singleton) with API URL: ${this.config.apiUrl}`);
	}

	fetchData(endpoint: string): any {
		this.logger.log(`Fetching data from ${this.config.apiUrl}${endpoint} (v${this.config.version})`);
		return { message: `Data from ${endpoint}` };
	}
}

/**
 * Main function to run the IoC container only example.
 */
export async function runIocOnlyExample() {
	console.log('\n--- IoC Container Only Example ---');
	const app = new Tmick(); // Instantiate Tmick, which internally sets up the IoC container

	// Auto-scan and registers all decorated services.
	// This will find ConsoleLogger, SmtpEmailService, AnalyticsReportingService, and ApiClient
	// because they are marked with @Injectable().
	app.autoScanAndRegisters();

	// Although we are not using CQRS dispatchers directly, calling initialize()
	// sets the framework's internal 'initialized' flag, which is good practice.
	app.initialize();

	// Manually register some values/configs into the container.
	// We access the underlying IServiceContainer via Tmick's get method, using its token.
	app.get<IServiceContainer>(ISERVICECONTAINER_TOKEN).registerValue(APP_CONFIG_TOKEN, { apiUrl: 'https://api.example.com', version: '1.0.0' });

	console.log('\n--- Debug Info After Auto-Registration ---');
	const debugInfo = app.getDebugInfo();
	console.log('Debug Info:', {
		registeredServices: debugInfo.registeredServices,
		instanceCacheSize: debugInfo.containerInfo.instanceCacheSize,
		serviceClassesRegisteredForScan: debugInfo.serviceClassesRegisteredForScan,
		handlerRegistrationsCount: debugInfo.handlerRegistrations.length,
	});
	console.log('--- End Debug Info ---');

	console.log('\n--- Resolving Services ---');

	// Resolve ConsoleLogger (Singleton)
	// The first call creates and caches the instance.
	const logger1 = app.get<ILogger>(ConsoleLogger);
	const logger2 = app.get<ILogger>(ConsoleLogger);
	console.log('Logger 1 === Logger 2:', logger1 === logger2); // Should be true, as it's a Singleton

	// Resolve SmtpEmailService (Transient)
	// Each call should create a new instance.
	const emailService1 = app.get<IEmailService>(SmtpEmailService);
	const emailService2 = app.get<IEmailService>(SmtpEmailService);
	console.log('EmailService 1 === EmailService 2:', emailService1 === emailService2); // Should be false, as it's Transient
	emailService1.sendEmail('user@test.com', 'Welcome', 'Hello from transient service!');

	// Resolve AnalyticsReportingService (Singleton, depends on Logger and EmailService)
	// The first call will create it and resolve its dependencies (Logger singleton, EmailService transient).
	// Subsequent calls will return the same cached instance.
	const reportingService1 = app.get<IReportingService>(AnalyticsReportingService);
	const reportingService2 = app.get<IReportingService>(AnalyticsReportingService);
	console.log('ReportingService 1 === ReportingService 2:', reportingService1 === reportingService2); // Should be true, as it's a Singleton
	reportingService1.generateReport([
		{ id: 1, name: 'Item A' },
		{ id: 2, name: 'Item B' },
	]);

	// Resolve ApiClient (Singleton, depends on Logger and APP_CONFIG_TOKEN)
	// Demonstrates injecting a value registered via a Token.
	const apiClient = app.get<ApiClient>(ApiClient);
	apiClient.fetchData('/users');

	console.log('\n--- IoC Only Example Complete ---');
	app.dispose(); // Cleans up the container and resets internal state
}
