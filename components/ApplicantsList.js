// components/ApplicantsList.js
'use client';

import { useState, useEffect } from 'react';
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { User, Phone, Mail, MapPin, Briefcase, Tag, Eye, Save, Check, X, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const supabase = createPagesBrowserClient();

export default function ApplicantsList() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingTokens, setSavingTokens] = useState({});
  const [successMessages, setSuccessMessages] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('full_name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [availableColumns, setAvailableColumns] = useState([]);

  // First, check what columns are available in the applicants table
  const checkTableSchema = async () => {
    try {
      // Try to get a single record to see what fields exist
      const { data: sampleData, error: sampleError } = await supabase
        .from('applicants')
        .select('*')
        .limit(1)
        .single();

      if (!sampleError && sampleData) {
        // Extract available columns from the sample data
        const columns = Object.keys(sampleData);
        setAvailableColumns(columns);
        console.log('Available columns:', columns);
        return columns;
      }
      
      // If we can't get a sample, use a safe default query
      const { data: allData, error: allError } = await supabase
        .from('applicants')
        .select('*')
        .limit(5);

      if (!allError && allData && allData.length > 0) {
        const columns = Object.keys(allData[0]);
        setAvailableColumns(columns);
        return columns;
      }

      return [];
    } catch (err) {
      console.error('Error checking table schema:', err);
      return [];
    }
  };

  // Build safe select query based on available columns
  const buildSafeSelect = (columns) => {
    const safeColumns = [
      'id',
      'full_name',
      'phone',
      'email',
      'location',
      'avatar_url',
      'specialist',
      'specialties',
      'token',
      'created_at',
      'updated_at'
    ].filter(col => columns.includes(col));

    // If none of the expected columns exist, use a wildcard
    if (safeColumns.length === 0) {
      return '*';
    }

    return safeColumns.join(',');
  };

  // Fetch all applicants with safe query
  const fetchApplicants = async () => {
    try {
      setLoading(true);
      setError(null);

      // First check what columns are available
      const columns = await checkTableSchema();
      
      if (columns.length === 0) {
        // Try a simple wildcard query
        const { data, error } = await supabase
          .from('applicants')
          .select('*')
          .order('created_at', { ascending: sortDirection === 'asc' });

        if (error) throw error;
        setApplicants(data || []);
        return;
      }

      // Build safe select query
      const selectQuery = buildSafeSelect(columns);
      
      // Execute the query
      const { data, error } = await supabase
        .from('applicants')
        .select(selectQuery)
        .order(sortField === 'full_name' ? 'full_name' : 'created_at', { 
          ascending: sortDirection === 'asc' 
        });

      if (error) {
        // If there's still an error, try with just basic columns
        console.warn('Primary query failed, trying fallback:', error);
        
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('applicants')
          .select('id, full_name, email, created_at')
          .order('created_at', { ascending: sortDirection === 'asc' });

        if (fallbackError) throw fallbackError;
        
        setApplicants(fallbackData || []);
      } else {
        setApplicants(data || []);
      }
    } catch (err) {
      console.error('Error fetching applicants:', err);
      setError(`Failed to load applicants: ${err.message}. Please check your database schema.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [sortField, sortDirection]);

  // Handle token update - only if token column exists
  const updateToken = async (applicantId, newToken) => {
    if (!availableColumns.includes('token')) {
      setError('Token column not found in database. Please add a "token" column to the applicants table.');
      return;
    }

    try {
      setSavingTokens(prev => ({ ...prev, [applicantId]: true }));
      
      // Parse the token value
      const tokenValue = parseInt(newToken);
      if (isNaN(tokenValue)) {
        throw new Error('Please enter a valid number');
      }

      const { error } = await supabase
        .from('applicants')
        .update({ 
          token: tokenValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicantId);

      if (error) throw error;

      // Update local state
      setApplicants(prev => prev.map(applicant => 
        applicant.id === applicantId 
          ? { ...applicant, token: tokenValue }
          : applicant
      ));

      // Show success message
      setSuccessMessages(prev => ({ ...prev, [applicantId]: 'Token updated successfully!' }));
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessages(prev => {
          const newMessages = { ...prev };
          delete newMessages[applicantId];
          return newMessages;
        });
      }, 3000);

    } catch (err) {
      console.error('Error updating token:', err);
      setError(`Failed to update token: ${err.message}`);
    } finally {
      setSavingTokens(prev => ({ ...prev, [applicantId]: false }));
    }
  };

  // Handle input change
  const handleTokenChange = (applicantId, value) => {
    // Update local state immediately for responsive UI
    setApplicants(prev => prev.map(applicant => 
      applicant.id === applicantId 
        ? { ...applicant, token: value === '' ? null : parseInt(value) }
        : applicant
    ));
  };

  // Handle save button click
  const handleSaveToken = (applicantId) => {
    const applicant = applicants.find(a => a.id === applicantId);
    if (applicant) {
      updateToken(applicantId, applicant.token || 0);
    }
  };

  // Handle enter key press
  const handleKeyPress = (e, applicantId) => {
    if (e.key === 'Enter') {
      handleSaveToken(applicantId);
    }
  };

  // Filter applicants based on search term
  const filteredApplicants = applicants.filter(applicant => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (applicant.full_name?.toLowerCase() || '').includes(searchLower) ||
      (applicant.email?.toLowerCase() || '').includes(searchLower) ||
      (applicant.phone?.toLowerCase() || '').includes(searchLower) ||
      (applicant.location?.toLowerCase() || '').includes(searchLower) ||
      (applicant.specialist?.toLowerCase() || '').includes(searchLower) ||
      (applicant.specialties?.toLowerCase() || '').includes(searchLower)
    );
  });

  // Sort handler
  const handleSort = (field) => {
    if (availableColumns.includes(field) || field === 'created_at') {
      if (sortField === field) {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
        setSortField(field);
        setSortDirection('asc');
      }
    }
  };

  // Sort indicator component
  const SortIndicator = ({ field }) => {
    if (sortField !== field) return null;
    return (
      <span className="ml-1">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  // Get column display name
  const getColumnDisplayName = (column) => {
    const columnMap = {
      'id': 'ID',
      'full_name': 'Name',
      'phone': 'Phone',
      'email': 'Email',
      'location': 'Location',
      'avatar_url': 'Avatar',
      'specialist': 'Specialist',
      'specialties': 'Specialties',
      'token': 'Tokens',
      'created_at': 'Created',
      'updated_at': 'Updated'
    };
    return columnMap[column] || column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading applicants...</p>
              <p className="text-sm text-gray-500 mt-2">Checking database schema...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 md:p-6">
            <div className="flex items-center gap-2 text-red-700 mb-3">
              <AlertCircle size={20} />
              <h3 className="font-medium">Database Schema Error</h3>
            </div>
            <p className="text-red-600 mb-4">{error}</p>
            
            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded mb-4">
              <h4 className="font-medium text-yellow-800 mb-2">Available Columns:</h4>
              {availableColumns.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableColumns.map(col => (
                    <span key={col} className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                      {col}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-yellow-700">No columns detected or table doesn't exist</p>
              )}
            </div>
            
            <div className="space-y-3">
              <button
                onClick={fetchApplicants}
                className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition mr-3"
              >
                Try Again
              </button>
              
              <div className="text-sm text-gray-600 mt-4">
                <p className="font-medium mb-1">Required columns for full functionality:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><code className="bg-gray-100 px-1 py-0.5 rounded">id</code> (Primary Key)</li>
                  <li><code className="bg-gray-100 px-1 py-0.5 rounded">full_name</code></li>
                  <li><code className="bg-gray-100 px-1 py-0.5 rounded">email</code></li>
                  <li><code className="bg-gray-100 px-1 py-0.5 rounded">token</code> (optional for token management)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Applicants List</h1>
          <p className="text-gray-600">
            Manage and view all applicants. Total: {applicants.length} applicants
          </p>
          {availableColumns.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium">Available fields:</span>
              <span className="text-xs">{availableColumns.length} columns detected</span>
            </div>
          )}
        </div>

        {/* Search and Stats */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search applicants by name, email, phone, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Showing:</span> {filteredApplicants.length} of {applicants.length}
              </div>
              <button
                onClick={fetchApplicants}
                className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Database Warning */}
        {!availableColumns.includes('token') && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-yellow-600" size={20} />
              <div>
                <h3 className="font-medium text-yellow-800">Token Column Missing</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  The "token" column was not found in your applicants table. Token management features will be disabled.
                  To enable token management, add a "token" column (integer type) to your applicants table.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Applicants Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('full_name')}>
                    <div className="flex items-center gap-2">
                      <User size={14} />
                      {availableColumns.includes('full_name') ? 'Name' : 'ID'}
                      <SortIndicator field="full_name" />
                    </div>
                  </th>
                  
                  {availableColumns.includes('specialist') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Briefcase size={14} />
                        Specialist
                      </div>
                    </th>
                  )}
                  
                  {availableColumns.includes('specialties') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Tag size={14} />
                        Specialties
                      </div>
                    </th>
                  )}
                  
                  {availableColumns.includes('token') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('token')}>
                      <div className="flex items-center gap-2">
                        <Tag size={14} />
                        Tokens
                        <SortIndicator field="token" />
                      </div>
                    </th>
                  )}
                  
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Info
                  </th>
                  
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplicants.length === 0 ? (
                  <tr>
                    <td colSpan={availableColumns.includes('token') ? 6 : 5} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <User size={48} className="text-gray-300 mb-3" />
                        <p className="text-lg font-medium text-gray-400">No applicants found</p>
                        <p className="text-gray-400">
                          {searchTerm ? 'Try a different search term' : 'No applicants in the database'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredApplicants.map((applicant) => (
                    <tr key={applicant.id} className="hover:bg-gray-50 transition">
                      {/* Name & Avatar */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {availableColumns.includes('avatar_url') && applicant.avatar_url ? (
                              <img
                                src={applicant.avatar_url}
                                alt={applicant.full_name || 'Applicant'}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User size={20} className="text-blue-600" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {applicant.full_name || applicant.email?.split('@')[0] || 'Applicant'}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {applicant.id?.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Specialist */}
                      {availableColumns.includes('specialist') && (
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {applicant.specialist || 'Not specified'}
                          </div>
                        </td>
                      )}

                      {/* Specialties */}
                      {availableColumns.includes('specialties') && (
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs">
                            {applicant.specialties ? (
                              <div className="flex flex-wrap gap-1">
                                {applicant.specialties.split(',').map((specialty, index) => (
                                  <span
                                    key={index}
                                    className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                                  >
                                    {specialty.trim()}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">No specialties</span>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Tokens */}
                      {availableColumns.includes('token') && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                value={applicant.token || ''}
                                onChange={(e) => handleTokenChange(applicant.id, e.target.value)}
                                onKeyPress={(e) => handleKeyPress(e, applicant.id)}
                                className="w-24 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                              />
                            </div>
                            <button
                              onClick={() => handleSaveToken(applicant.id)}
                              disabled={savingTokens[applicant.id]}
                              className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 transition disabled:opacity-50"
                            >
                              {savingTokens[applicant.id] ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                  <span className="text-xs">Saving</span>
                                </>
                              ) : (
                                <>
                                  <Save size={12} />
                                  <span className="text-xs">Save</span>
                                </>
                              )}
                            </button>
                          </div>
                          {successMessages[applicant.id] && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                              <Check size={10} />
                              {successMessages[applicant.id]}
                            </div>
                          )}
                        </td>
                      )}

                      {/* Contact Info */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {availableColumns.includes('email') && applicant.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail size={12} className="text-gray-400" />
                              <span className="text-gray-700">{applicant.email}</span>
                            </div>
                          )}
                          {availableColumns.includes('phone') && applicant.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone size={12} className="text-gray-400" />
                              <span className="text-gray-700">{applicant.phone}</span>
                            </div>
                          )}
                          {availableColumns.includes('location') && applicant.location && (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin size={12} className="text-gray-400" />
                              <span className="text-gray-700">{applicant.location}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/profile/[id]`.replace('[id]', applicant.id)}
                            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
                          >
                            <Eye size={14} />
                            View Profile
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          {filteredApplicants.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  {filteredApplicants.length} applicant{filteredApplicants.length !== 1 ? 's' : ''} displayed
                </div>
                <div className="text-sm text-gray-600">
                  {availableColumns.includes('token') 
                    ? 'Tokens can be updated instantly. Changes are saved to the database.'
                    : 'Add a "token" column to enable token management.'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Database Schema Information */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">📋 Database Information:</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p><strong>Table:</strong> applicants</p>
            <p><strong>Total Records:</strong> {applicants.length}</p>
            <p><strong>Detected Columns:</strong> {availableColumns.length}</p>
            {availableColumns.length > 0 && (
              <div className="mt-2">
                <p className="font-medium mb-1">Available Fields:</p>
                <div className="flex flex-wrap gap-1">
                  {availableColumns.map(col => (
                    <span key={col} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}