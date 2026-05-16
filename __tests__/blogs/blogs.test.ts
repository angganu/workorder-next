/**
 * Feature: admin-dashboard
 * Property 11: Blog search filter correctness
 * Property 12: Blog date range filter correctness
 * Property 13: Blog sort correctness
 * Property 14: Pagination size invariant
 * Property 15: New blog defaults to unpublished
 * Property 16: Blog form validation rejects missing required fields
 * Property 18: Blog update persists changes
 * Property 19: Publish/unpublish toggle round-trip
 * Property 20: Blog deletion is permanent
 * Property 29: Pagination metadata correctness
 * Validates: Requirements 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 8.3, 8.4, 9.2, 10.1, 10.2, 11.2
 */

import fc from "fast-check";
import { z } from "zod";

// ─── Types ────────────────────────────────────────────────────────────────────

type BlogStatus = "published" | "unpublished";
type BlogKategori = "sport" | "art" | "news" | "education";

interface Blog {
  id: number;
  judul: string;
  deskripsi: string;
  gambar: string | null;
  kategori: BlogKategori;
  status: BlogStatus;
  createdAt: Date;
}

// ─── Zod schema (mirrors API) ─────────────────────────────────────────────────

const createBlogSchema = z.object({
  judul: z.string().min(1, "Judul wajib diisi"),
  deskripsi: z.string().min(1, "Deskripsi wajib diisi"),
  kategori: z.enum(["sport", "art", "news", "education"]),
  gambar: z.string().optional(),
});

// ─── Core logic extracted for unit testing ────────────────────────────────────

const PAGE_SIZE = 10;

function filterBlogs(
  blogs: Blog[],
  opts: {
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
    sortBy?: keyof Blog;
    sortOrder?: "asc" | "desc";
    page?: number;
  }
): { data: Blog[]; total: number; page: number; pageSize: number; totalPages: number } {
  let result = [...blogs];

  // Search filter
  if (opts.search) {
    const kw = opts.search.toLowerCase();
    result = result.filter(
      (b) =>
        b.judul.toLowerCase().includes(kw) ||
        b.deskripsi.toLowerCase().includes(kw)
    );
  }

  // Date range filter
  if (opts.dateFrom) {
    result = result.filter((b) => b.createdAt >= opts.dateFrom!);
  }
  if (opts.dateTo) {
    const to = new Date(opts.dateTo);
    to.setHours(23, 59, 59, 999);
    result = result.filter((b) => b.createdAt <= to);
  }

  const total = result.length;

  // Sort
  const sortBy = opts.sortBy ?? "createdAt";
  const sortOrder = opts.sortOrder ?? "desc";
  result.sort((a, b) => {
    const av = a[sortBy];
    const bv = b[sortBy];
    if (av === bv) return 0;
    const cmp = av! < bv! ? -1 : 1;
    return sortOrder === "asc" ? cmp : -cmp;
  });

  // Pagination
  const page = Math.max(1, opts.page ?? 1);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const data = result.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return { data, total, page, pageSize: PAGE_SIZE, totalPages };
}

function createBlog(
  input: unknown,
  store: Map<number, Blog>,
  nextId: () => number
): { success: true; blog: Blog } | { success: false; error: string } {
  const parsed = createBlogSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }
  const { judul, deskripsi, kategori, gambar } = parsed.data;
  const blog: Blog = {
    id: nextId(),
    judul,
    deskripsi,
    gambar: gambar ?? null,
    kategori,
    status: "unpublished",
    createdAt: new Date(),
  };
  store.set(blog.id, blog);
  return { success: true, blog };
}

function updateBlog(
  id: number,
  input: unknown,
  store: Map<number, Blog>
): { success: true; blog: Blog } | { success: false; error: string } {
  const existing = store.get(id);
  if (!existing) return { success: false, error: "Not found" };

  const parsed = createBlogSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }
  const { judul, deskripsi, kategori, gambar } = parsed.data;
  const updated: Blog = {
    ...existing,
    judul,
    deskripsi,
    kategori,
    gambar: gambar !== undefined ? gambar : existing.gambar,
  };
  store.set(id, updated);
  return { success: true, blog: updated };
}

