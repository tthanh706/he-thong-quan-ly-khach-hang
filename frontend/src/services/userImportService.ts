import { api } from './api';

export type ImportPreviewResponse = {
  success: boolean;
  data: {
    total_valid: number;
    total_invalid: number;
    preview_data: {
      row_index: number;
      is_valid: boolean;
      errors: Record<string, string[]>;
      data: any;
    }[];
  };
};

export type ImportSubmitResponse = {
  success: boolean;
  message: string;
  data: {
    total_imported: number;
  };
};

export const userImportService = {
  downloadTemplate: async () => {
    // This returns a binary file, api wrapper returns JSON.
    // So we fetch it directly or handle blob.
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
    a.download = 'user_import_template.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  },

  importFile: (file: File, isPreview: boolean = true) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('is_preview', isPreview ? '1' : '0');

    return api<ImportPreviewResponse | ImportSubmitResponse>('/v1/users/import', {
      method: 'POST',
      body: formData,
    });
  },
};
