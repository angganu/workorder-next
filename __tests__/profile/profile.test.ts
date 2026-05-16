/**
 * Feature: admin-dashboard
 * Property 22: Profile update persists changes
 * Property 27: Duplicate email on profile update is rejected
 * Validates: Requirements 5.1, 5.2
 */

import fc from "fast-check";
import { z } from "zod";

// Mirrors the API validation schema
const updateProfileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

interface UserRecord {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
}

// Core profile update logic extracted for unit testing
function updateProfileLogic(
  userId: number,
  input: { name: string; email: string },
  users: Map<number, UserRecord>
):
  | { success: true; user: UserRecord }
  | { success: false; reason: "validation" | "duplicate" | "not_found" } {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) return { success: false, reason: "validation" };

  const currentUser = users.get(userId);
  if (!currentUser) return { success: false, reason: "not_found" };

  // Check if email is used by another user
  const duplicate = Array.from(users.values()).find(
    (u) => u.email === input.email && u.id !== userId
  );
  if (duplicate) return { success: false, reason: "duplicate" };

  const updated: UserRecord = { ...currentUser, name: input.name, email: input.email };
  users.set(userId, updated);
  return { success: true, user: updated };
}

// Safe email arbitrary that passes Zod's .email() validation
const safeEmail = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9]{2,10}$/),
    fc.stringMatching(/^[a-z][a-z0-9]{1,8}$/),
    fc.constantFrom("com", "net", "org", "io")
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

const nonBlankString = (minLen: number, maxLen: number) =>
  fc
    .string({ minLength: minLen, maxLength: maxLen })
    .filter((s) => s.trim().length >= minLen);

describe("Profile Update - Property 22: Profile update persists changes", () => {
  // Feature: admin-dashboard, Property 22: Profile update persists changes
  it("should persist new name and email after a valid update", () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.integer({ min: 1, max: 10000 }),
          oldName: nonBlankString(1, 50),
          oldEmail: safeEmail,
          newName: nonBlankString(1, 50),
          newEmail: safeEmail,
        }),
        ({ userId, oldName, oldEmail, newName, newEmail }) => {
          const users = new Map<number, UserRecord>([
            [userId, { id: userId, name: oldName, email: oldEmail, avatar: null }],
          ]);

          const result = updateProfileLogic(userId, { name: newName, email: newEmail }, users);

          if (!result.success) return false;

          const stored = users.get(userId)!;
          return stored.name === newName && stored.email === newEmail;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Profile Update - Property 27: Duplicate email on profile update is rejected", () => {
  // Feature: admin-dashboard, Property 27: Duplicate email on profile update is rejected
  it("should reject update when email belongs to a different user", () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.integer({ min: 1, max: 4999 }),
          otherUserId: fc.integer({ min: 5000, max: 10000 }),
          name: nonBlankString(1, 50),
          email: safeEmail,
          otherEmail: safeEmail,
        }),
        ({ userId, otherUserId, name, email, otherEmail }) => {
          fc.pre(email !== otherEmail);

          const users = new Map<number, UserRecord>([
            [userId, { id: userId, name, email, avatar: null }],
            [otherUserId, { id: otherUserId, name: "Other", email: otherEmail, avatar: null }],
          ]);

          // Try to update userId's email to otherEmail (already taken)
          const result = updateProfileLogic(userId, { name, email: otherEmail }, users);
          return result.success === false && result.reason === "duplicate";
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should allow updating to the same email (no conflict with self)", () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.integer({ min: 1, max: 10000 }),
          name: nonBlankString(1, 50),
          email: safeEmail,
          newName: nonBlankString(1, 50),
        }),
        ({ userId, name, email, newName }) => {
          const users = new Map<number, UserRecord>([
            [userId, { id: userId, name, email, avatar: null }],
          ]);

          // Updating with the same email should succeed
          const result = updateProfileLogic(userId, { name: newName, email }, users);
          return result.success === true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
