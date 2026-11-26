const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STRICT_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Creates an Error annotated with HTTP status, machine code, and client-safe publicMessage.
 */
export function createPublicError(status, code, message) {
    return Object.assign(new Error(message), { status, code, publicMessage: message });
}

/**
 * Checks whether a value is a valid UUID string.
 */
export function isUuid(value, { strictVersion = false } = {}) {
    if (typeof value !== 'string') return false;
    return (strictVersion ? STRICT_UUID_PATTERN : UUID_PATTERN).test(value);
}
