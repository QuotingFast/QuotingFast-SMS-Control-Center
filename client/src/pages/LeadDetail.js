import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    fetchLeadDetails();
  }, [id]);

  const fetchLeadDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch lead details
      const leadResponse = await axios.get(`/api/leads/${id}`);
      setLead(leadResponse.data);
      
      // Fetch messages for this lead
      const messagesResponse = await axios.get(`/api/leads/${id}/messages`);
      setMessages(messagesResponse.data);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching lead details:', err);
      setError('Failed to load lead details. Please try again later.');
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    try {
      setSendingMessage(true);
      
      await axios.post(`/api/leads/${id}/messages`, {
        content: newMessage
      });
      
      // Refresh messages
      const messagesResponse = await axios.get(`/api/leads/${id}/messages`);
      setMessages(messagesResponse.data);
      
      // Clear input
      setNewMessage('');
      setSendingMessage(false);
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again.');
      setSendingMessage(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.patch(`/api/leads/${id}`, {
        status: newStatus
      });
      
      // Update lead in state
      setLead({
        ...lead,
        status: newStatus
      });
    } catch (err) {
      console.error('Error updating lead status:', err);
      alert('Failed to update lead status. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'CONVERTED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'OPTED_OUT':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button 
          className="mt-2 btn btn-danger"
          onClick={fetchLeadDetails}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">Lead not found.</p>
        <Link to="/leads" className="btn btn-primary mt-4">
          Back to Leads
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <Link to="/leads" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 mb-2 inline-block">
            &larr; Back to Leads
          </Link>
          <h1 className="text-2xl font-bold">
            {lead.firstName} {lead.lastName}
          </h1>
        </div>
        <div className="flex gap-2">
          <button 
            className="btn btn-secondary"
            onClick={() => navigate(`/leads/${id}/edit`)}
          >
            Edit Lead
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Details */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Lead Information</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <div className="flex items-center mt-1">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(lead.status)}`}>
                    {lead.status.replace('_', ' ')}
                  </span>
                  <div className="dropdown ml-2">
                    <button className="btn btn-xs btn-secondary">Change</button>
                    <div className="dropdown-menu">
                      <button 
                        className="dropdown-item" 
                        onClick={() => handleStatusChange('ACTIVE')}
                      >
                        Active
                      </button>
                      <button 
                        className="dropdown-item" 
                        onClick={() => handleStatusChange('CONVERTED')}
                      >
                        Converted
                      </button>
                      <button 
                        className="dropdown-item" 
                        onClick={() => handleStatusChange('INACTIVE')}
                      >
                        Inactive
                      </button>
                      <button 
                        className="dropdown-item text-red-600" 
                        onClick={() => handleStatusChange('OPTED_OUT')}
                      >
                        Opted Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                <p className="font-medium">{lead.phone}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="font-medium">{lead.email || 'Not provided'}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Vehicle</p>
                <p className="font-medium">
                  {lead.vehicleYear} {lead.vehicleMake} {lead.vehicleModel}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Potential Savings</p>
                <p className="font-medium">{lead.potentialSavings || 'Not calculated'}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                <p className="font-medium">{formatDate(lead.createdAt)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                <p className="font-medium">{formatDate(lead.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="lg:col-span-2">
          <div className="card h-full flex flex-col">
            <h2 className="text-lg font-semibold mb-4">Messages</h2>
            
            <div className="flex-grow overflow-y-auto mb-4 space-y-4">
              {messages.length > 0 ? (
                messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`p-3 rounded-lg max-w-[80%] ${
                      message.direction === 'OUTBOUND' 
                        ? 'bg-primary-100 dark:bg-primary-900/30 ml-auto' 
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(message.createdAt)} • 
                      {message.direction === 'OUTBOUND' ? ' Sent' : ' Received'}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No messages yet.
                </div>
              )}
            </div>
            
            {lead.status !== 'OPTED_OUT' && (
              <form onSubmit={handleSendMessage} className="mt-auto">
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input flex-grow"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    maxLength="160"
                    disabled={sendingMessage}
                  />
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={!newMessage.trim() || sendingMessage}
                  >
                    {sendingMessage ? 'Sending...' : 'Send'}
                  </button>
                </div>
                <div className="text-xs text-right mt-1 text-gray-500 dark:text-gray-400">
                  {newMessage.length}/160 characters
                </div>
              </form>
            )}
            
            {lead.status === 'OPTED_OUT' && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
                <p className="text-red-600 dark:text-red-400">
                  This lead has opted out. You cannot send messages to this number.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetail;
