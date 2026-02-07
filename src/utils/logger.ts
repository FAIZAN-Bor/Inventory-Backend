// Logger utility for application logging
import { config } from '../config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_COLORS = {
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m',  // Green
    warn: '\x1b[33m',  // Yellow
    error: '\x1b[31m', // Red
    reset: '\x1b[0m',  // Reset
};

class Logger {
    private isDevelopment: boolean;

    constructor() {
        this.isDevelopment = config.nodeEnv === 'development';
    }

    private formatMessage(level: LogLevel, message: string, meta?: object): string {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
    }

    private log(level: LogLevel, message: string, meta?: object): void {
        const formattedMessage = this.formatMessage(level, message, meta);

        if (this.isDevelopment) {
            const color = LOG_COLORS[level];
            console[level](`${color}${formattedMessage}${LOG_COLORS.reset}`);
        } else {
            console[level](formattedMessage);
        }
    }

    debug(message: string, meta?: object): void {
        if (this.isDevelopment) {
            this.log('debug', message, meta);
        }
    }

    info(message: string, meta?: object): void {
        this.log('info', message, meta);
    }

    warn(message: string, meta?: object): void {
        this.log('warn', message, meta);
    }

    error(message: string, meta?: object): void {
        this.log('error', message, meta);
    }
}

export const logger = new Logger();
export default logger;