function toggleStatus(
  id: number,
  store: Map<number, Blog>
): { success: true; blog: Blog } | { success: false } {
  const existing = store.get(id);
  if (!existing) return { success: false };
  const updated: Blog = {
    ...existing,
    status: existing.status === "published" ? "unpublished" : "published",
  };
  store.set(id, updated);
  return { success: true, blog: updated };
}

function deleteBlog(
  id: number,
  store: Map<number, Blog>
): { success: true } | { success: false } {
  if (!store.has(id)) return { success: false };
  store.delete(id);
  return { success: true };
}

// ─── Arbitraries ──────────────────────────────────────────────────────────────

const kategoriArb = fc.constantFrom<BlogKategori>("sport", "art", "news", "education");
const statusArb = fc.constantFrom<BlogStatus>("published", "unpublished");

const blogArb = (id: number): fc.Arbitrary<Blog> =>
  fc.record({
    id: fc.constant(id),
    judul: fc.string({ minLength: 1, maxLength: 100 }),
    deskripsi: fc.string({ minLength: 1, maxLength: 500 }),
    gambar: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
    kategori: kategoriArb,
    status: statusArb,
    createdAt: fc.date({ min: new Date("2020-01-01"), max: new Date("2025-12-31") }),
  });

const blogsArb = fc
  .integer({ min: 0, max: 50 })
  .chain((n) => fc.tuple(...Array.from({ length: n }, (_, i) => blogArb(i + 1))));

const nonEmptyBlogsArb = fc
  .integer({ min: 1, max: 50 })
  .chain((n) => fc.tuple(...Array.from({ length: n }, (_, i) => blogArb(i + 1))));

// ─── Property 11: Blog search filter correctness ──────────────────────────────

