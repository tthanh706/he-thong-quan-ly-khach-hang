import React, { useEffect, useMemo, useState } from "react";
import { getAuditLogs } from "../services/auditLogService";
import type { AuditLog } from "../types/auditLog";

const pageStyles = {
  wrapper: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "18px",
  },

  header: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    textAlign: "center" as const,
    padding: "4px 0 8px",
  },

  title: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 700,
    color: "#0f172a",
  },

  subtitle: {
    margin: 0,
    fontSize: "13px",
    color: "#64748b",
  },

  filterCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "16px",
    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.04)",
  },

  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    alignItems: "end",
  },

  fieldGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  },

  label: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#475569",
  },

  input: {
    width: "100%",
    minHeight: "40px",
    padding: "9px 11px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box" as const,
  },

  actions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap" as const,
  },

  primaryButton: {
    minHeight: "40px",
    padding: "9px 16px",
    border: "none",
    borderRadius: "8px",
    background: "#0284c7",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
  },

  secondaryButton: {
    minHeight: "40px",
    padding: "9px 16px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#334155",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
  },

  summaryRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap" as const,
  },

  summaryText: {
    fontSize: "13px",
    color: "#64748b",
  },

  tableCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.04)",
  },

  tableWrapper: {
    overflowX: "auto" as const,
  },

  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    minWidth: "980px",
  },

  th: {
    padding: "13px 14px",
    textAlign: "left" as const,
    fontSize: "12px",
    fontWeight: 700,
    color: "#475569",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap" as const,
  },

  td: {
    padding: "13px 14px",
    fontSize: "13px",
    color: "#334155",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "middle" as const,
  },

  emptyState: {
    padding: "36px 20px",
    textAlign: "center" as const,
    color: "#64748b",
    fontSize: "13px",
  },

  errorBox: {
    padding: "12px 14px",
    borderRadius: "10px",
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    fontSize: "13px",
  },

  loadingBox: {
    padding: "24px",
    textAlign: "center" as const,
    color: "#64748b",
    fontSize: "13px",
  },
};

function getEntityLabel(entityType: string) {
  switch (entityType) {
    case "User":
      return "Người dùng";
    case "Customer":
      return "Khách hàng";
    case "Quote":
    case "Quotation":
      return "Báo giá";
    case "SalesTarget":
      return "Chỉ tiêu";
    default:
      return entityType;
  }
}

function getFieldLabel(fieldName: string) {
  switch (fieldName) {
    case "role":
      return "Vai trò";
    case "owner_id":
      return "Người sở hữu";
    case "discount":
      return "Chiết khấu";
    case "target_value":
      return "Chỉ tiêu";
    default:
      return fieldName;
  }
}

function getEntityBadgeStyle(entityType: string) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
    whiteSpace: "nowrap" as const,
  };

  switch (entityType) {
    case "User":
      return {
        ...base,
        background: "#f3e8ff",
        color: "#7e22ce",
      };

    case "Customer":
      return {
        ...base,
        background: "#dcfce7",
        color: "#15803d",
      };

    case "Quote":
    case "Quotation":
      return {
        ...base,
        background: "#fef3c7",
        color: "#b45309",
      };

    case "SalesTarget":
      return {
        ...base,
        background: "#dbeafe",
        color: "#1d4ed8",
      };

    default:
      return {
        ...base,
        background: "#f1f5f9",
        color: "#475569",
      };
  }
}

