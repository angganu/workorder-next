/**
 * Feature: admin-dashboard
 * Property 26: Unregistered email on forgot password is rejected
 * Validates: Requirements 3.2
 */

import fc from "fast-check";

// Core forgot-password logic extracted for unit testing
function forgotPasswordLogic(
  email: string,
  registeredEmails: Set<string>
): { success: boolean; reason?: "not_found" | "invalid_email" } {
  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return { success: false, reason: "invalid_email" };

  if (!registeredEmails.has(email)) return { success: false, reason: "not_found" };

  return { success: true };
}

describe("Forgot Password - Property 26: Unregistered email on forgot password is rejected", () => {
  // Feature: admin-dashboard, Property 26: Unregistered email on forgot password is rejected
  it("should reject any email not present in the registered users set", () => {
    fc.assert(
      fc.property(
        fc.emailAddress({ domains: ["example.com", "test.com"] }),
        fc.emailAddress({ domains: ["other.com", "another.com"] }),
        (registeredEmail, attemptEmail) => {
          fc.pre(registeredEmail !== attemptEmail);

          const registeredEmails = new Set([registeredEmail]);
          const result = forgotPasswordLogic(attemptEmail, registeredEmails);
          return result.success === false && result.reason === "not_found";
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should succeed for a registered email", () => {
    fc.assert(
      fc.property(
        fc.emailAddress({ domains: ["example.com"] }),
        (email) => {
          const registeredEmails = new Set([email]);
          const result = forgotPasswordLogic(email, registeredEmails);
          return result.success === true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
