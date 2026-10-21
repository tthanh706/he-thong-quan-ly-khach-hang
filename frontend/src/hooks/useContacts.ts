import { useState, useEffect } from 'react';
import { Contact } from '../types';
import { getContacts, createContact, updateContact, deleteContact } from '../services/contactService';
export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const load = async () => setContacts(await getContacts());
  useEffect(() => { load(); }, []);
  return { 
    contacts, 
    refreshContacts: load,
    addContact: async (c: any) => { await createContact(c); load(); }, 
    editContact: async (id: string, u: any) => { await updateContact(id, u); load(); }, 
    removeContact: async (id: string) => { await deleteContact(id); load(); } 
  };
};