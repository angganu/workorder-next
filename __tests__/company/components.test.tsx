/**
 * Feature: companies-department-crud
 * Unit tests for ActiveBadge and DeleteDialog components
 * Validates: Requirements 9.6, 9.7
 */

import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ActiveBadge from "@/components/company/ActiveBadge";
import DeleteDialog from "@/components/company/DeleteDialog";

afterEach(() => {
  cleanup();
});

// ─── ActiveBadge ──────────────────────────────────────────────────────────────

describe("ActiveBadge", () => {
  it('renders "Active" when is_active is 1', () => {
    render(<ActiveBadge is_active={1} />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it('renders "Inactive" when is_active is 0', () => {
    render(<ActiveBadge is_active={0} />);
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it('applies green styling when is_active is 1', () => {
    render(<ActiveBadge is_active={1} />);
    const badge = screen.getByText("Active");
    expect(badge.className).toMatch(/bg-green-100/);
    expect(badge.className).toMatch(/text-green-800/);
  });

  it('applies gray styling when is_active is 0', () => {
    render(<ActiveBadge is_active={0} />);
    const badge = screen.getByText("Inactive");
    expect(badge.className).toMatch(/bg-gray-100/);
    expect(badge.className).toMatch(/text-gray-600/);
  });

  it('does not render "Active" when is_active is 0', () => {
    render(<ActiveBadge is_active={0} />);
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
  });

  it('does not render "Inactive" when is_active is 1', () => {
    render(<ActiveBadge is_active={1} />);
    expect(screen.queryByText("Inactive")).not.toBeInTheDocument();
  });
});

// ─── DeleteDialog ─────────────────────────────────────────────────────────────

describe("DeleteDialog", () => {
  const defaultProps = {
    itemName: "PT Contoh Jaya",
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the item name in the confirmation message", () => {
    render(<DeleteDialog {...defaultProps} />);
    expect(screen.getByText(/PT Contoh Jaya/)).toBeInTheDocument();
  });

  it("calls onConfirm when the confirm (Hapus) button is clicked", () => {
    render(<DeleteDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /hapus/i }));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when the cancel (Batal) button is clicked", () => {
    render(<DeleteDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /batal/i }));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it("does not call onConfirm when cancel is clicked", () => {
    render(<DeleteDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /batal/i }));
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  it("does not call onCancel when confirm is clicked", () => {
    render(<DeleteDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /hapus/i }));
    expect(defaultProps.onCancel).not.toHaveBeenCalled();
  });

  it("disables both buttons when loading is true", () => {
    render(<DeleteDialog {...defaultProps} loading={true} />);
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it('shows "Menghapus..." text on confirm button when loading is true', () => {
    render(<DeleteDialog {...defaultProps} loading={true} />);
    expect(screen.getByText("Menghapus...")).toBeInTheDocument();
  });

  it("buttons are enabled when loading is false (default)", () => {
    render(<DeleteDialog {...defaultProps} />);
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => {
      expect(btn).not.toBeDisabled();
    });
  });
});
