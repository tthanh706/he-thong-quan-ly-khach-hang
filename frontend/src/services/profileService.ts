import { api } from './api';
import type { User } from '../types';

export const profileService = {
  getProfile: () => api<{ success: boolean; data: User }>('/v1/profile'),

  updateProfile: (data: { phone?: string | null; job_title?: string | null; email_signature?: string | null }) => 
    api<{ success: boolean; data: User; message: string }>('/v1/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api<{ success: boolean; data: User; message: string }>('/v1/profile/avatar', {
      method: 'POST',
      body: formData,
    });
  },
};
