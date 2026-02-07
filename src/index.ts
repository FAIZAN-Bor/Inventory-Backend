// Main entry point for the backend application
import app from './app';
import { config } from './config';
import { testConnection } from './config/database';
import { logger } from './utils';

const startServer = async (): Promise<void> => {
    try {
        // Test database connection
        const isConnected = await testConnection();

        if (!isConnected) {
            logger.warn('Database connection failed, but server will continue...');
        }

        // Start the server
        app.listen(config.port, () => {
            logger.info(`🚀 Server running on port ${config.port}`);
            logger.info(`📍 Environment: ${config.nodeEnv}`);
            logger.info(`🔗 Health check: http://localhost:${config.port}/health`);
            logger.info(`📚 API Base URL: http://localhost:${config.port}/api`);
        });
    } catch (error) {
        logger.error('Failed to start server', { error });
        process.exit(1);
    }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled Rejection:', { reason });
    process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    process.exit(0);
});

// Start the server
startServer();
