import React, { useEffect, useMemo, useState } from "react";

import {
  createCustomField,
  deleteCustomField,
  exportCustomFieldEntities,
  filterCustomFieldEntities,
  getCustomFields,
  getCustomFieldValues,
  saveCustomFieldValues,
} from "../services/customFieldService";

import type {
  CustomField,
  CustomFieldEntity,
  CustomFieldModule,
  CustomFieldType,
  CustomFieldValue,
} from "../types/customField";

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "40px",
  padding: "9px 11px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#0f172a",
  fontSize: "13px",
  boxSizing: "border-box",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "6px",
  color: "#475569",
  fontSize: "12px",
  fontWeight: 700,
};

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  padding: "18px",
  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.04)",
};

function getModuleLabel(module: CustomFieldModule): string {
  return module === "customer" ? "Khách hàng" : "Cơ hội";
}

function getTypeLabel(type: CustomFieldType): string {
  switch (type) {
    case "text":
      return "Văn bản";

    case "number":
      return "Số";

    case "date":
      return "Ngày";

    case "select":
      return "Danh sách chọn";

    default:
      return type;
  }
}

export default function CustomFieldsPage() {
  const [fields, setFields] = useState<CustomField[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [module, setModule] = useState<CustomFieldModule>("customer");

  const [fieldName, setFieldName] = useState("");

  const [fieldType, setFieldType] = useState<CustomFieldType>("text");

  const [isRequired, setIsRequired] = useState(false);

  const [optionsText, setOptionsText] = useState("");

  const [entityModule, setEntityModule] =
    useState<CustomFieldModule>("customer");

  const [entityId, setEntityId] = useState("1");

  const [entityFields, setEntityFields] = useState<CustomFieldValue[]>([]);

  const [entityValues, setEntityValues] = useState<Record<string, string>>({});

  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const [filteredEntities, setFilteredEntities] = useState<CustomFieldEntity[]>(
    [],
  );

  const totalRequired = useMemo(
    () => fields.filter((field) => field.is_required).length,
    [fields],
  );

  const activeFields = useMemo(
    () =>
      fields.filter(
        (field) => field.module === entityModule && field.is_active,
      ),
    [fields, entityModule],
  );

  const loadFields = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getCustomFields();

      setFields(response.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải trường tùy chỉnh.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFields();
  }, []);

  const handleCreateField = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setError("");
      setSuccess("");

      if (!fieldName.trim()) {
        setError("Vui lòng nhập tên trường.");
        return;
      }

      const options =
        fieldType === "select"
          ? optionsText
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : undefined;

      if (fieldType === "select" && (!options || options.length === 0)) {
        setError("Trường danh sách chọn phải có ít nhất một lựa chọn.");
        return;
      }

      await createCustomField({
        module,
        field_name: fieldName.trim(),
        field_type: fieldType,
        options,
        is_required: isRequired,
      });

      setFieldName("");
      setFieldType("text");
      setOptionsText("");
      setIsRequired(false);

      setSuccess("Thêm trường tùy chỉnh thành công.");

      await loadFields();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể thêm trường.");
    }
  };

  const handleDeleteField = async (field: CustomField) => {
    const confirmed = window.confirm(`Xóa trường "${field.field_name}"?`);

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await deleteCustomField(field.id);

      setSuccess("Xóa trường tùy chỉnh thành công.");

      await loadFields();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa trường.");
    }
  };

  const handleLoadEntity = async () => {
    const parsedId = Number(entityId);

    if (!parsedId || parsedId < 1) {
      setError("ID đối tượng không hợp lệ.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await getCustomFieldValues(entityModule, parsedId);

      setEntityFields(response.data);

      const values: Record<string, string> = {};

      response.data.forEach((field) => {
        values[field.field_key] = field.value ?? "";
      });

      setEntityValues(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu.");
    }
  };

  const handleSaveEntity = async () => {
    const parsedId = Number(entityId);

    if (!parsedId || parsedId < 1) {
      setError("ID đối tượng không hợp lệ.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await saveCustomFieldValues(
        entityModule,
        parsedId,
        entityValues,
      );

      setEntityFields(response.data);

      setSuccess("Lưu giá trị trường tùy chỉnh thành công.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu dữ liệu.");
    }
  };

  const handleFilter = async () => {
    try {
      setError("");
      setSuccess("");

      const response = await filterCustomFieldEntities(
        entityModule,
        filterValues,
      );

      setFilteredEntities(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lọc dữ liệu.");
    }
  };

  const handleExport = async () => {
    try {
      setError("");

      await exportCustomFieldEntities(entityModule);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xuất Excel.");
    }
  };

  const renderDynamicInput = (field: CustomFieldValue) => {
    const value = entityValues[field.field_key] ?? "";

    if (field.field_type === "select") {
      return (
        <select
          value={value}
          onChange={(event) =>
            setEntityValues((current) => ({
              ...current,
              [field.field_key]: event.target.value,
            }))
          }
          style={inputStyle}
        >
          <option value="">-- Chọn giá trị --</option>

          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={
          field.field_type === "number"
            ? "number"
            : field.field_type === "date"
              ? "date"
              : "text"
        }
        value={value}
        onChange={(event) =>
          setEntityValues((current) => ({
            ...current,
            [field.field_key]: event.target.value,
          }))
        }
        style={inputStyle}
      />
    );
  };

  const renderFilterInput = (field: CustomField) => {
    const value = filterValues[field.field_key] ?? "";

    if (field.field_type === "select") {
      return (
        <select
          value={value}
          onChange={(event) =>
            setFilterValues((current) => ({
              ...current,
              [field.field_key]: event.target.value,
            }))
          }
          style={inputStyle}
        >
          <option value="">Tất cả</option>

          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={
          field.field_type === "number"
            ? "number"
            : field.field_type === "date"
              ? "date"
              : "text"
        }
        value={value}
        placeholder="Nhập giá trị lọc"
        onChange={(event) =>
          setFilterValues((current) => ({
            ...current,
            [field.field_key]: event.target.value,
          }))
        }
        style={inputStyle}
      />
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "4px 0 6px",
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "#0f172a",
            fontSize: "22px",
          }}
        >
          Trường tùy chỉnh
        </h2>

        <p
          style={{
            margin: "6px 0 0",
            color: "#64748b",
            fontSize: "13px",
          }}
        >
          Khai báo trường mở rộng cho khách hàng và cơ hội.
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "9px",
            border: "1px solid #fecaca",
            background: "#fef2f2",
            color: "#b91c1c",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "9px",
            border: "1px solid #bbf7d0",
            background: "#f0fdf4",
            color: "#15803d",
            fontSize: "13px",
          }}
        >
          {success}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
        }}
      >
        <div style={cardStyle}>
          <div
            style={{
              color: "#64748b",
              fontSize: "12px",
            }}
          >
            Tổng trường
          </div>

          <div
            style={{
              marginTop: "6px",
              color: "#0f172a",
              fontSize: "26px",
              fontWeight: 800,
            }}
          >
            {fields.length}
          </div>
        </div>

        <div style={cardStyle}>
          <div
            style={{
              color: "#64748b",
              fontSize: "12px",
            }}
          >
            Trường bắt buộc
          </div>

          <div
            style={{
              marginTop: "6px",
              color: "#0f172a",
              fontSize: "26px",
              fontWeight: 800,
            }}
          >
            {totalRequired}
          </div>
        </div>
      </div>

      <form onSubmit={handleCreateField} style={cardStyle}>
        <h3
          style={{
            margin: "0 0 16px 0",
            fontSize: "15px",
            color: "#0f172a",
          }}
        >
          Khai báo trường mới
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
            alignItems: "end",
          }}
        >
          <div>
            <label style={labelStyle}>Module</label>

            <select
              value={module}
              onChange={(event) =>
                setModule(event.target.value as CustomFieldModule)
              }
              style={inputStyle}
            >
              <option value="customer">Khách hàng</option>

              <option value="opportunity">Cơ hội</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Tên trường</label>

            <input
              value={fieldName}
              onChange={(event) => setFieldName(event.target.value)}
              placeholder="Ví dụ: Quy mô doanh nghiệp"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Kiểu dữ liệu</label>

            <select
              value={fieldType}
              onChange={(event) =>
                setFieldType(event.target.value as CustomFieldType)
              }
              style={inputStyle}
            >
              <option value="text">Văn bản</option>

              <option value="number">Số</option>

              <option value="date">Ngày</option>

              <option value="select">Danh sách chọn</option>
            </select>
          </div>

          {fieldType === "select" && (
            <div>
              <label style={labelStyle}>Các lựa chọn</label>

              <input
                value={optionsText}
                onChange={(event) => setOptionsText(event.target.value)}
                placeholder="VIP, Thường, Tiềm năng"
                style={inputStyle}
              />
            </div>
          )}

          <label
            style={{
              minHeight: "40px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "0 10px",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              color: "#475569",
              fontSize: "13px",
            }}
          >
            <input
              type="checkbox"
              checked={isRequired}
              onChange={(event) => setIsRequired(event.target.checked)}
            />
            Bắt buộc nhập
          </label>

          <button
            type="submit"
            style={{
              minHeight: "40px",
              border: "none",
              borderRadius: "8px",
              background: "#0284c7",
              color: "#ffffff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Thêm trường
          </button>
        </div>
      </form>

      <div style={cardStyle}>
        <h3
          style={{
            margin: "0 0 14px",
            fontSize: "15px",
            color: "#0f172a",
          }}
        >
          Danh sách trường tùy chỉnh
        </h3>

        {loading ? (
          <div
            style={{
              color: "#64748b",
            }}
          >
            Đang tải...
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "760px",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f8fafc",
                  }}
                >
                  {[
                    "Tên trường",
                    "Module",
                    "Kiểu",
                    "Bắt buộc",
                    "Field key",
                    "Thao tác",
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        padding: "11px 12px",
                        textAlign: "left",
                        color: "#475569",
                        fontSize: "12px",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {fields.map((field) => (
                  <tr
                    key={field.id}
                    style={{
                      borderTop: "1px solid #f1f5f9",
                    }}
                  >
                    <td
                      style={{
                        padding: "12px",
                        fontWeight: 700,
                      }}
                    >
                      {field.field_name}
                    </td>

                    <td
                      style={{
                        padding: "12px",
                      }}
                    >
                      {getModuleLabel(field.module)}
                    </td>

                    <td
                      style={{
                        padding: "12px",
                      }}
                    >
                      {getTypeLabel(field.field_type)}
                    </td>

                    <td
                      style={{
                        padding: "12px",
                      }}
                    >
                      {field.is_required ? "Có" : "Không"}
                    </td>

                    <td
                      style={{
                        padding: "12px",
                        color: "#64748b",
                      }}
                    >
                      {field.field_key}
                    </td>

                    <td
                      style={{
                        padding: "12px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => void handleDeleteField(field)}
                        style={{
                          border: "1px solid #fecaca",
                          background: "#fff",
                          color: "#dc2626",
                          borderRadius: "6px",
                          padding: "6px 10px",
                          cursor: "pointer",
                        }}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <h3
          style={{
            margin: "0 0 5px",
            color: "#0f172a",
            fontSize: "15px",
          }}
        >
          Biểu mẫu động
        </h3>

        <p
          style={{
            margin: "0 0 16px",
            color: "#64748b",
            fontSize: "12px",
          }}
        >
          Kiểm tra các trường tùy chỉnh xuất hiện tự động trong biểu mẫu.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "180px 180px auto",
            gap: "10px",
            marginBottom: "16px",
          }}
        >
          <select
            value={entityModule}
            onChange={(event) => {
              setEntityModule(event.target.value as CustomFieldModule);

              setEntityFields([]);
              setEntityValues({});
              setFilterValues({});
              setFilteredEntities([]);
            }}
            style={inputStyle}
          >
            <option value="customer">Khách hàng</option>

            <option value="opportunity">Cơ hội</option>
          </select>

          <input
            type="number"
            min="1"
            value={entityId}
            onChange={(event) => setEntityId(event.target.value)}
            placeholder="ID"
            style={inputStyle}
          />

          <button
            type="button"
            onClick={() => void handleLoadEntity()}
            style={{
              border: "none",
              borderRadius: "8px",
              background: "#334155",
              color: "#ffffff",
              fontWeight: 700,
              padding: "0 16px",
              cursor: "pointer",
            }}
          >
            Tải biểu mẫu
          </button>
        </div>

        {entityFields.length > 0 && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "14px",
              }}
            >
              {entityFields.map((field) => (
                <div key={field.id}>
                  <label style={labelStyle}>
                    {field.field_name}

                    {field.is_required && (
                      <span
                        style={{
                          color: "#dc2626",
                        }}
                      >
                        {" "}
                        *
                      </span>
                    )}
                  </label>

                  {renderDynamicInput(field)}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => void handleSaveEntity()}
              style={{
                marginTop: "15px",
                border: "none",
                borderRadius: "8px",
                background: "#16a34a",
                color: "#ffffff",
                padding: "9px 16px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Lưu dữ liệu
            </button>
          </>
        )}
      </div>

      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "15px",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "15px",
                color: "#0f172a",
              }}
            >
              Bộ lọc & xuất Excel
            </h3>

            <p
              style={{
                margin: "4px 0 0",
                color: "#64748b",
                fontSize: "12px",
              }}
            >
              Lọc dữ liệu theo trường tùy chỉnh đã khai báo.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleExport()}
            style={{
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              background: "#f0fdf4",
              color: "#15803d",
              padding: "8px 12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Xuất Excel
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
          }}
        >
          {activeFields.map((field) => (
            <div key={field.id}>
              <label style={labelStyle}>{field.field_name}</label>

              {renderFilterInput(field)}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void handleFilter()}
          style={{
            marginTop: "14px",
            border: "none",
            borderRadius: "8px",
            background: "#0284c7",
            color: "#ffffff",
            padding: "9px 16px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Lọc dữ liệu
        </button>

        {filteredEntities.length > 0 && (
          <div
            style={{
              overflowX: "auto",
              marginTop: "16px",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "650px",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f8fafc",
                  }}
                >
                  <th
                    style={{
                      padding: "10px",
                      textAlign: "left",
                    }}
                  >
                    ID
                  </th>

                  <th
                    style={{
                      padding: "10px",
                      textAlign: "left",
                    }}
                  >
                    Tên
                  </th>

                  <th
                    style={{
                      padding: "10px",
                      textAlign: "left",
                    }}
                  >
                    Trạng thái
                  </th>

                  <th
                    style={{
                      padding: "10px",
                      textAlign: "left",
                    }}
                  >
                    Email
                  </th>

                  <th
                    style={{
                      padding: "10px",
                      textAlign: "left",
                    }}
                  >
                    Custom Fields
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredEntities.map((entity) => (
                  <tr
                    key={entity.id}
                    style={{
                      borderTop: "1px solid #e2e8f0",
                    }}
                  >
                    <td
                      style={{
                        padding: "10px",
                      }}
                    >
                      {entity.id}
                    </td>

                    <td
                      style={{
                        padding: "10px",
                        fontWeight: 700,
                      }}
                    >
                      {entity.name}
                    </td>

                    <td
                      style={{
                        padding: "10px",
                      }}
                    >
                      {entity.status ?? "-"}
                    </td>

                    <td
                      style={{
                        padding: "10px",
                      }}
                    >
                      {entity.email ?? "-"}
                    </td>

                    <td
                      style={{
                        padding: "10px",
                      }}
                    >
                      {Object.entries(entity.custom_fields)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(" | ") || "-"}
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
