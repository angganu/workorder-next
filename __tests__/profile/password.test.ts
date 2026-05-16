/**
 * Feature: admin-dashboard
 * Property 23: Password change round-trip
 * Property 24: Incorrect current password is rejected on change
 * Property 25: Mismatched password confirmation is rejected
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4
 */

import fc from "fast-check";
import bcrypt from "bcryptjs";
import { z } from "zod";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(1),
});

interface UserRecord {
  id: number;
  password: string; // hashed
}

// Core password change logic extracted for unit testing
async function changePasswordLogic(
  input: { currentPassword: string; newPassword: string; confirmPassword: string },
  user: UserRecord
): Promise<
  | { success: true; newHashedPassword: string }
  | { success: false; reason: "validation" | "mismatch" | "wrong_current" }
> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { success: false, reason: "validation" };

  if (input.newPassword !== input.confirmPassword) {
    return { success: false, reason: "mismatch" };
  }

  const passwordMatch = await bcrypt.compare(input.currentPassword, user.password);
  if (!passwordMatch) return { success: false, reason: "wrong_current" };

  const newHashed = await bcrypt.hash(input.newPassword, 10);
  return { success: true, newHashedPassword: newHashed };
}

const nonBlankString = (minLen: number, maxLen: number) =>
  fc
    .string({ minLength: minLen, maxLength: maxLen })
    .filter((s) => s.trim().length >= minLen);

describe("Password Change - Property 23: Password change round-trip", () => {
  // Feature: admin-dashboard, Property 23: Password change round-trip
  it("should allow login with new password and reject old password after change", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.integer({ min: 1, max: 10000 }),
          oldPassword: nonBlankString(8, 30),
          newPassword: nonBlankString(8, 30),
        }),
        async ({ userId, oldPassword, newPassword }) => {
          fc.pre(oldPassword !== newPassword);

          const oldHashed = await bcrypt.hash(oldPassword, 10);
          const user: UserRecord = { id: userId, password: oldHashed };

          const result = await changePasswordLogic(
            { currentPassword: oldPassword, newPassword, confirmPassword: newPassword },
            user
          );

          if (!result.success) return false;

          // New password should verify against the new hash
          const newWorks = await bcrypt.compare(newPassword, result.newHashedPassword);
          // Old password should NOT verify against the new hash
          const oldWorks = await bcrypt.compare(oldPassword, result.newHashedPassword);

          return newWorks && !oldWorks;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Password Change - Property 24: Incorrect current password is rejected", () => {
  // Feature: admin-dashboard, Property 24: Incorrect current password is rejected on change
  it("should reject change when current password does not match stored hash", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.integer({ min: 1, max: 10000 }),
          realPassword: nonBlankString(8, 30),
          wrongPassword: nonBlankString(8, 30),
          newPassword: nonBlankString(8, 30),
        }),
        async ({ userId, realPassword, wrongPassword, newPassword }) => {
          fc.pre(realPassword !== wrongPassword);

          const hashed = await bcrypt.hash(realPassword, 10);
          const user: UserRecord = { id: userId, password: hashed };

          const result = await changePasswordLogic(
            { currentPassword: wrongPassword, newPassword, confirmPassword: newPassword },
            user
          );

          return result.success === false && result.reason === "wrong_current";
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Password Change - Property 25: Mismatched password confirmation is rejected", () => {
  // Feature: admin-dashboard, Property 25: Mismatched password confirmation is rejected
  it("should reject change when newPassword and confirmPassword do not match", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.integer({ min: 1, max: 10000 }),
          currentPassword: nonBlankString(8, 30),
          newPassword: nonBlankString(8, 30),
          confirmPassword: nonBlankString(8, 30),
        }),
        async ({ userId, currentPassword, newPassword, confirmPassword }) => {
          fc.pre(newPassword !== confirmPassword);

          const hashed = await bcrypt.hash(currentPassword, 10);
          const user: UserRecord = { id: userId, password: hashed };

          const result = await changePasswordLogic(
            { currentPassword, newPassword, confirmPassword },
            user
          );

          return result.success === false && result.reason === "mismatch";
        }
      ),
      { numRuns: 100 }
    );
  });
});
