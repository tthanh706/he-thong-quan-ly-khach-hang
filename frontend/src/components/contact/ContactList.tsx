import React, { useState } from 'react';
import { Contact } from '../../types';
import { Search, Plus, Mail, Phone, Star, Edit, Trash2, ArrowRightLeft, History } from 'lucide-react';
import '../../pages/ContactsPage.css';

interface ContactListProps {
  contacts: Contact[];
  onAdd: () => void;
  onEdit: (c: Contact) => void;
  onDelete: (id: string) => void;
  onTransfer?: (c: Contact) => void;
  onViewHistory?: (c: Contact) => void;
}

export const ContactList: React.FC<ContactListProps> = ({ contacts, onAdd, onEdit, onDelete, onTransfer, onViewHistory }) => {
  const [search, setSearch] = useState('');
  const filtered = contacts.filter((c) =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.companyName || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.title && c.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="contacts-page">
      {/* Header Banner */}
      <div className="contacts-header">
        <div>
          <h2>Danh Bạ Người Liên Hệ</h2>
          <p>Quản lý người liên hệ doanh nghiệp, chức danh và vai trò ra quyết định</p>
        </div>
        <button 
          type="button"
          onClick={onAdd} 
          className="c360-btn-primary"
        >
          <Plus size={16} />
          <span>Thêm người liên hệ</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="contacts-card">
        {/* Search */}
        <div className="contacts-search-bar">
          <div className="contacts-search-wrapper">
            <Search size={16} className="contacts-search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm theo họ tên, chức danh, công ty, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="contacts-search-input"
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="contacts-table">
            <thead>
              <tr>
                <th style={{ minWidth: '220px' }}>HỌ TÊN & CHỨC VỤ</th>
                <th style={{ minWidth: '200px' }}>CÔNG TY & PHÒNG BAN</th>
                <th style={{ minWidth: '200px' }}>EMAIL</th>
                <th style={{ minWidth: '140px' }}>SỐ ĐIỆN THOẠI</th>
                <th style={{ minWidth: '130px', textAlign: 'center' }}>VAI TRÒ</th>
                <th style={{ minWidth: '100px', textAlign: 'center' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    Chưa có liên hệ nào phù hợp với tìm kiếm "{search}"
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="contact-name-cell">
                        <div className="contact-avatar">
                          {c.name ? c.name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="contact-name-title">{c.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            {c.title || 'Chưa cập nhật'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{c.companyName || 'Chưa gán'}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        {c.department ? `Phòng: ${c.department}` : ''}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                        <Mail size={13} color="#94a3b8" />
                        <span>{c.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                        <Phone size={13} color="#94a3b8" />
                        <span>{c.phone || 'N/A'}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {c.isPrimary ? (
                        <span className="contact-badge-primary">
                          <Star size={12} fill="#854d0e" /> Liên hệ chính
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Phụ</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        {onTransfer && (
                          <button 
                            type="button"
                            onClick={() => onTransfer(c)} 
                            className="c360-btn-action"
                            title="Chuyển công tác sang công ty khác"
                            style={{ color: '#0284c7' }}
                          >
                            <ArrowRightLeft size={14} />
                          </button>
                        )}
                        {onViewHistory && (
                          <button 
                            type="button"
                            onClick={() => onViewHistory(c)} 
                            className="c360-btn-action"
                            title="Xem lịch sử luân chuyển công tác"
                            style={{ color: '#7c3aed' }}
                          >
                            <History size={14} />
                          </button>
                        )}
                        <button 
                          type="button"
                          onClick={() => onEdit(c)} 
                          className="c360-btn-action"
                          title="Chỉnh sửa liên hệ"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => onDelete(c.id)} 
                          className="c360-btn-action delete"
                          title="Xóa liên hệ"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};