import { Building2, ChevronRight } from "lucide-react";
import type { CustomerHierarchy } from "../../types/customerHierarchy";

interface CompanyHierarchyTreeProps {
  company: CustomerHierarchy;
  level?: number;
  onSelect: (company: CustomerHierarchy) => void;
  selectedId: number | null;
}

export const CompanyHierarchyTree = ({
  company,
  level = 0,
  onSelect,
  selectedId,
}: CompanyHierarchyTreeProps) => {
  const isSelected = selectedId === company.id;

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(company)}
        className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
          isSelected
            ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
            : "hover:bg-slate-50 text-slate-700"
        }`}
        style={{ paddingLeft: `${16 + level * 28}px` }}
      >
        {level > 0 ? (
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
        ) : (
          <Building2 className="h-5 w-5 shrink-0 text-blue-600" />
        )}
        <div className="min-w-0">
          <div className="font-semibold truncate">{company.name}</div>
          <div className="text-xs text-slate-500">
            ID {company.id}
            {company.parent_customer_id !== null
              ? ` · Công ty mẹ #${company.parent_customer_id}`
              : " · Công ty gốc"}
          </div>
        </div>
      </button>

      {(company.children ?? []).map((child) => (
        <CompanyHierarchyTree
          key={child.id}
          company={child}
          level={level + 1}
          onSelect={onSelect}
          selectedId={selectedId}
        />
      ))}
    </div>
  );
};
