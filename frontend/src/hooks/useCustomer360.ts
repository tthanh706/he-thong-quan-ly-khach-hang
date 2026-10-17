import { useState, useEffect, useCallback } from 'react';
import { Customer360Data, fetchCustomer360 } from '../api/crmApi';

export const useCustomer360 = (id: string | number | null) => {
  const [data, setData] = useState<Customer360Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!id) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCustomer360(id);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải dữ liệu Khách hàng 360');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
};
