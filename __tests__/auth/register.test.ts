/**
 * Feature: admin-dashboard
 * Property 5: Registration creates a user with hashed password
 * Property 6: Duplicate email registration is rejected
 * Property 7: Password length validation
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 */

import fc from "fast-check";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Registration schema (mirrors the API)
const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

// Simulated in-memory user store for testing registration logic
async function registerLogic(
  input: { name: string; email: string; password: string },
  existingEmails: Set<string>
): Promise<
  | { success: true; storedPassword: string }
  | { success: false; reason: "validation" | "duplicate" }
> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { success: false, reason: "validation" };

  if (existingEmails.has(input.email)) return { success: false, reason: "duplicate" };

  const hashed = await bcrypt.hash(input.password, 10);
  return { success: true, storedPassword: hashed };
}

// Constrained arbitraries that produce inputs Zod's .email() accepts
// fc.emailAddress() can produce RFC-valid but Zod-rejected emails (e.g. "!a@a.aa")
// We use a simple pattern: localpart@domain.tld where localpart is alphanumeric
const safeEmail = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9]{2,10}$/),
    fc.stringMatching(/^[a-z][a-z0-9]{1,8}$/),
    fc.constantFrom("com", "net", "org", "io")
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

// Non-whitespace-only string of at least N chars
const nonBlankString = (minLen: number, maxLen: number) =>
  fc
    .string({ minLength: minLen, maxLength: maxLen })
    .filter((s) => s.trim().length >= minLen);

describe("Register - Property 5: Registration creates a user with hashed password", () => {
  // Feature: admin-dashboard, Property 5: Registration creates a user with hashed password
  it("should store a hashed password, not the plaintext", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: nonBlankString(1, 50),
          email: safeEmail,
          password: nonBlankString(8, 30),
        }),
        async ({ name, email, password }) => {
          const result = await registerLogic({ name, email, password }, new Set());
          if (!result.success) return false;

          // Stored password must not equal plaintext
          if (result.storedPassword === password) return false;

          // Stored password must be verifiable with bcrypt
          return bcrypt.compare(password, result.storedPassword);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Register - Property 6: Duplicate email registration is rejected", () => {
  // Feature: admin-dashboard, Property 6: Duplicate email registration is rejected
  it("should reject registration when email already exists", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: nonBlankString(1, 50),
          email: safeEmail,
          password: nonBlankString(8, 30),
        }),
        async ({ name, email, password }) => {
          const existingEmails = new Set([email]);
          const result = await registerLogic({ name, email, password }, existingEmails);
          return result.success === false && result.reason === "duplicate";
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Register - Property 7: Password length validation", () => {
  // Feature: admin-dashboard, Property 7: Password length validation
  it("should reject passwords shorter than 8 characters", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: nonBlankString(1, 50),
          email: safeEmail,
          // passwords 0–7 chars (may include whitespace-only, which is fine — still too short)
          password: fc.string({ minLength: 0, maxLength: 7 }),
        }),
        async ({ name, email, password }) => {
          const result = await registerLogic({ name, email, password }, new Set());
          return result.success === false && result.reason === "validation";
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should accept passwords of exactly 8 or more non-blank characters", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: nonBlankString(1, 50),
          email: safeEmail,
          password: nonBlankString(8, 30),
        }),
        async ({ name, email, password }) => {
          const result = await registerLogic({ name, email, password }, new Set());
          return result.success === true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
