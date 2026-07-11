export class ApiError extends Error {
    statusCode: number;
    details?: unknown;
    isOperational: boolean; // true = expected/handled error, false = a bug that slipped through

    constructor(message: string, statusCode: number = 500, details?: unknown) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}