describe("Property 11: Blog search filter correctness", () => {
  // Feature: admin-dashboard, Property 11: Blog search filter correctness
  it("search results should only contain blogs matching the keyword in judul or deskripsi", () => {
    fc.assert(
      fc.property(
        blogsArb,
        fc.string({ minLength: 1, maxLength: 20 }),
        (blogs, keyword) => {
          const { data } = filterBlogs(blogs, { search: keyword });
          const kw = keyword.toLowerCase();
          return data.every(
            (b) =>
              b.judul.toLowerCase().includes(kw) ||
              b.deskripsi.toLowerCase().includes(kw)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("no blog that does not contain the keyword should appear in results", () => {
    fc.assert(
      fc.property(
        blogsArb,
        fc.string({ minLength: 1, maxLength: 20 }),
        (blogs, keyword) => {
          const { data } = filterBlogs(blogs, { search: keyword });
          const kw = keyword.toLowerCase();
          const nonMatching = blogs.filter(
            (b) =>
              !b.judul.toLowerCase().includes(kw) &&
              !b.deskripsi.toLowerCase().includes(kw)
          );
          return nonMatching.every((b) => !data.find((d) => d.id === b.id));
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 12: Blog date range filter correctness ─────────────────────────

describe("Property 12: Blog date range filter correctness", () => {
  // Feature: admin-dashboard, Property 12: Blog date range filter correctness
  it("date range filter should return only blogs with createdAt within [from, to]", () => {
    fc.assert(
      fc.property(
        blogsArb,
        fc.tuple(
          fc.date({ min: new Date("2020-01-01"), max: new Date("2022-12-31") }),
          fc.date({ min: new Date("2023-01-01"), max: new Date("2025-12-31") })
        ),
        (blogs, [dateFrom, dateTo]) => {
          const { data } = filterBlogs(blogs, { dateFrom, dateTo });
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          return data.every((b) => b.createdAt >= dateFrom && b.createdAt <= to);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 13: Blog sort correctness ──────────────────────────────────────

describe("Property 13: Blog sort correctness", () => {
  // Feature: admin-dashboard, Property 13: Blog sort correctness
  it("ascending sort: each element should be <= the next for the sorted field", () => {
    fc.assert(
      fc.property(
        nonEmptyBlogsArb,
        fc.constantFrom<keyof Blog>("judul", "kategori", "status", "createdAt"),
        (blogs, sortBy) => {
          const { data } = filterBlogs(blogs, { sortBy, sortOrder: "asc", page: 1 });
          for (let i = 0; i < data.length - 1; i++) {
            if (data[i][sortBy]! > data[i + 1][sortBy]!) return false;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("descending sort: each element should be >= the next for the sorted field", () => {
    fc.assert(
      fc.property(
        nonEmptyBlogsArb,
        fc.constantFrom<keyof Blog>("judul", "kategori", "status", "createdAt"),
        (blogs, sortBy) => {
          const { data } = filterBlogs(blogs, { sortBy, sortOrder: "desc", page: 1 });
          for (let i = 0; i < data.length - 1; i++) {
            if (data[i][sortBy]! < data[i + 1][sortBy]!) return false;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 14: Pagination size invariant ───────────────────────────────────

describe("Property 14: Pagination size invariant", () => {
  // Feature: admin-dashboard, Property 14: Pagination size invariant
  it("non-last pages should return exactly PAGE_SIZE entries", () => {
    fc.assert(
      fc.property(
        fc
          .integer({ min: PAGE_SIZE + 1, max: 100 })
          .chain((n) => fc.tuple(...Array.from({ length: n }, (_, i) => blogArb(i + 1)))),
        (blogs) => {
          const { totalPages } = filterBlogs(blogs, { page: 1 });
          // Check all pages except the last
          for (let p = 1; p < totalPages; p++) {
            const { data } = filterBlogs(blogs, { page: p });
            if (data.length !== PAGE_SIZE) return false;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("last page should return at most PAGE_SIZE entries", () => {
    fc.assert(
      fc.property(
        fc
          .integer({ min: 1, max: 100 })
          .chain((n) => fc.tuple(...Array.from({ length: n }, (_, i) => blogArb(i + 1)))),
        (blogs) => {
          const { totalPages } = filterBlogs(blogs, { page: 1 });
          const { data } = filterBlogs(blogs, { page: totalPages });
          return data.length <= PAGE_SIZE;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 29: Pagination metadata correctness ────────────────────────────

describe("Property 29: Pagination metadata correctness", () => {
  // Feature: admin-dashboard, Property 29: Pagination metadata correctness
  it("total should equal the count of all matching records", () => {
    fc.assert(
      fc.property(blogsArb, (blogs) => {
        const { total } = filterBlogs(blogs, { page: 1 });
        return total === blogs.length;
      }),
      { numRuns: 100 }
    );
  });

  it("totalPages should equal ceil(total / pageSize)", () => {
    fc.assert(
      fc.property(blogsArb, (blogs) => {
        const { total, totalPages, pageSize } = filterBlogs(blogs, { page: 1 });
        const expected = Math.max(1, Math.ceil(total / pageSize));
        return totalPages === expected;
      }),
      { numRuns: 100 }
    );
  });

  it("page field in response should match the requested page", () => {
    fc.assert(
      fc.property(
        fc
          .integer({ min: 1, max: 50 })
          .chain((n) => fc.tuple(...Array.from({ length: n }, (_, i) => blogArb(i + 1)))),
        fc.integer({ min: 1, max: 5 }),
        (blogs, page) => {
          const result = filterBlogs(blogs, { page });
          return result.page === page;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 15: New blog defaults to unpublished ───────────────────────────

describe("Property 15: New blog defaults to unpublished", () => {
  // Feature: admin-dashboard, Property 15: New blog defaults to unpublished
  it("any valid blog creation should produce a blog with status=unpublished", () => {
    let idCounter = 1;
    fc.assert(
      fc.property(
        fc.record({
          judul: fc.string({ minLength: 1, maxLength: 100 }),
          deskripsi: fc.string({ minLength: 1, maxLength: 500 }),
          kategori: kategoriArb,
        }),
        (input) => {
          const store = new Map<number, Blog>();
          const result = createBlog(input, store, () => idCounter++);
          if (!result.success) return false;
          return result.blog.status === "unpublished";
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 16: Blog form validation rejects missing required fields ────────

describe("Property 16: Blog form validation rejects missing required fields", () => {
  // Feature: admin-dashboard, Property 16: Blog form validation rejects missing required fields
  it("missing judul should be rejected", () => {
    let idCounter = 1;
    fc.assert(
      fc.property(
        fc.record({
          deskripsi: fc.string({ minLength: 1, maxLength: 500 }),
          kategori: kategoriArb,
        }),
        (input) => {
          const store = new Map<number, Blog>();
          const result = createBlog({ ...input, judul: "" }, store, () => idCounter++);
          return result.success === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("missing deskripsi should be rejected", () => {
    let idCounter = 1;
    fc.assert(
      fc.property(
        fc.record({
          judul: fc.string({ minLength: 1, maxLength: 100 }),
          kategori: kategoriArb,
        }),
        (input) => {
          const store = new Map<number, Blog>();
          const result = createBlog({ ...input, deskripsi: "" }, store, () => idCounter++);
          return result.success === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("missing kategori should be rejected", () => {
    let idCounter = 1;
    fc.assert(
      fc.property(
        fc.record({
          judul: fc.string({ minLength: 1, maxLength: 100 }),
          deskripsi: fc.string({ minLength: 1, maxLength: 500 }),
        }),
        (input) => {
          const store = new Map<number, Blog>();
          const result = createBlog({ ...input, kategori: undefined }, store, () => idCounter++);
          return result.success === false;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 18: Blog update persists changes ────────────────────────────────

describe("Property 18: Blog update persists changes", () => {
  // Feature: admin-dashboard, Property 18: Blog update persists changes
  it("after a valid update, the stored blog should reflect the new values", () => {
    let idCounter = 1;
    fc.assert(
      fc.property(
        fc.record({
          judul: fc.string({ minLength: 1, maxLength: 100 }),
          deskripsi: fc.string({ minLength: 1, maxLength: 500 }),
          kategori: kategoriArb,
        }),
        fc.record({
          judul: fc.string({ minLength: 1, maxLength: 100 }),
          deskripsi: fc.string({ minLength: 1, maxLength: 500 }),
          kategori: kategoriArb,
        }),
        (createInput, updateInput) => {
          const store = new Map<number, Blog>();
          const created = createBlog(createInput, store, () => idCounter++);
          if (!created.success) return false;

          const updated = updateBlog(created.blog.id, updateInput, store);
          if (!updated.success) return false;

          const stored = store.get(created.blog.id)!;
          return (
            stored.judul === updateInput.judul &&
            stored.deskripsi === updateInput.deskripsi &&
            stored.kategori === updateInput.kategori
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 19: Publish/unpublish toggle round-trip ────────────────────────

describe("Property 19: Publish/unpublish toggle round-trip", () => {
  // Feature: admin-dashboard, Property 19: Publish/unpublish toggle round-trip
  it("toggling twice should return the blog to its original status", () => {
    let idCounter = 1;
    fc.assert(
      fc.property(
        fc.record({
          judul: fc.string({ minLength: 1, maxLength: 100 }),
          deskripsi: fc.string({ minLength: 1, maxLength: 500 }),
          kategori: kategoriArb,
        }),
        (input) => {
          const store = new Map<number, Blog>();
          const created = createBlog(input, store, () => idCounter++);
          if (!created.success) return false;

          const originalStatus = created.blog.status;
          toggleStatus(created.blog.id, store);
          toggleStatus(created.blog.id, store);

          return store.get(created.blog.id)!.status === originalStatus;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("publishing an unpublished blog should set status to published", () => {
    let idCounter = 1;
    fc.assert(
      fc.property(
        fc.record({
          judul: fc.string({ minLength: 1, maxLength: 100 }),
          deskripsi: fc.string({ minLength: 1, maxLength: 500 }),
          kategori: kategoriArb,
        }),
        (input) => {
          const store = new Map<number, Blog>();
          const created = createBlog(input, store, () => idCounter++);
          if (!created.success) return false;
          // New blogs are always unpublished
          toggleStatus(created.blog.id, store);
          return store.get(created.blog.id)!.status === "published";
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 20: Blog deletion is permanent ─────────────────────────────────

describe("Property 20: Blog deletion is permanent", () => {
  // Feature: admin-dashboard, Property 20: Blog deletion is permanent
  it("after deletion, querying the blog by id should return nothing", () => {
    let idCounter = 1;
    fc.assert(
      fc.property(
        fc.record({
          judul: fc.string({ minLength: 1, maxLength: 100 }),
          deskripsi: fc.string({ minLength: 1, maxLength: 500 }),
          kategori: kategoriArb,
        }),
        (input) => {
          const store = new Map<number, Blog>();
          const created = createBlog(input, store, () => idCounter++);
          if (!created.success) return false;

          deleteBlog(created.blog.id, store);
          return !store.has(created.blog.id);
        }
      ),
      { numRuns: 100 }
    );
  });
});
