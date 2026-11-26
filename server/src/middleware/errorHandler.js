import express from 'express';

/**
 * Creates a bounded JSON body parser middleware.
 */
export function createJsonParser(limit = '8kb', options = {}) {
    return express.json({ limit, ...options });
}

/**
 * Builds an Express error-handling middleware with consistent status, error code,
 * and Retry-After / payload-limit handling across API routers.
 */
export function createRouteErrorHandler({
    tooLargeMessage = 'The request payload is too large.',
    tooLargeCode = 'REQUEST_LIMIT',
    fallbackMessage = 'Service is temporarily unavailable.',
    includeMaterialId = false,
} = {}) {
    return function routeErrorHandler(error, req, res, _next) {
        if (res.headersSent) return res.end();

        const parseError = error.type === 'entity.parse.failed';
        const tooLarge = error.type === 'entity.too.large';
        const encoding = error.type === 'encoding.unsupported';

        if (error.retryAfter) {
            res.set('Retry-After', String(error.retryAfter));
        }

        const status = parseError
            ? 400
            : tooLarge
            ? 413
            : encoding
            ? 415
            : error.publicMessage
            ? error.status
            : 503;

        const message = parseError
            ? 'Provide valid JSON.'
            : tooLarge
            ? (typeof tooLargeMessage === 'function' ? tooLargeMessage(req) : tooLargeMessage)
            : encoding
            ? 'Compressed request bodies are not supported.'
            : error.publicMessage ?? fallbackMessage;

        const code = parseError
            ? 'INVALID_JSON'
            : tooLarge
            ? tooLargeCode
            : encoding
            ? 'UNSUPPORTED_ENCODING'
            : error.publicMessage
            ? error.code
            : 'SERVICE_UNAVAILABLE';

        res.status(status).json({
            error: message,
            code,
            ...(error.retryAfter ? { retryAfter: error.retryAfter } : {}),
            ...(includeMaterialId && error.materialId ? { materialId: error.materialId } : {}),
        });
    };
}
