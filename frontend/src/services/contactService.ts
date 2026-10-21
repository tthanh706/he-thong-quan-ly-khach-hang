import { Contact } from '../types';
import { MOCK_CONTACTS } from '../constants';
import { api } from './api';

let state = [...MOCK_CONTACTS];

export const getContacts = async (): Promise<Contact[]> => {
  try {
    const res = await api<{ success: boolean; data: Contact[] }>('/v1/contacts');
    if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
      state = res.data;
      return res.data;
    }
  } catch {
    // fallback local mock
  }
  return state;
};

export const createContact = async (c: Omit<Contact, 'id'>): Promise<Contact> => {
  try {
    const res = await api<{ success: boolean; data: Contact }>('/v1/contacts', {
      method: 'POST',
      body: JSON.stringify(c),
    });
    if (res && res.data) {
      state.unshift(res.data);
      return res.data;
    }
  } catch {
    // fallback local mock
  }
  const n: Contact = { ...c, id: `cnt-${Date.now()}` };
  state.unshift(n);
  return n;
};

export const updateContact = async (id: string, u: Partial<Contact>): Promise<Contact> => {
  try {
    const res = await api<{ success: boolean; data: Contact }>(`/v1/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(u),
    });
    if (res && res.data) {
      state = state.map((c) => (c.id === id ? res.data : c));
      return res.data;
    }
  } catch {
    // fallback local mock
  }
  state = state.map((c) => (c.id === id ? { ...c, ...u } : c));
  return state.find((c) => c.id === id)!;
};

export const deleteContact = async (id: string): Promise<boolean> => {
  try {
    await api(`/v1/contacts/${id}`, {
      method: 'DELETE',
    });
  } catch {
    // fallback local mock
  }
  state = state.filter((c) => c.id !== id);
  return true;
};

export const transferContact = async (id: string, newCustomerId: string | number): Promise<boolean> => {
  try {
    const res = await api<{ success: boolean; message: string }>(`/v1/contacts/${id}/transfer`, {
      method: 'POST',
      body: JSON.stringify({ new_customer_id: Number(newCustomerId) }),
    });
    return res && res.success;
  } catch (e: any) {
    throw e;
  }
};

export const getContactHistory = async (id: string): Promise<any[]> => {
  try {
    const res = await api<{ success: boolean; data: any[] }>(`/v1/contacts/${id}/history`);
    return res?.data || [];
  } catch {
    return [];
  }
};