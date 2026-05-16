/**
 * Feature: admin-dashboard
 * Property 8: Password reset with invalid/expired token is rejected
 * Property 9: Password reset round-trip
 * Validates: Requirements 3.4, 3.5
 */

import fc from "fast-check";
import bcrypt from "bcryptjs";
import crypto from "crypto";

interface PasswordResetRecord {
  token: string;
  userId: number;
  expiresAt: Date;
}

interface UserRecord {
  id: number;
  email: string;
  password: string; // hashed
}

// Core reset-password logic extracted for unit testing
async function resetPasswordLogic(
  token: string,
  newPassword: string,
  resetRecords: Map<string, PasswordResetRecord>,
  users: Map<number, UserRecord>
): Promise<{ success: boolean; reason?: "invalid_token" | "expired_token" | "validation" }> {
  if (newPassword.length < 8) return { success: false, reason: "validation" };

  const record = resetRecords.get(token);
  if (!record) return { success: false, reason: "invalid_token" };

  if (record.expiresAt < new Date()) {
    resetRecords.delete(token);
    return { success: false, reason: "expired_token" };
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  const user = users.get(record.userId);
  if (user) user.password = hashed;

  resetRecords.delete(token);
  return { success: true };
}

describe("Reset Password - Property 8: Invalid/expired token is rejected", () => {
  // Feature: admin-dashboard, Property 8: Password reset with invalid/expired token is rejected
  it("should reject tokens not present in the store", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.hexaString({ minLength: 64, maxLength: 64 }),
        fc.string({ minLength: 8, maxLength: 30 }),
        async (token, newPassword) => {
          const emptyRecords = new Map<string, PasswordResetRecord>();
          const users = new Map<number, UserRecord>();

          const result = await resetPasswordLogic(token, newPassword, emptyRecords, users);
          return result.success === false && result.reason === "invalid_token";
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should reject expired tokens", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.string({ minLength: 8, maxLength: 30 }),
        async (userId, newPassword) => {
          const token = crypto.randomBytes(32).toString("hex");
          const expiredDate = new Date(Date.now() - 1000); // 1 second in the past

          const resetRecords = new Map<string, PasswordResetRecord>([
            [token, { token, userId, expiresAt: expiredDate }],
          ]);
          const users = new Map<number, UserRecord>();

          const result = await resetPasswordLogic(token, newPassword, resetRecords, users);
          return result.success === false && result.reason === "expired_token";
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Reset Password - Property 9: Password reset round-trip", () => {
  // Feature: admin-dashboard, Property 9: Password reset round-trip
  it("should allow login with new password and reject old password after reset", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.integer({ min: 1, max: 10000 }),
          email: fc.emailAddress({ domains: ["example.com"] }),
          oldPassword: fc.string({ minLength: 8, maxLength: 30 }),
          newPassword: fc.string({ minLength: 8, maxLength: 30 }),
        }),
        async ({ userId, email, oldPassword, newPassword }) => {
          fc.pre(oldPassword !== newPassword);

          const oldHashed = await bcrypt.hash(oldPassword, 10);
          const users = new Map<number, UserRecord>([
            [userId, { id: userId, email, password: oldHashed }],
          ]);

          const token = crypto.randomBytes(32).toString("hex");
          const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
          const resetRecords = new Map<string, PasswordResetRecord>([
            [token, { token, userId, expiresAt }],
          ]);

          const result = await resetPasswordLogic(token, newPassword, resetRecords, users);
          if (!result.success) return false;

          const user = users.get(userId)!;

          // New password should work
          const newPasswordWorks = await bcrypt.compare(newPassword, user.password);
          // Old password should not work
          const oldPasswordWorks = await bcrypt.compare(oldPassword, user.password);

          return newPasswordWorks && !oldPasswordWorks;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should consume the token after a successful reset (token cannot be reused)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.integer({ min: 1, max: 10000 }),
          newPassword: fc.string({ minLength: 8, maxLength: 30 }),
          secondPassword: fc.string({ minLength: 8, maxLength: 30 }),
        }),
        async ({ userId, newPassword, secondPassword }) => {
          const token = crypto.randomBytes(32).toString("hex");
          const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
          const resetRecords = new Map<string, PasswordResetRecord>([
            [token, { token, userId, expiresAt }],
          ]);
          const users = new Map<number, UserRecord>([
            [userId, { id: userId, email: "test@example.com", password: "hashed" }],
          ]);

          // First reset succeeds
          const first = await resetPasswordLogic(token, newPassword, resetRecords, users);
          if (!first.success) return false;

          // Second reset with same token should fail
          const second = await resetPasswordLogic(token, secondPassword, resetRecords, users);
          return second.success === false && second.reason === "invalid_token";
        }
      ),
      { numRuns: 100 }
    );
  });
});
