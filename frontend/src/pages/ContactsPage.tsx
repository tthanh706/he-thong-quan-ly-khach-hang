import React, { useState } from 'react';
import { useContacts } from '../hooks/useContacts';
import { ContactList } from '../components/contact/ContactList';
import { ContactForm } from '../components/contact/ContactForm';
import { TransferContactForm } from '../components/contact/TransferContactForm';
import { ContactHistoryList } from '../components/contact/ContactHistoryList';
import { Modal } from '../components/common/Modal';
import { MOCK_COMPANIES } from '../constants';
import { transferContact, getContactHistory } from '../services/contactService';
import toast from 'react-hot-toast';
import type { Contact, ContactHistory } from '../types';
import './ContactsPage.css';

export const ContactsPage: React.FC = () => {
  const { contacts, addContact, editContact, removeContact, refreshContacts } = useContacts() as any;
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  // State cho Chuyển công tác (S3-02)
  const [transferringContact, setTransferringContact] = useState<Contact | null>(null);
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  // State cho Lịch sử chuyển công tác (S3-02)
  const [historyContact, setHistoryContact] = useState<Contact | null>(null);
  const [historyList, setHistoryList] = useState<ContactHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleAdd = async (data: any) => {
    try {
      await addContact(data);
      toast.success('Đã thêm người liên hệ mới thành công!');
    } catch {
      toast.error('Không thể thêm người liên hệ.');
    }
  };

  const handleEdit = async (id: string, data: any) => {
    try {
      await editContact(id, data);
      toast.success('Đã cập nhật thông tin liên hệ!');
    } catch {
      toast.error('Không thể cập nhật liên hệ.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người liên hệ này?')) {
      try {
        await removeContact(id);
        toast.success('Đã xóa người liên hệ!');
      } catch {
        toast.error('Không thể xóa người liên hệ.');
      }
    }
  };

  const handleTransferSubmit = async (newCustomerId: number) => {
    if (!transferringContact) return;
    setTransferSubmitting(true);
    try {
      await transferContact(transferringContact.id, newCustomerId);
      toast.success('Đã chuyển công tác người liên hệ thành công!');
      setTransferringContact(null);
      if (refreshContacts) refreshContacts();
      else window.location.reload();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể chuyển công tác người liên hệ.');
    } finally {
      setTransferSubmitting(false);
    }
  };

  const handleOpenHistory = async (contact: Contact) => {
    setHistoryContact(contact);
    setHistoryLoading(true);
    try {
      const data = await getContactHistory(contact.id);
      setHistoryList(data);
    } catch {
      toast.error('Không thể tải lịch sử chuyển công tác.');
      setHistoryList([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <>
      <ContactList 
        contacts={contacts} 
        onAdd={() => { setEditing(null); setIsOpen(true); }} 
        onEdit={(c: any) => { setEditing(c); setIsOpen(true); }} 
        onDelete={handleDelete}
        onTransfer={(c: Contact) => setTransferringContact(c)}
        onViewHistory={handleOpenHistory}
      />

      {/* Modal Thêm / Sửa */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? 'Sửa thông tin liên hệ' : 'Thêm người liên hệ mới'}>
        <ContactForm 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)} 
          onSubmit={(data: any) => editing ? handleEdit(editing.id, data) : handleAdd(data)} 
          initialData={editing} 
          companies={MOCK_COMPANIES} 
        />
      </Modal>

      {/* Modal Chuyển công tác (S3-02) */}
      <Modal 
        isOpen={Boolean(transferringContact)} 
        onClose={() => setTransferringContact(null)} 
        title={`Chuyển công tác: ${transferringContact?.name || transferringContact?.full_name || ''}`}
      >
        {transferringContact && (
          <TransferContactForm 
            contact={transferringContact}
            submitting={transferSubmitting}
            onCancel={() => setTransferringContact(null)}
            onSubmit={handleTransferSubmit}
          />
        )}
      </Modal>

      {/* Modal Lịch sử luân chuyển (S3-02) */}
      <Modal 
        isOpen={Boolean(historyContact)} 
        onClose={() => setHistoryContact(null)} 
        title={`Lịch sử luân chuyển công tác: ${historyContact?.name || historyContact?.full_name || ''}`}
      >
        <ContactHistoryList 
          history={historyList}
          loading={historyLoading}
        />
      </Modal>
    </>
  );
};

export default ContactsPage;