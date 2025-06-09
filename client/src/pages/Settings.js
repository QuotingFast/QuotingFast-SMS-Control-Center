import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Settings = () => {
  const [settings, setSettings] = useState({
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioPhoneNumber: '',
    tcpaStartHour: 8,
    tcpaEndHour: 21,
    companyName: '',
    companyLogo: '',
    appUrl: '',
    redirectUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/settings');
      setSettings(response.data);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings. Please try again later.');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: name === 'tcpaStartHour' || name === 'tcpaEndHour' ? parseInt(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage('');
      
      await axios.put('/api/settings', settings);
      
      setSuccessMessage('Settings saved successfully!');
      setSaving(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">System Settings</h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <p className="text-green-600 dark:text-green-400">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Twilio Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Twilio Account SID</label>
              <input
                type="text"
                name="twilioAccountSid"
                className="input w-full"
                value={settings.twilioAccountSid}
                onChange={handleChange}
                required
              />
            </div>
            
            <div>
              <label className="form-label">Twilio Auth Token</label>
              <input
                type="password"
                name="twilioAuthToken"
                className="input w-full"
                value={settings.twilioAuthToken}
                onChange={handleChange}
                required
              />
            </div>
            
            <div>
              <label className="form-label">Twilio Phone Number</label>
              <input
                type="text"
                name="twilioPhoneNumber"
                className="input w-full"
                value={settings.twilioPhoneNumber}
                onChange={handleChange}
                placeholder="+1XXXXXXXXXX"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Must be in E.164 format (e.g., +1XXXXXXXXXX)
              </p>
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">TCPA Compliance Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Allowed Start Hour (Local Time)</label>
              <select
                name="tcpaStartHour"
                className="select w-full"
                value={settings.tcpaStartHour}
                onChange={handleChange}
                required
              >
                {[...Array(24)].map((_, i) => (
                  <option key={i} value={i}>
                    {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                TCPA regulations typically require 8 AM
              </p>
            </div>
            
            <div>
              <label className="form-label">Allowed End Hour (Local Time)</label>
              <select
                name="tcpaEndHour"
                className="select w-full"
                value={settings.tcpaEndHour}
                onChange={handleChange}
                required
              >
                {[...Array(24)].map((_, i) => (
                  <option key={i} value={i}>
                    {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                TCPA regulations typically require 9 PM
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-yellow-700 dark:text-yellow-400">
              <strong>Important:</strong> TCPA regulations require that SMS messages are only sent between 
              8:00 AM and 9:00 PM in the recipient's local time zone. Changing these settings may put you 
              at risk of non-compliance.
            </p>
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Company Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Company Name</label>
              <input
                type="text"
                name="companyName"
                className="input w-full"
                value={settings.companyName}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="form-label">Company Logo URL</label>
              <input
                type="text"
                name="companyLogo"
                className="input w-full"
                value={settings.companyLogo}
                onChange={handleChange}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Application URLs</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">App URL</label>
              <input
                type="text"
                name="appUrl"
                className="input w-full"
                value={settings.appUrl}
                onChange={handleChange}
                placeholder="https://example.com"
              />
            </div>
            
            <div>
              <label className="form-label">Redirect URL</label>
              <input
                type="text"
                name="redirectUrl"
                className="input w-full"
                value={settings.redirectUrl}
                onChange={handleChange}
                placeholder="https://example.com/quote"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
