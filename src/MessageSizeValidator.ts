/**
 * Message Size Validator for React Native SDK
 * 
 * Validates message sizes according to OddSockets platform limits.
 * Follows the JavaScript SDK pattern for consistent behavior across all SDKs.
 */

export interface MessageSizeError extends Error {
  name: 'MessageSizeError';
  code: 'MESSAGE_TOO_LARGE';
  maxSize: number;
  actualSize: number;
}

/**
 * Maximum message size in bytes (32KB)
 * This matches the industry standard for real-time messaging platforms
 */
export const MAX_MESSAGE_SIZE = 32 * 1024; // 32KB

/**
 * Create a MessageSizeError
 */
function createMessageSizeError(actualSize: number): MessageSizeError {
  const error = new Error(
    `Message size ${actualSize} bytes exceeds maximum allowed size of ${MAX_MESSAGE_SIZE} bytes (32KB)`
  ) as MessageSizeError;
  
  error.name = 'MessageSizeError';
  error.code = 'MESSAGE_TOO_LARGE';
  error.maxSize = MAX_MESSAGE_SIZE;
  error.actualSize = actualSize;
  
  return error;
}

/**
 * Calculate the size of a message in bytes
 * @param message - The message to calculate size for
 * @returns Size in bytes
 */
function calculateMessageSize(message: any): number {
  if (message === null || message === undefined) {
    return 0;
  }
  
  // Convert to JSON string to get accurate byte size
  const jsonString = JSON.stringify(message);
  
  // Calculate UTF-8 byte length
  // In JavaScript/TypeScript, we need to account for multi-byte UTF-8 characters
  let byteLength = 0;
  for (let i = 0; i < jsonString.length; i++) {
    const code = jsonString.charCodeAt(i);
    if (code < 0x80) {
      byteLength += 1;
    } else if (code < 0x800) {
      byteLength += 2;
    } else if (code < 0xd800 || code >= 0xe000) {
      byteLength += 3;
    } else {
      // Surrogate pair
      i++; // Skip the next character
      byteLength += 4;
    }
  }
  
  return byteLength;
}

/**
 * Validate message size
 * @param message - The message to validate
 * @throws {MessageSizeError} If message exceeds size limit
 */
export function validateMessageSize(message: any): void {
  const size = calculateMessageSize(message);
  
  if (size > MAX_MESSAGE_SIZE) {
    throw createMessageSizeError(size);
  }
}

/**
 * Check if a message size is valid without throwing
 * @param message - The message to check
 * @returns Object with validation result
 */
export function checkMessageSize(message: any): {
  valid: boolean;
  size: number;
  maxSize: number;
  error?: string;
} {
  const size = calculateMessageSize(message);
  const valid = size <= MAX_MESSAGE_SIZE;
  
  return {
    valid,
    size,
    maxSize: MAX_MESSAGE_SIZE,
    error: valid ? undefined : `Message size ${size} bytes exceeds maximum allowed size of ${MAX_MESSAGE_SIZE} bytes (32KB)`
  };
}

/**
 * Get the maximum allowed message size
 * @returns Maximum message size in bytes
 */
export function getMaxMessageSize(): number {
  return MAX_MESSAGE_SIZE;
}

/**
 * Format byte size for human reading
 * @param bytes - Size in bytes
 * @returns Formatted string
 */
export function formatByteSize(bytes: number): string {
  if (bytes === 0) return '0 bytes';
  
  const k = 1024;
  const sizes = ['bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Default export for convenience
const MessageSizeValidator = {
  validateMessageSize,
  checkMessageSize,
  getMaxMessageSize,
  formatByteSize,
  MAX_MESSAGE_SIZE
};

export default MessageSizeValidator;
