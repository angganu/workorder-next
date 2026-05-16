interface ActiveBadgeProps {
  is_active: number;
}

export default function ActiveBadge({ is_active }: ActiveBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        is_active === 1
          ? "bg-green-100 text-green-800"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      {is_active === 1 ? "Active" : "Inactive"}
    </span>
  );
}
