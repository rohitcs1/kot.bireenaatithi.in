import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../api';
import './Settings.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showStationModal, setShowStationModal] = useState(false);
  const [editingStation, setEditingStation] = useState(null);

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    owner_name: '',
    owner_phone: '',
    owner_email: '',
    city: '',
    state: '',
    pincode: '',
    logo_url: ''
  });
  const [generalSettingsLoading, setGeneralSettingsLoading] = useState(false);
  const [generalSettingsError, setGeneralSettingsError] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');

  // Helper to produce absolute URL for files served by backend
  const makeAbsoluteUrl = (url) => {
    if (!url) return '';
    try {
      // if already absolute, return as-is
      const u = new URL(url);
      return url;
    } catch (e) {
      // relative path -> prepend API base
      // api.defaults.baseURL contains '/api' suffix; static files are served from the API root (without '/api')
      const rawBase = api.defaults.baseURL || '';
      const base = rawBase.replace(/\/api\/?$/, '');
      return base.replace(/\/$/, '') + '/' + url.replace(/^\//, '');
    }
  };

  // Tax Settings
  const [taxSettings, setTaxSettings] = useState({
    gst_rate: 18,
    service_charge: 0,
    service_charge_enabled: false
  });
  const [taxSettingsLoading, setTaxSettingsLoading] = useState(false);
  const [taxSettingsError, setTaxSettingsError] = useState('');

  // Printer Settings
  const [printers, setPrinters] = useState([
    { id: 1, name: 'Kitchen Printer 1', type: 'KOT', status: 'Connected', ip: '192.168.1.100' },
    { id: 2, name: 'Receipt Printer', type: 'Receipt', status: 'Connected', ip: '192.168.1.101' },
    { id: 3, name: 'Bar Printer', type: 'KOT', status: 'Disconnected', ip: '192.168.1.102' }
  ]);

  // Kitchen Stations
  const [stations, setStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [stationsError, setStationsError] = useState('');

  const [newStation, setNewStation] = useState({
    name: '',
    station_type: '',
    printer_id: ''
  });

  // Users
  const [users, setUsers] = useState([]);

  const [inviteData, setInviteData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'manager',
    password: '',
    confirmPassword: ''
  });

  const authUser = useSelector((state) => state.auth.user);

  // Do not show the currently logged-in user in the users list (prevents self-disable/delete)
  const displayedUsers = users.filter(u => {
    try {
      return String(u.id) !== String(authUser?.id);
    } catch (e) {
      return true;
    }
  });

  useEffect(() => {
    let mounted = true;
    api.get('/users')
      .then(res => { if (mounted) setUsers(res.data?.users || []); })
      .catch(err => console.warn('Failed to fetch users', err));
    
    // Fetch stations
    api.get('/stations')
      .then(res => { 
        if (mounted) setStations(res.data?.stations || []);
      })
      .catch(err => {
        console.warn('Failed to fetch stations', err);
        if (mounted) setStationsError('Failed to load stations');
      });
    
    // Fetch general settings
    setGeneralSettingsLoading(true);
    api.get('/general')
      .then(res => {
        if (mounted && res.data?.data) {
          setGeneralSettings(res.data.data);
          if (res.data.data.logo_url) {
            setLogoPreview(makeAbsoluteUrl(res.data.data.logo_url));
          }
          setGeneralSettingsError('');
        }
      })
      .catch(err => {
        console.warn('Failed to fetch general settings', err);
        if (mounted) setGeneralSettingsError('Failed to load general settings');
      })
      .finally(() => {
        if (mounted) setGeneralSettingsLoading(false);
      });
    
    // Fetch tax settings
    setTaxSettingsLoading(true);
    api.get('/taxes')
      .then(res => {
        if (mounted && res.data?.data) {
          setTaxSettings(res.data.data);
          setTaxSettingsError('');
        }
      })
      .catch(err => {
        console.warn('Failed to fetch tax settings', err);
        if (mounted) setTaxSettingsError('Failed to load tax settings');
      })
      .finally(() => {
        if (mounted) setTaxSettingsLoading(false);
      });
    
    return () => { mounted = false; };
  }, []);

  // Show toast
  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Handle Save
  const handleSave = async () => {
    try {
      if (activeTab === 'general') {
        // Save general settings
        const response = await api.put('/general', generalSettings);
        if (response.data?.success) {
          showToastMessage('General settings saved successfully!');
        }
      } else if (activeTab === 'taxes') {
        // Save tax settings
        const response = await api.post('/taxes/save', taxSettings);
        if (response.data?.success) {
          showToastMessage('Tax settings saved successfully!');
        }
      } else {
        // TODO: Replace with actual API calls for other tabs
        // await updatePrinters(printers);
        // await updateStations(stations);
        // await updateUsers(users);
        showToastMessage('Settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showToastMessage('Failed to save settings');
    }
  };

  // Handle Logo Upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      showToastMessage('Invalid file type. Only JPG, PNG, WebP, and SVG are allowed.');
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showToastMessage('File size exceeds 5MB limit.');
      return;
    }

    try {
      setLogoUploading(true);
      const formData = new FormData();
      formData.append('logo', file);

      const response = await api.post('/general/upload-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data?.success) {
        const url = makeAbsoluteUrl(response.data.data.logo_url);
        setLogoPreview(url);
        setGeneralSettings({ ...generalSettings, logo_url: response.data.data.logo_url });
        showToastMessage('Logo uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      showToastMessage('Failed to upload logo');
    } finally {
      setLogoUploading(false);
    }
  };

  // Handle Logo Delete
  const handleDeleteLogo = async () => {
    if (!window.confirm('Are you sure you want to delete the logo?')) return;

    try {
      setLogoUploading(true);
      const response = await api.delete('/general/delete-logo');

      if (response.data?.success) {
        setLogoPreview('');
        setGeneralSettings({ ...generalSettings, logo_url: '' });
        showToastMessage('Logo deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting logo:', error);
      showToastMessage('Failed to delete logo');
    } finally {
      setLogoUploading(false);
    }
  };

  // Handle Reset
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all changes?')) {
      // TODO: Fetch original settings from API
      showToastMessage('Settings reset to default values');
    }
  };

  // Handle Test Print
  const handleTestPrint = (printerId) => {
    // TODO: Replace with actual print functionality
    // await testPrint(printerId);
    showToastMessage(`Test print sent to printer ${printerId}`);
  };

  // Handle Detect Printers
  const handleDetectPrinters = () => {
    // TODO: Replace with actual printer detection
    // const detectedPrinters = await detectPrinters();
    // setPrinters(detectedPrinters);
    showToastMessage('Printer detection completed. Found 3 printers.');
  };

  // Handle Add/Edit Station
  const handleOpenStationModal = (station = null) => {
    if (station) {
      setEditingStation(station);
      setNewStation({
        name: station.name,
        station_type: station.station_type || '',
        printer_id: station.printer_id || ''
      });
    } else {
      setEditingStation(null);
      setNewStation({
        name: '',
        station_type: '',
        printer_id: ''
      });
    }
    setShowStationModal(true);
  };

  const handleSaveStation = async () => {
    if (!newStation.name.trim()) {
      alert('Please enter station name');
      return;
    }

    try {
      if (editingStation) {
        // Update existing station
        const res = await api.put(`/api/stations/${editingStation.id}`, {
          name: newStation.name,
          station_type: newStation.station_type || null,
          printer_id: newStation.printer_id || null
        });
        setStations(stations.map(s =>
          s.id === editingStation.id ? res.data.station : s
        ));
        showToastMessage('Station updated successfully!');
      } else {
        // Create new station
        const res = await api.post('/stations', {
          name: newStation.name,
          station_type: newStation.station_type || null,
          printer_id: newStation.printer_id || null
        });
        setStations([...stations, res.data.station]);
        showToastMessage('Station created successfully!');
      }
      setShowStationModal(false);
    } catch (err) {
      console.error('Failed to save station', err);
      alert(err?.response?.data?.error || 'Failed to save station');
    }
  };

  // Handle Invite/Create User
  const handleInviteUser = async () => {
    // basic validation
    if (!inviteData.name.trim() || !inviteData.email.trim() || !inviteData.phone.trim() || !inviteData.password) {
      alert('Please fill all required fields');
      return;
    }
    if (inviteData.password !== inviteData.confirmPassword) {
      alert('Password and Confirm Password do not match');
      return;
    }

    try {
      const payload = {
        name: inviteData.name,
        email: inviteData.email,
        phone: inviteData.phone,
        role: (inviteData.role || '').toLowerCase(),
        password: inviteData.password
      };
      const res = await api.post('/users', payload);
      showToastMessage('User created successfully');
      setShowInviteModal(false);
      setInviteData({ name: '', email: '', phone: '', role: 'manager', password: '', confirmPassword: '' });
      // refresh users list
      try {
        const list = await api.get('/users');
        setUsers(list.data?.users || []);
      } catch (err) {
        console.warn('Failed to refresh users', err);
      }
    } catch (err) {
      console.error('Invite/create user failed', err);
      const msg = err?.response?.data?.error || err.message || 'Failed to create user';
      alert(msg);
    }
  };

  // Handle Update User Role
  const handleUpdateUserRole = (userId, newRole) => {
    // TODO: Replace with actual API call
    // await updateUserRole(userId, newRole);
    setUsers(users.map(user =>
      user.id === userId ? { ...user, role: newRole } : user
    ));
    showToastMessage('User role updated successfully!');
  };

  // Handle Toggle User Status
  const handleToggleUserStatus = async (userId) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      const newStatus = user.status === 'active' ? 'disabled' : 'active';
      const endpoint = newStatus === 'active' ? 'enable' : 'disable';
      
      await api.patch(`/api/users/${userId}/${endpoint}`);
      setUsers(users.map(u => 
        u.id === userId ? { ...u, status: newStatus } : u
      ));
      showToastMessage(`User ${newStatus === 'active' ? 'activated' : 'disabled'} successfully!`);
    } catch (err) {
      console.error('Failed to toggle user status', err);
      alert(err?.response?.data?.error || 'Failed to update user status');
    }
  };

  // Handle Remove User
  const handleRemoveUser = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.delete(`/api/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
      showToastMessage('User removed successfully!');
    } catch (err) {
      console.error('Failed to remove user', err);
      alert(err?.response?.data?.error || 'Failed to remove user');
    }
  };

  // Handle Toggle Station Status
  const handleToggleStation = async (stationId) => {
    try {
      const res = await api.patch(`/api/stations/${stationId}/toggle`);
      setStations(stations.map(s =>
        s.id === stationId ? res.data.station : s
      ));
      showToastMessage('Station updated successfully!');
    } catch (err) {
      console.error('Failed to toggle station', err);
      alert(err?.response?.data?.error || 'Failed to update station');
    }
  };

  // Handle Delete Station
  const handleDeleteStation = async (stationId) => {
    if (!window.confirm('Are you sure you want to delete this station? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/api/stations/${stationId}`);
      setStations(stations.filter(s => s.id !== stationId));
      showToastMessage('Station deleted successfully!');
    } catch (err) {
      console.error('Failed to delete station', err);
      alert(err?.response?.data?.error || 'Failed to delete station');
    }
  };

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'taxes', label: 'Taxes' },
    { id: 'printers', label: 'Printers' },
    { id: 'stations', label: 'Stations' },
    { id: 'users', label: 'Users/Roles' }
  ];

  return (
    <div className="settings-page">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage your restaurant settings and preferences</p>
        </div>

        {/* Tabs */}
        <div className="settings-tabs-container">
          <div className="settings-tabs-wrapper">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="settings-tab-content">
            {/* General Tab */}
            {activeTab === 'general' && (
              <div>
                <h2 className="settings-section-title">General Settings</h2>
                {generalSettingsError && (
                  <div className="settings-error-message">{generalSettingsError}</div>
                )}
                {generalSettingsLoading ? (
                  <div className="settings-loading">Loading general settings...</div>
                ) : (
                  <>
                    {/* Logo Upload Section */}
                    <div className="settings-logo-section" style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Restaurant Logo</h3>
                      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                        {/* Logo Preview */}
                        <div style={{ flex: 1 }}>
                          <div style={{
                            width: '200px',
                            height: '200px',
                            borderRadius: '0.5rem',
                            border: '2px dashed #d1d5db',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#fff',
                            overflow: 'hidden'
                          }}>
                            {logoPreview ? (
                              <img src={logoPreview} alt="Logo Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            ) : (
                              <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏨</div>
                                <div style={{ fontSize: '0.875rem' }}>No logo uploaded</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Upload Controls */}
                        <div style={{ flex: 1 }}>
                          <label style={{
                            display: 'inline-block',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            borderRadius: '0.375rem',
                            cursor: logoUploading ? 'not-allowed' : 'pointer',
                            opacity: logoUploading ? 0.6 : 1,
                            marginBottom: '1rem',
                            fontWeight: '500'
                          }}>
                            {logoUploading ? 'Uploading...' : 'Choose Logo'}
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.webp,.svg"
                              onChange={handleLogoUpload}
                              disabled={logoUploading}
                              style={{ display: 'none' }}
                            />
                          </label>

                          {logoPreview && (
                            <button
                              onClick={handleDeleteLogo}
                              disabled={logoUploading}
                              style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                borderRadius: '0.375rem',
                                border: 'none',
                                cursor: logoUploading ? 'not-allowed' : 'pointer',
                                opacity: logoUploading ? 0.6 : 1,
                                marginLeft: '0.5rem',
                                fontWeight: '500'
                              }}
                            >
                              Delete Logo
                            </button>
                          )}

                          <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                            <p>Supported formats: JPG, PNG, WebP, SVG</p>
                            <p>Maximum file size: 5MB</p>
                            <p>Recommended size: 200x200px or larger</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Settings Form Grid */}
                    <div className="settings-form-grid">
                    <div className="settings-form-group">
                      <label className="settings-label required">Restaurant Name</label>
                      <input
                        type="text"
                        value={generalSettings.name || ''}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, name: e.target.value })}
                        className="settings-input"
                      />
                    </div>
                    <div className="settings-form-group">
                      <label className="settings-label">Phone Number</label>
                      <input
                        type="tel"
                        value={generalSettings.phone || ''}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, phone: e.target.value })}
                        className="settings-input"
                      />
                    </div>
                    <div className="settings-form-group full-width">
                      <label className="settings-label">Address</label>
                      <input
                        type="text"
                        value={generalSettings.address || ''}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, address: e.target.value })}
                        className="settings-input"
                      />
                    </div>
                    <div className="settings-form-group">
                      <label className="settings-label required">Email</label>
                      <input
                        type="email"
                        value={generalSettings.email || ''}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, email: e.target.value })}
                        className="settings-input"
                      />
                    </div>
                    <div className="settings-form-group">
                      <label className="settings-label">City</label>
                      <input
                        type="text"
                        value={generalSettings.city || ''}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, city: e.target.value })}
                        className="settings-input"
                      />
                    </div>
                    <div className="settings-form-group">
                      <label className="settings-label">State</label>
                      <input
                        type="text"
                        value={generalSettings.state || ''}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, state: e.target.value })}
                        className="settings-input"
                      />
                    </div>
                    <div className="settings-form-group">
                      <label className="settings-label">Pincode</label>
                      <input
                        type="text"
                        value={generalSettings.pincode || ''}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, pincode: e.target.value })}
                        className="settings-input"
                      />
                    </div>
                    <div className="settings-form-group">
                      <label className="settings-label">Currency</label>
                      <select
                        value={generalSettings.currency || 'INR'}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                        className="settings-select"
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                    <div className="settings-form-group">
                      <label className="settings-label">Timezone</label>
                      <select
                        value={generalSettings.timezone || 'Asia/Kolkata'}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                        className="settings-select"
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                      </select>
                    </div>
                  </div>
                  </>
                )}
              </div>
            )}

            {/* Taxes Tab */}
            {activeTab === 'taxes' && (
              <div>
                <h2 className="settings-section-title">Tax Settings</h2>
                {taxSettingsError && (
                  <div className="settings-error-message">{taxSettingsError}</div>
                )}
                {taxSettingsLoading ? (
                  <div className="settings-loading">Loading tax settings...</div>
                ) : (
                  <div className="settings-form-grid">
                    <div className="settings-form-group">
                      <label className="settings-label">GST Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={taxSettings.gst_rate || 0}
                        onChange={(e) => setTaxSettings({ ...taxSettings, gst_rate: parseFloat(e.target.value) || 0 })}
                        className="settings-input"
                      />
                    </div>
                    <div className="settings-form-group full-width">
                      <div className="settings-checkbox-wrapper">
                        <input
                          type="checkbox"
                          id="serviceChargeEnabled"
                          checked={taxSettings.service_charge_enabled || false}
                          onChange={(e) => setTaxSettings({ ...taxSettings, service_charge_enabled: e.target.checked })}
                          className="settings-checkbox"
                        />
                        <label htmlFor="serviceChargeEnabled" className="settings-checkbox-label">
                          Enable Service Charge
                        </label>
                      </div>
                      {taxSettings.service_charge_enabled && (
                        <div className="mt-4">
                          <label className="settings-label">Service Charge (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={taxSettings.service_charge || 0}
                            onChange={(e) => setTaxSettings({ ...taxSettings, service_charge: parseFloat(e.target.value) || 0 })}
                            className="settings-input"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Printers Tab */}
            {activeTab === 'printers' && (
              <div>
                <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                  <h2 className="settings-section-title" style={{ marginBottom: 0 }}>Printer Settings</h2>
                  <button
                    onClick={handleDetectPrinters}
                    className="settings-btn settings-btn-primary"
                  >
                    <svg className="settings-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Detect Printers
                  </button>
                </div>
                <div className="printer-detection-card">
                  <svg className="printer-detection-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <p className="printer-detection-text">Click "Detect Printers" to scan for available printers on your network</p>
                </div>
                <div>
                  {printers.map((printer) => (
                    <div key={printer.id} className="printer-card">
                      <div className="printer-card-header">
                        <div className="flex-1">
                          <div className="printer-name">
                            {printer.name}
                            <span className={`printer-status ${printer.status.toLowerCase()}`}>
                              {printer.status}
                            </span>
                          </div>
                          <div className="printer-details">
                            <div className="printer-detail-item">
                              <span className="printer-detail-label">Type:</span>
                              <span>{printer.type}</span>
                            </div>
                            <div className="printer-detail-item">
                              <span className="printer-detail-label">IP Address:</span>
                              <span>{printer.ip}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleTestPrint(printer.id)}
                          className="settings-btn settings-btn-test"
                        >
                          Test Print
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stations Tab */}
            {activeTab === 'stations' && (
              <div>
                <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                  <h2 className="settings-section-title" style={{ marginBottom: 0 }}>Kitchen Stations</h2>
                  <button
                    onClick={() => handleOpenStationModal()}
                    className="settings-btn settings-btn-primary"
                  >
                    <svg className="settings-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Station
                  </button>
                </div>
                {stationsError && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                    {stationsError}
                  </div>
                )}
                {stationsLoading ? (
                  <div className="text-center py-4 text-gray-500">Loading stations...</div>
                ) : stations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No stations created yet</div>
                ) : (
                  <div>
                    {stations.map((station) => (
                      <div key={station.id} className="station-card">
                        <div className="station-card-content">
                          <div className="station-info">
                            <div className="station-name">{station.name}</div>
                            <div className="station-printer">
                              {station.station_type ? `Type: ${station.station_type}` : 'No station type'}
                              {station.printer_id && ` • Printer: ${station.printer_id}`}
                            </div>
                          </div>
                          <div className="station-toggle">
                            <input
                              type="checkbox"
                              id={`station-${station.id}`}
                              checked={station.enabled}
                              onChange={(e) => handleToggleStation(station.id)}
                              className="settings-checkbox"
                            />
                            <label htmlFor={`station-${station.id}`} className="settings-checkbox-label">
                              Enabled
                            </label>
                          </div>
                          <button
                            onClick={() => handleOpenStationModal(station)}
                            className="station-edit-btn"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteStation(station.id)}
                            className="station-delete-btn"
                            title="Delete station"
                          >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Users/Roles Tab */}
            {activeTab === 'users' && (
              <div>
                <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                  <h2 className="settings-section-title" style={{ marginBottom: 0 }}>Users & Roles</h2>
                  <button
                    onClick={() => {
                      // set sensible default role depending on current user's role
                      const defaultRole = authUser?.role === 'manager' ? 'waiter' : 'manager';
                      setInviteData(prev => ({ ...prev, role: defaultRole }));
                      setShowInviteModal(true);
                    }}
                    className="settings-btn settings-btn-primary"
                  >
                    <svg className="settings-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Invite User
                  </button>
                </div>
                <div className="users-table-wrapper">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedUsers.map((user) => (
                        <tr key={user.id} className={user.status === 'disabled' ? 'user-row-disabled' : ''}>
                          <td>
                            <div className="user-name">{user.name}</div>
                          </td>
                          <td>
                            <div className="user-email">{user.email}</div>
                          </td>
                          <td>
                            <span className="user-role-text">
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => handleToggleUserStatus(user.id)}
                              className={`user-status-btn ${user.status.toLowerCase()}`}
                            >
                              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                            </button>
                          </td>
                          <td>
                            <button 
                              onClick={() => handleRemoveUser(user.id)}
                              className="user-action-btn user-action-btn-remove"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="settings-actions">
          <button
            onClick={handleReset}
            className="settings-btn-reset"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            className="settings-btn-save"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="settings-toast">
          <div className="settings-toast-content success">
            <svg className="settings-toast-icon success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="settings-toast-message">{toastMessage}</span>
            <button
              onClick={() => setShowToast(false)}
              className="settings-toast-close"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="settings-modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <h2 className="settings-modal-title">Create User</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="settings-modal-close"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="settings-modal-body">
              <div className="settings-form-grid">
                <div className="settings-form-group full-width">
                  <label className="settings-label required">Full Name</label>
                  <input
                    type="text"
                    value={inviteData.name}
                    onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                    className="settings-input"
                    placeholder="Enter full name"
                  />
                </div>
                <div className="settings-form-group full-width">
                  <label className="settings-label required">Email Address</label>
                  <input
                    type="email"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                    className="settings-input"
                    placeholder="Enter email"
                  />
                </div>
                <div className="settings-form-group full-width">
                  <label className="settings-label required">Phone Number</label>
                  <input
                    type="text"
                    value={inviteData.phone}
                    onChange={(e) => setInviteData({ ...inviteData, phone: e.target.value })}
                    className="settings-input"
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="settings-form-group full-width">
                  <label className="settings-label required">Role</label>
                  <select
                    value={inviteData.role}
                    onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                    className="settings-select"
                  >
                    {
                      // determine allowed roles for the invite form based on current user's role
                      (() => {
                        const role = authUser?.role || '';
                        let allowed = [];
                        if (role === 'manager') allowed = ['waiter', 'kitchen'];
                        else if (role === 'admin') allowed = ['manager', 'waiter', 'kitchen'];
                        else allowed = ['admin', 'manager', 'waiter', 'kitchen']; // superadmin or unknown
                        return allowed.map(r => (
                          <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                        ));
                      })()
                    }
                  </select>
                </div>

                <div className="settings-form-group full-width">
                  <label className="settings-label required">Password</label>
                  <input
                    type="password"
                    value={inviteData.password}
                    onChange={(e) => setInviteData({ ...inviteData, password: e.target.value })}
                    className="settings-input"
                    placeholder="Enter password"
                  />
                </div>
                <div className="settings-form-group full-width">
                  <label className="settings-label required">Confirm Password</label>
                  <input
                    type="password"
                    value={inviteData.confirmPassword}
                    onChange={(e) => setInviteData({ ...inviteData, confirmPassword: e.target.value })}
                    className="settings-input"
                    placeholder="Confirm password"
                  />
                </div>
              </div>
            </div>
              <div className="settings-modal-footer">
              <button
                onClick={() => setShowInviteModal(false)}
                className="settings-modal-btn settings-modal-btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleInviteUser}
                className="settings-modal-btn settings-modal-btn-submit"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Station Modal */}
      {showStationModal && (
        <div className="settings-modal-overlay" onClick={() => setShowStationModal(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <h2 className="settings-modal-title">
                {editingStation ? 'Edit Station' : 'Add Station'}
              </h2>
              <button
                onClick={() => setShowStationModal(false)}
                className="settings-modal-close"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="settings-modal-body">
              <div className="settings-form-grid">
                <div className="settings-form-group full-width">
                  <label className="settings-label required">Station Name</label>
                  <input
                    type="text"
                    value={newStation.name}
                    onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                    className="settings-input"
                    placeholder="e.g., Main, Bar, Dessert"
                  />
                </div>
                <div className="settings-form-group full-width">
                  <label className="settings-label">Station Type</label>
                  <input
                    type="text"
                    value={newStation.station_type}
                    onChange={(e) => setNewStation({ ...newStation, station_type: e.target.value })}
                    className="settings-input"
                    placeholder="e.g., Kitchen, Bar"
                  />
                </div>
                <div className="settings-form-group full-width">
                  <label className="settings-label">Printer ID</label>
                  <input
                    type="text"
                    value={newStation.printer_id}
                    onChange={(e) => setNewStation({ ...newStation, printer_id: e.target.value })}
                    className="settings-input"
                    placeholder="Enter printer ID or name"
                  />
                </div>
              </div>
            </div>
            <div className="settings-modal-footer">
              <button
                onClick={() => setShowStationModal(false)}
                className="settings-modal-btn settings-modal-btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStation}
                className="settings-modal-btn settings-modal-btn-submit"
              >
                {editingStation ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;


