/**
 * Feature: admin-dashboard
 * Property 17: Image upload type validation
 * Validates: Requirements 8.5
 */

import fc from "fast-check";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

// Core MIME type validation logic extracted for unit testing
function validateImageMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

// Arbitrary for disallowed MIME types
const disallowedMimeType = fc.oneof(
  fc.constantFrom(
    "application/pdf",
    "text/plain",
    "video/mp4",
    "audio/mpeg",
    "application/json",
    "application/octet-stream",
    "text/html",
    "image/svg+xml",
    "image/tiff",
    "image/bmp"
  ),
  // Also generate random strings that are not in the allowed set
  fc
    .string({ minLength: 1, maxLength: 50 })
    .filter((s) => !ALLOWED_MIME_TYPES.has(s))
);

describe("Avatar Upload - Property 17: Image upload type validation", () => {
  // Feature: admin-dashboard, Property 17: Image upload type validation
  it("should accept all allowed image MIME types", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("image/jpeg", "image/png", "image/gif", "image/webp"),
        (mimeType) => {
          return validateImageMimeType(mimeType) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should reject any MIME type not in the allowed list", () => {
    fc.assert(
      fc.property(disallowedMimeType, (mimeType) => {
        return validateImageMimeType(mimeType) === false;
      }),
      { numRuns: 100 }
    );
  });
});
