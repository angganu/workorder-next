/**
 * Feature: companies-department-crud
 * Unit tests for DepartmentForm component
 * Validates: Requirements 13.2, 13.9
 */

import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import DepartmentForm from "@/components/department/DepartmentForm";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock react-select/async — renders a simple select-like element so we can
// assert on placeholder text and pre-populated values without triggering
// the real async fetch machinery.
jest.mock("react-select/async", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockAsyncSelect = (props: any) => {
    return (
      <div data-testid="async-select">
        {props.value ? (
          <span data-testid="async-select-value">{props.value.label}</span>
        ) : (
          <span data-testid="async-select-placeholder">{props.placeholder}</span>
        )}
      </div>
    );
  };
  MockAsyncSelect.displayName = "MockAsyncSelect";
  return MockAsyncSelect;
});

// Mock global fetch so loadCompanyOptions doesn't fail in the test environment
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
) as jest.Mock;

// ─── Cleanup ──────────────────────────────────────────────────────────────────

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

// ─── DepartmentForm ───────────────────────────────────────────────────────────

describe("DepartmentForm", () => {
  /**
   * Requirement 13.2 — DepartmentForm SHALL render a company_id field using
   * a react-select async searchable select component.
   */
  describe("AsyncSelect company field", () => {
    it("renders the AsyncSelect component", () => {
      render(<DepartmentForm mode="create" />);
      expect(screen.getByTestId("async-select")).toBeInTheDocument();
    });

    it('renders the placeholder "Cari perusahaan..." when no company is selected', () => {
      render(<DepartmentForm mode="create" />);
      expect(
        screen.getByTestId("async-select-placeholder")
      ).toHaveTextContent("Cari perusahaan...");
    });

    it("renders the Perusahaan label for the company field", () => {
      render(<DepartmentForm mode="create" />);
      expect(screen.getByText(/Perusahaan/)).toBeInTheDocument();
    });
  });

  /**
   * Requirement 13.9 — WHEN the DepartmentForm is in edit mode, it SHALL
   * pre-populate the react-select company field with the existing company
   * name and ID from initialData.company_option.
   */
  describe("edit mode pre-population", () => {
    const companyOption = { value: 42, label: "PT Maju Bersama" };

    const initialData = {
      company_id: 42,
      company_option: companyOption,
      code: "DEPT-001",
      name: "Engineering",
      description: "Engineering department",
      department_level: "1",
      department_parent_id: "",
    };

    it("pre-populates the AsyncSelect with the company from initialData.company_option", () => {
      render(
        <DepartmentForm mode="edit" departmentId={1} initialData={initialData} />
      );
      expect(screen.getByTestId("async-select-value")).toHaveTextContent(
        "PT Maju Bersama"
      );
    });

    it("does not show the placeholder when a company is pre-populated", () => {
      render(
        <DepartmentForm mode="edit" departmentId={1} initialData={initialData} />
      );
      expect(
        screen.queryByTestId("async-select-placeholder")
      ).not.toBeInTheDocument();
    });

    it("pre-populates other form fields from initialData", () => {
      render(
        <DepartmentForm mode="edit" departmentId={1} initialData={initialData} />
      );
      expect(screen.getByDisplayValue("DEPT-001")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Engineering")).toBeInTheDocument();
    });
  });

  /**
   * Additional: create mode starts with no company selected (no pre-population).
   */
  describe("create mode", () => {
    it("starts with no company value selected (shows placeholder)", () => {
      render(<DepartmentForm mode="create" />);
      expect(
        screen.getByTestId("async-select-placeholder")
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("async-select-value")
      ).not.toBeInTheDocument();
    });

    it("renders the code and name input fields", () => {
      render(<DepartmentForm mode="create" />);
      // The form has inputs with name="code" and name="name"
      const inputs = screen.getAllByRole("textbox");
      // code and name are both text inputs
      expect(inputs.length).toBeGreaterThanOrEqual(2);
    });

    it('renders the "Tambah Department" submit button', () => {
      render(<DepartmentForm mode="create" />);
      expect(
        screen.getByRole("button", { name: /tambah department/i })
      ).toBeInTheDocument();
    });

    it('renders the "Batal" cancel button', () => {
      render(<DepartmentForm mode="create" />);
      expect(
        screen.getByRole("button", { name: /batal/i })
      ).toBeInTheDocument();
    });
  });

  describe("edit mode", () => {
    it('renders the "Simpan Perubahan" submit button in edit mode', () => {
      render(
        <DepartmentForm
          mode="edit"
          departmentId={1}
          initialData={{
            company_id: 1,
            company_option: { value: 1, label: "PT Test" },
            code: "D001",
            name: "HR",
            description: "",
            department_level: "",
            department_parent_id: "",
          }}
        />
      );
      expect(
        screen.getByRole("button", { name: /simpan perubahan/i })
      ).toBeInTheDocument();
    });
  });
});
