import { axiosInstance } from './axiosInstance';
import type { DepartmentNode, CreateDepartmentDto } from '../../types/org';

export const orgApi = {
  // Lấy danh sách cây phòng ban
  getOrgTree: async (): Promise<DepartmentNode[]> => {
    const response = await axiosInstance.get('/departments/tree');
    return response.data;
  },

  // Tạo mới phòng ban / nhóm
  createDepartment: async (data: CreateDepartmentDto): Promise<DepartmentNode> => {
    const response = await axiosInstance.post('/departments', data);
    return response.data;
  },

  // Xóa đơn vị / nhóm
  deleteDepartment: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/departments/${id}`);
  }
};