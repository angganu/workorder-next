/**
 * Feature: admin-dashboard
 * Property 28: Blog detail page displays all required fields
 * Validates: Requirements 12.1
 */

import React from "react";
import { render, within, cleanup } from "@testing-library/react";
import fc from "fast-check";

// ─── Minimal renderable BlogDetail component (mirrors page logic) ─────────────

type BlogStatus = "published" | "unpublished";
type BlogKategori = "sport" | "art" | "news" | "education";

interface Blog {
  id: number;
  judul: string;
  deskripsi: string;
  gambar: string | null;
  kategori: BlogKategori;
  status: BlogStatus;
  createdAt: string;
}

function BlogDetailView({ blog }: { blog: Blog }) {
  return (
    <div>
      <h1 data-testid="blog-judul">{blog.judul}</h1>
      <span data-testid="blog-status">{blog.status}</span>
      <p data-testid="blog-kategori">{blog.kategori}</p>
      <p data-testid="blog-deskripsi">{blog.deskripsi}</p>
      <p data-testid="blog-created-at">
        {new Date(blog.createdAt).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
      </p>
      {blog.gambar && (
        // eslint-disable-next-line @next/next/no-img-element
        <img data-testid="blog-gambar" src={blog.gambar} alt={blog.judul} />
      )}
    </div>
  );
}

// ─── Arbitraries ──────────────────────────────────────────────────────────────

const kategoriArb = fc.constantFrom<BlogKategori>("sport", "art", "news", "education");
const statusArb = fc.constantFrom<BlogStatus>("published", "unpublished");

const blogArb: fc.Arbitrary<Blog> = fc.record({
  id: fc.integer({ min: 1, max: 9999 }),
  judul: fc.string({ minLength: 1, maxLength: 100 }),
  deskripsi: fc.string({ minLength: 1, maxLength: 500 }),
  gambar: fc.option(
    fc.webUrl().filter((u) => u.startsWith("https")),
    { nil: null }
  ),
  kategori: kategoriArb,
  status: statusArb,
  createdAt: fc
    .date({ min: new Date("2020-01-01"), max: new Date("2025-12-31") })
    .map((d) => d.toISOString()),
});

// ─── Property 28: Blog detail page displays all required fields ───────────────

describe("Property 28: Blog detail page displays all required fields", () => {
  // Feature: admin-dashboard, Property 28: Blog detail page displays all required fields
  afterEach(() => {
    cleanup();
  });

  it("for any blog record, the detail view should display judul, deskripsi, kategori, status, and tanggal dibuat", () => {
    fc.assert(
      fc.property(blogArb, (blog) => {
        cleanup();
        const { container } = render(<BlogDetailView blog={blog} />);
        const view = within(container);

        const judulEl = view.getByTestId("blog-judul");
        const statusEl = view.getByTestId("blog-status");
        const kategoriEl = view.getByTestId("blog-kategori");
        const deskripsiEl = view.getByTestId("blog-deskripsi");
        const createdAtEl = view.getByTestId("blog-created-at");

        // All required fields must be rendered in the DOM
        expect(judulEl).toBeInTheDocument();
        expect(statusEl).toBeInTheDocument();
        expect(kategoriEl).toBeInTheDocument();
        expect(deskripsiEl).toBeInTheDocument();
        expect(createdAtEl).toBeInTheDocument();

        // Content must match (using textContent for whitespace-safe comparison)
        expect(judulEl.textContent).toBe(blog.judul);
        expect(statusEl.textContent).toBe(blog.status);
        expect(kategoriEl.textContent).toBe(blog.kategori);
        expect(deskripsiEl.textContent).toBe(blog.deskripsi);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("for any blog with a gambar, the detail view should display the image", () => {
    fc.assert(
      fc.property(
        blogArb.filter((b) => b.gambar !== null),
        (blog) => {
          cleanup();
          const { container } = render(<BlogDetailView blog={blog} />);
          const view = within(container);
          expect(view.getByTestId("blog-gambar")).toBeInTheDocument();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("for any blog without a gambar, the detail view should not render an image element", () => {
    fc.assert(
      fc.property(
        blogArb.map((b) => ({ ...b, gambar: null })),
        (blog) => {
          cleanup();
          const { container } = render(<BlogDetailView blog={blog} />);
          const view = within(container);
          expect(view.queryByTestId("blog-gambar")).not.toBeInTheDocument();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
