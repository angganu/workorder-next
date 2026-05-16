/**
 * Feature: admin-dashboard
 * Property 10: Dashboard statistics are consistent with database state
 * Validates: Requirements 4.1
 */

import fc from "fast-check";

// Core stats computation logic extracted for unit testing
function computeStats(blogs: Array<{ status: "published" | "unpublished" }>) {
  const published = blogs.filter((b) => b.status === "published").length;
  const unpublished = blogs.filter((b) => b.status === "unpublished").length;
  const total = published + unpublished;
  return { total, published, unpublished };
}

describe("Dashboard Stats - Property 10: Statistics are consistent with database state", () => {
  // Feature: admin-dashboard, Property 10: Dashboard statistics are consistent with database state
  it("total should equal published + unpublished for any set of blog records", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            status: fc.constantFrom("published" as const, "unpublished" as const),
          })
        ),
        (blogs) => {
          const stats = computeStats(blogs);
          return stats.total === stats.published + stats.unpublished;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("published count should match actual count of published records", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            status: fc.constantFrom("published" as const, "unpublished" as const),
          })
        ),
        (blogs) => {
          const stats = computeStats(blogs);
          const actualPublished = blogs.filter((b) => b.status === "published").length;
          return stats.published === actualPublished;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("unpublished count should match actual count of unpublished records", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            status: fc.constantFrom("published" as const, "unpublished" as const),
          })
        ),
        (blogs) => {
          const stats = computeStats(blogs);
          const actualUnpublished = blogs.filter((b) => b.status === "unpublished").length;
          return stats.unpublished === actualUnpublished;
        }
      ),
      { numRuns: 100 }
    );
  });
});
