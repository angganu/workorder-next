/**
 * Feature: admin-dashboard
 * Property 1: Valid credentials produce authenticated session
 * Property 2: Invalid credentials are rejected
 * Validates: Requirements 1.1, 1.2, 1.4
 */

import fc from "fast-check";
import bcrypt from "bcryptjs";
import { signToken, verifyToken } from "@/lib/jwt";

// Core login logic extracted for unit testing without HTTP layer
async function loginLogic(
  email: string,
  password: string,
  users: Array<{ id: number; email: string; password: string; name: string }>
): Promise<{ success: boolean; token?: string }> {
  const user = users.find((u) => u.email === email);
  if (!user) return { success: false };

  const match = await bcrypt.compare(password, user.password);
  if (!match) return { success: false };

  const token = signToken({ userId: user.id, email: user.email, name: user.name });
  return { success: true, token };
}

describe("Login - Property 1: Valid credentials produce authenticated session", () => {
  // Feature: admin-dashboard, Property 1: Valid credentials produce authenticated session
  it("should return a valid JWT token for correct credentials", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.integer({ min: 1, max: 10000 }),
          email: fc.emailAddress(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          password: fc.string({ minLength: 8, maxLength: 30 }),
        }),
        async ({ id, email, name, password }) => {
          const hashed = await bcrypt.hash(password, 10);
          const users = [{ id, email, name, password: hashed }];

          const result = await loginLogic(email, password, users);

          if (!result.success || !result.token) return false;

          const payload = verifyToken(result.token);
          return (
            payload !== null &&
            payload.userId === id &&
            payload.email === email &&
            payload.name === name
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Login - Property 2: Invalid credentials are rejected", () => {
  // Feature: admin-dashboard, Property 2: Invalid credentials are rejected
  it("should reject login when email does not exist", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 30 }),
        async (registeredEmail, attemptEmail, password) => {
          fc.pre(registeredEmail !== attemptEmail);

          const hashed = await bcrypt.hash(password, 10);
          const users = [{ id: 1, email: registeredEmail, name: "User", password: hashed }];

          const result = await loginLogic(attemptEmail, password, users);
          return result.success === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should reject login when password is wrong", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 30 }),
        fc.string({ minLength: 8, maxLength: 30 }),
        async (email, correctPassword, wrongPassword) => {
          fc.pre(correctPassword !== wrongPassword);

          const hashed = await bcrypt.hash(correctPassword, 10);
          const users = [{ id: 1, email, name: "User", password: hashed }];

          const result = await loginLogic(email, wrongPassword, users);
          return result.success === false;
        }
      ),
      { numRuns: 100 }
    );
  });
});
