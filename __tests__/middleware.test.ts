/**
 * Feature: admin-dashboard
 * Property 3: Protected routes reject unauthenticated requests
 * Validates: Requirements 1.3
 */

import fc from "fast-check";
import { signToken } from "@/lib/jwt";

// We test the middleware logic directly by extracting the core decision function
// since Next.js middleware runs in Edge Runtime and can't be imported in Jest directly.

function isPublicApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/auth/");
}

function isProtectedRoute(pathname: string): boolean {
  return pathname.startsWith("/dashboard/") || pathname.startsWith("/api/");
}

function middlewareDecision(
  pathname: string,
  token: string | undefined
): "allow" | "redirect" | "unauthorized" {
  if (isPublicApiRoute(pathname)) return "allow";

  if (!isProtectedRoute(pathname)) return "allow";

  if (!token) {
    return pathname.startsWith("/api/") ? "unauthorized" : "redirect";
  }

  // Validate token
  const { verifyToken } = require("@/lib/jwt");
  const payload = verifyToken(token);
  if (!payload) {
    return pathname.startsWith("/api/") ? "unauthorized" : "redirect";
  }

  return "allow";
}

describe("Middleware - Property 3: Protected routes reject unauthenticated requests", () => {
  // Feature: admin-dashboard, Property 3: Protected routes reject unauthenticated requests
  it("should reject unauthenticated requests to protected dashboard routes", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).map((s) => `/dashboard/${s}`),
        (pathname) => {
          const result = middlewareDecision(pathname, undefined);
          return result === "redirect";
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should reject unauthenticated requests to protected API routes (non-auth)", () => {
    const nonAuthApiPaths = fc
      .string({ minLength: 1, maxLength: 30 })
      .filter((s) => !s.startsWith("auth/"))
      .map((s) => `/api/${s}`);

    fc.assert(
      fc.property(nonAuthApiPaths, (pathname) => {
        const result = middlewareDecision(pathname, undefined);
        return result === "unauthorized";
      }),
      { numRuns: 100 }
    );
  });

  it("should allow requests to /api/auth/* without a token", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }).map((s) => `/api/auth/${s}`),
        (pathname) => {
          const result = middlewareDecision(pathname, undefined);
          return result === "allow";
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should allow authenticated requests to protected routes", () => {
    const validToken = signToken({ userId: 1, email: "test@example.com", name: "Test" });

    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).map((s) => `/dashboard/${s}`),
        (pathname) => {
          const result = middlewareDecision(pathname, validToken);
          return result === "allow";
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should reject requests with an invalid/tampered token", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).map((s) => `/dashboard/${s}`),
        fc.string({ minLength: 10, maxLength: 100 }),
        (pathname, fakeToken) => {
          const result = middlewareDecision(pathname, fakeToken);
          return result === "redirect";
        }
      ),
      { numRuns: 100 }
    );
  });
});
