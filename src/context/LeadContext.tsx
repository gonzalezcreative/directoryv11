import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, addDoc, query, onSnapshot, where, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

export interface Lead {
  id: string;
  category: string;
  equipmentTypes: string[];
  rentalDuration: string;
  startDate: string;
  budget: string;
  street: string;
  city: string;
  zipCode: string;
  name: string;
  email: string;
  phone: string;
  details: string;
  status: 'New' | 'Purchased';
  createdAt: string;
  purchasedBy: string | null;
  purchasedAt?: string;
}

interface LeadContextType {
  leads: Lead[];
  loading: boolean;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'purchasedBy' | 'status'>) => Promise<void>;
  purchaseLead: (leadId: string) => Promise<void>;
}

const LeadContext = createContext<LeadContextType | undefined>(undefined);

export function LeadProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let q = query(
      collection(db, 'leads'),
      where('status', '==', 'New')
    );

    if (user) {
      q = query(
        collection(db, 'leads'),
        where('status', 'in', ['New', 'Purchased']),
        where('purchasedBy', 'in', [null, user.id])
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];
      setLeads(leadsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'purchasedBy' | 'status'>) => {
    try {
      await addDoc(collection(db, 'leads'), {
        ...leadData,
        status: 'New',
        createdAt: Timestamp.now().toDate().toISOString(),
        purchasedBy: null
      });
    } catch (error) {
      console.error('Error adding lead:', error);
      throw error;
    }
  };

  const purchaseLead = async (leadId: string) => {
    if (!user) throw new Error('Must be logged in to purchase leads');
    
    try {
      const leadRef = doc(db, 'leads', leadId);
      await updateDoc(leadRef, {
        status: 'Purchased',
        purchasedBy: user.id,
        purchasedAt: Timestamp.now().toDate().toISOString()
      });
    } catch (error) {
      console.error('Error purchasing lead:', error);
      throw error;
    }
  };

  return (
    <LeadContext.Provider value={{ leads, loading, addLead, purchaseLead }}>
      {children}
    </LeadContext.Provider>
  );
}

export function useLeads() {
  const context = useContext(LeadContext);
  if (!context) {
    throw new Error('useLeads must be used within a LeadProvider');
  }
  return context;
}