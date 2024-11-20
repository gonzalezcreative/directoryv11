import React, { useState } from 'react';
import { MapPin, Calendar, ChevronDown, ChevronUp, Construction, PartyPopper, Stethoscope, DollarSign, User } from 'lucide-react';
import { Lead } from '../context/LeadContext';
import { useLeads } from '../context/LeadContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import PaymentModal from './PaymentModal';
import { LEAD_PRICE } from '../lib/stripe';

interface LeadTableProps {
  leads: Lead[];
  type: 'available' | 'purchased';
}

export default function LeadTable({ leads, type }: LeadTableProps) {
  const { purchaseLead, updateLeadStatus } = useLeads();
  const { user } = useAuth();
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePurchaseClick = (leadId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setSelectedLeadId(leadId);
    setShowPaymentModal(true);
    setError(null);
  };

  const handlePaymentSuccess = async () => {
    if (!selectedLeadId) return;
    try {
      await purchaseLead(selectedLeadId);
      setShowPaymentModal(false);
      setSelectedLeadId(null);
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Failed to purchase lead');
    }
  };

  const handleStatusChange = async (leadId: string, status: string) => {
    try {
      await updateLeadStatus(leadId, status);
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Failed to update lead status');
    }
  };

  const toggleExpand = (leadId: string) => {
    setExpandedLead(expandedLead === leadId ? null : leadId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryIcon = (category: string) => {
    const iconClass = "h-5 w-5 text-gray-400";
    switch (category.toLowerCase()) {
      case 'construction':
        return <Construction className={iconClass} />;
      case 'party':
        return <PartyPopper className={iconClass} />;
      case 'medical':
        return <Stethoscope className={iconClass} />;
      default:
        return <Construction className={iconClass} />;
    }
  };

  return (
    <>
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {type === 'available' ? 'Available Leads' : 'Purchased Leads'}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.map((lead) => (
                <React.Fragment key={lead.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getCategoryIcon(lead.category)}
                        <span className="ml-2">{lead.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                        {lead.city}
                      </div>
                    </td>
                    <td className="px-6 py-4">{lead.rentalDuration}</td>
                    <td className="px-6 py-4">{lead.budget}</td>
                    <td className="px-6 py-4">{formatDate(lead.startDate)}</td>
                    <td className="px-6 py-4">
                      {type === 'available' ? (
                        <button
                          onClick={() => handlePurchaseClick(lead.id)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Purchase (${LEAD_PRICE / 100})
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleExpand(lead.id)}
                          className="flex items-center text-blue-600 hover:text-blue-900"
                        >
                          {expandedLead === lead.id ? (
                            <ChevronUp className="h-4 w-4 ml-1" />
                          ) : (
                            <ChevronDown className="h-4 w-4 ml-1" />
                          )}
                          {expandedLead === lead.id ? 'Hide Details' : 'View Details'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {type === 'purchased' && expandedLead === lead.id && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-gray-900">Contact Information</h4>
                            <p>{lead.name}</p>
                            <p>{lead.email}</p>
                            <p>{lead.phone}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Status</h4>
                            <select
                              value={lead.leadStatus || ''}
                              onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            >
                              <option value="">Select status</option>
                              <option value="Contacted">Contacted</option>
                              <option value="Meeting Scheduled">Meeting Scheduled</option>
                              <option value="Quote Sent">Quote Sent</option>
                              <option value="Closed Won">Closed Won</option>
                              <option value="Closed Lost">Closed Lost</option>
                            </select>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
      
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        leadId={selectedLeadId || ''}
      />
    </>
  );
}