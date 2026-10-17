import React, { useState, useEffect } from 'react';
import { Contact, Company } from '../../types';

interface ContactFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (c: Omit<Contact, 'id'>) => void;
  initialData?: Contact | null;
  companies: Company[];
}

export const ContactForm: React.FC<ContactFormProps> = ({ isOpen, onClose, onSubmit, initialData, companies }) => {
  const [form, setForm] = useState({
    name: '',
    title: '',
    email: '',
    phone: '',
    companyName: companies[0]?.name || '',
    department: '',
    isPrimary: false,
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        title: initialData.title || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        companyName: initialData.companyName || '',
        department: initialData.department || '',
        isPrimary: Boolean(initialData.isPrimary),
        notes: initialData.notes || ''
      });
    } else {
      setForm({
        name: '',
        title: '',
        email: '',
        phone: '',
        companyName: companies[0]?.name || '',
        department: '',
        isPrimary: false,
        notes: ''
      });
    }
  }, [initialData, isOpen, companies]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedComp = companies.find(c => c.name.toLowerCase() === form.companyName.toLowerCase());
    onSubmit({
      ...form,
      companyId: matchedComp ? matchedComp.id : `comp-custom-${Date.now()}`,
      companyName: form.companyName
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="c360-form-group">
        <label className="c360-form-label">Họ tên *</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          className="c360-form-input"
          placeholder="Nhập họ tên người liên hệ"
        />
      </div>

      <div className="c360-form-group">
        <label className="c360-form-label">Chức vụ</label>
        <input
          type="text"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          className="c360-form-input"
          placeholder="Giám đốc CNTT, Trưởng phòng mua sắm..."
        />
      </div>

      <div className="c360-form-row">
        <div className="c360-form-group">
          <label className="c360-form-label">Email *</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="c360-form-input"
            placeholder="email@company.com"
          />
        </div>
        <div className="c360-form-group">
          <label className="c360-form-label">Điện thoại *</label>
          <input
            type="text"
            required
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            className="c360-form-input"
            placeholder="0901234..."
          />
        </div>
      </div>

      <div className="c360-form-row">
        <div className="c360-form-group">
          <label className="c360-form-label">Công ty *</label>
          <input
            type="text"
            required
            list="company-options"
            value={form.companyName}
            onChange={e => setForm({ ...form, companyName: e.target.value })}
            className="c360-form-input"
            placeholder="Nhập hoặc chọn công ty..."
          />
          <datalist id="company-options">
            {companies.map(c => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </div>
        <div className="c360-form-group">
          <label className="c360-form-label">Phòng ban</label>
          <input
            type="text"
            value={form.department}
            onChange={e => setForm({ ...form, department: e.target.value })}
            className="c360-form-input"
            placeholder="Ban CNTT, Phòng Mua hàng..."
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
        <input
          type="checkbox"
          id="ip"
          checked={form.isPrimary}
          onChange={e => setForm({ ...form, isPrimary: e.target.checked })}
          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
        />
        <label htmlFor="ip" style={{ fontSize: '13.5px', fontWeight: 600, color: '#334155', cursor: 'pointer', margin: 0 }}>
          Là người liên hệ chính (Primary Contact)
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
        <button
          type="button"
          onClick={onClose}
          className="c360-btn-cancel"
        >
          Hủy bỏ
        </button>
        <button type="submit" className="c360-btn-submit">
          Lưu liên hệ
        </button>
      </div>
    </form>
  );
};