function formatValue(value: string | null) {
  if (value === null || value === "") {
    return "-";
  }

  return value;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [userId, setUserId] = useState("");
  const [entityType, setEntityType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [appliedUserId, setAppliedUserId] = useState("");
  const [appliedEntityType, setAppliedEntityType] = useState("");
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");

  const loadAuditLogs = async (nextFilters?: {
    userId?: string;
    entityType?: string;
    fromDate?: string;
    toDate?: string;
  }) => {
    try {
      setLoading(true);
      setError("");

      const currentUserId = nextFilters?.userId ?? appliedUserId;
      const currentEntityType = nextFilters?.entityType ?? appliedEntityType;
      const currentFromDate = nextFilters?.fromDate ?? appliedFromDate;
      const currentToDate = nextFilters?.toDate ?? appliedToDate;

      const response = await getAuditLogs({
        user_id: currentUserId ? Number(currentUserId) : undefined,
        entity_type: currentEntityType || undefined,
        from_date: currentFromDate || undefined,
        to_date: currentToDate || undefined,
        per_page: 50,
      });

      setLogs(response.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải nhật ký thay đổi.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs({
      userId: "",
      entityType: "",
      fromDate: "",
      toDate: "",
    });
  }, []);

  const handleFilter = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setAppliedUserId(userId);
    setAppliedEntityType(entityType);
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);

    await loadAuditLogs({
      userId,
      entityType,
      fromDate,
      toDate,
    });
  };

  const handleReset = async () => {
    setUserId("");
    setEntityType("");
    setFromDate("");
    setToDate("");

    setAppliedUserId("");
    setAppliedEntityType("");
    setAppliedFromDate("");
    setAppliedToDate("");

    await loadAuditLogs({
      userId: "",
      entityType: "",
      fromDate: "",
      toDate: "",
    });
  };

  const summaryText = useMemo(() => {
    if (loading) {
      return "Đang tải dữ liệu...";
    }

    if (logs.length === 0) {
      return "Không có bản ghi phù hợp.";
    }

    return `Đang hiển thị ${logs.length} bản ghi nhật ký.`;
  }, [loading, logs.length]);

  return (
    <div style={pageStyles.wrapper}>
      <div style={pageStyles.header}>
        <h2 style={pageStyles.title}>Nhật ký thay đổi</h2>

        <p style={pageStyles.subtitle}>
          Theo dõi các thay đổi trên dữ liệu nhạy cảm của hệ thống quản lý khách hàng.
        </p>
      </div>

      <form onSubmit={handleFilter} style={pageStyles.filterCard}>
        <div style={pageStyles.filterGrid}>
          <div style={pageStyles.fieldGroup}>
            <label style={pageStyles.label}>Người thực hiện</label>

            <input
              type="number"
              min="1"
              placeholder="Nhập ID người dùng"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              style={pageStyles.input}
            />
          </div>

          <div style={pageStyles.fieldGroup}>
            <label style={pageStyles.label}>Loại đối tượng</label>

            <select
              value={entityType}
              onChange={(event) => setEntityType(event.target.value)}
              style={pageStyles.input}
            >
              <option value="">Tất cả đối tượng</option>
              <option value="User">Người dùng</option>
              <option value="Customer">Khách hàng</option>
              <option value="Quote">Báo giá</option>
              <option value="SalesTarget">Chỉ tiêu</option>
            </select>
          </div>

          <div style={pageStyles.fieldGroup}>
            <label style={pageStyles.label}>Từ ngày</label>

            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              style={pageStyles.input}
            />
          </div>

          <div style={pageStyles.fieldGroup}>
            <label style={pageStyles.label}>Đến ngày</label>

            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              style={pageStyles.input}
            />
          </div>

          <div style={pageStyles.actions}>
            <button type="submit" style={pageStyles.primaryButton}>
              Lọc dữ liệu
            </button>

            <button
              type="button"
              onClick={handleReset}
              style={pageStyles.secondaryButton}
            >
              Đặt lại
            </button>
          </div>
        </div>
      </form>

      {error && <div style={pageStyles.errorBox}>{error}</div>}

      <div style={pageStyles.summaryRow}>
        <span style={pageStyles.summaryText}>{summaryText}</span>
      </div>

      <div style={pageStyles.tableCard}>
        {loading ? (
          <div style={pageStyles.loadingBox}>Đang tải nhật ký thay đổi...</div>
        ) : logs.length === 0 ? (
          <div style={pageStyles.emptyState}>
            Không có dữ liệu nhật ký phù hợp với bộ lọc.
          </div>
        ) : (
          <div style={pageStyles.tableWrapper}>
            <table style={pageStyles.table}>
              <thead>
                <tr>
                  <th style={pageStyles.th}>Thời gian</th>

                  <th style={pageStyles.th}>Người thực hiện</th>

                  <th style={pageStyles.th}>Đối tượng</th>

                  <th style={pageStyles.th}>ID đối tượng</th>

                  <th style={pageStyles.th}>Trường thay đổi</th>

                  <th style={pageStyles.th}>Giá trị trước</th>

                  <th style={pageStyles.th}>Giá trị sau</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={pageStyles.td}>{log.created_at}</td>

                    <td style={pageStyles.td}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "3px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            color: "#0f172a",
                          }}
                        >
                          {log.user?.name ?? "Không xác định"}
                        </span>

                        <span
                          style={{
                            fontSize: "12px",
                            color: "#94a3b8",
                          }}
                        >
                          {log.user?.email ?? "-"}
                        </span>
                      </div>
                    </td>

                    <td style={pageStyles.td}>
                      <span style={getEntityBadgeStyle(log.entity_type)}>
                        {getEntityLabel(log.entity_type)}
                      </span>
                    </td>

                    <td style={pageStyles.td}>{log.entity_id ?? "-"}</td>

                    <td style={pageStyles.td}>
                      <span
                        style={{
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        {getFieldLabel(log.field_name)}
                      </span>
                    </td>

                    <td style={pageStyles.td}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "5px 8px",
                          borderRadius: "6px",
                          background: "#f8fafc",
                          color: "#64748b",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {formatValue(log.old_value)}
                      </span>
                    </td>

                    <td style={pageStyles.td}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "5px 8px",
                          borderRadius: "6px",
                          background: "#ecfdf5",
                          color: "#047857",
                          border: "1px solid #a7f3d0",
                          fontWeight: 600,
                        }}
                      >
                        {formatValue(log.new_value)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
