import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';

function getHeaders() {
  const token = localStorage.getItem('session_token');
  return {
    Authorization: token ? `Bearer ${token}` : '',
    Accept: 'application/json',
  };
}

export type ResourceName = 'customers' | 'opportunities' | 'activities' | 'quotes';

export function useScopedResource(resource: ResourceName, search: string) {
  return useQuery({
    queryKey: [resource, search],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/${resource}`, {
        params: { search },
        headers: getHeaders(),
      });
      return data;
    },
  });
}

export async function exportScopedResource(resource: ResourceName, search: string, filename: string) {
  const response = await axios.get(`${API_URL}/${resource}/export`, {
    params: { search },
    responseType: 'blob',
    headers: getHeaders(),
  });
  const url = URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
