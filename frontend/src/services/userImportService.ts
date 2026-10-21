import { api } from './api';

export type ImportPreviewRow = {
  row_index: number;
  is_valid: boolean;
  errors: Record<string, string[]> | string[];
  data: {
    name: string;
    email: string;
    role: string;
    password?: string;
    business_group?: string;
    team_id?: string;
  };
};

export type ImportPreviewResponse = {
  success: boolean;
  message?: string;
  data: {
    total_valid: number;
    total_invalid: number;
    valid_rows?: number;
    invalid_rows?: number;
    created_rows?: number;
    total_imported?: number;
    preview_data: ImportPreviewRow[];
    rows?: any[];
  };
};

export type ImportSubmitResponse = {
  success: boolean;
  message: string;
  total_imported?: number;
  data?: {
    total_imported: number;
    created_rows?: number;
  };
};

export const userImportService = {
  downloadTemplate: async () => {
    // This returns a CSV UTF-8 with BOM file
    const token = localStorage.getItem('session_token');
    const response = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'}/v1/users/import/template`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Không thể tải file mẫu');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mau-nhap-nguoi-dung.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  },

  importFile: (file: File, isPreview: boolean = true) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dry_run', isPreview ? '1' : '0');
    formData.append('is_preview', isPreview ? '1' : '0');

    return api<any>('/v1/users/import', {
      method: 'POST',
      body: formData,
    });
  },
};

