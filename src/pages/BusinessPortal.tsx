import React, { useState } from 'react';
import { Users, Package, LogOut } from 'lucide-react';
import { useLeads } from '../context/LeadContext';
import { useAuth } from '../context/AuthContext';
import LeadTable from '../components/LeadTable';
import AuthModal from '../components/AuthModal';

export default function BusinessPortal() {
  const { state } = useLeads();
  const { user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const availableLeads = state.leads.filter(lead => lead.status === 'New');
  const purchasedLeads = state.leads.filter(lead => 
    lead.status === 'Purchased' && lead.purchasedBy === user?.id
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {user ? (
          <>
            <div className="flex justify-end mb-6">
              <button
                onClick={logout}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Purchased Leads</p>
                    <p className="text-2xl font-bold text-gray-900">{purchasedLeads.length}</p>
                  </div>
                  <div className="bg-green-500 p-3 rounded-lg">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Available Leads</p>
                    <p className="text-2xl font-bold text-gray-900">{availableLeads.length}</p>
                  </div>
                  <div className="bg-blue-500 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {purchasedLeads.length > 0 && (
              <LeadTable leads={purchasedLeads} type="purchased" />
            )}
          </>
        ) : (
          <div className="max-w-2xl mx-auto mb-12 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Access the Business Portal</h2>
              <p className="text-gray-600 mb-8">
                Sign in to your account or create a new one to start purchasing leads
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="btn-primary"
              >
                Sign In / Create Account
              </button>
            </div>
          </div>
        )}

        <LeadTable leads={availableLeads} type="available" />

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      </div>
    </div>
  );
}