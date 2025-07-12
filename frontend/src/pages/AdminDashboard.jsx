import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../auth/AuthContext';
import { FaUserShield, FaSearch, FaKey, FaUsers, FaChartLine, FaEye, FaTimes, FaPhone, FaIdCard, FaEnvelope, FaCalendar } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function AdminDashboard() {
  const [pending, setPending] = useState([]);
  const [reporters, setReporters] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      const [pendingRes, reportersRes] = await Promise.all([
        api.get('/admin/requests', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get('/admin/reporters', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setPending(pendingRes.data);
      setReporters(reportersRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    }
  };

  const previewUser = async (userId) => {
    try {
      const response = await api.get(`/admin/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedUser(response.data);
      setShowModal(true);
    } catch (error) {
      console.error('Error loading user details:', error);
      toast.error('Failed to load user details');
    }
  };

  const approveUser = async () => {
    if (!selectedUser) return;
    
    setIsApproving(true);
    try {
      const response = await api.post('/admin/approve', { user_id: selectedUser.id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Reporter approved! License key: ${response.data.license_key}`);
      setShowModal(false);
      setSelectedUser(null);
      loadData(); // Reload data to update both tables
    } catch (err) {
      toast.error('Failed to approve reporter.');
    } finally {
      setIsApproving(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  // Stats (example, you can adjust as needed)
  const totalReporters = reporters.length;
  const totalPending = pending.length;
  const totalEntities = totalReporters+totalPending

  return (
    <div className='bg-gradient-to-br from-white via-gray-100 to-red-50'>
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-12">
      <div className="bg-gradient-to-r from-red-800 to-red-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold">
              Admin Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm opacity-75">Welcome, Admin</span>
            </div>
          </div>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-white/20">
                  <FaKey className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium opacity-75">Total Entities</p>
                  <p className="text-2xl font-semibold">{totalEntities}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-white/20">
                  <FaUsers className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium opacity-75">Total Reporters</p>
                  <p className="text-2xl font-semibold">{totalReporters}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-white/20">
                  <FaUserShield className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium opacity-75">Pending Approvals</p>
                  <p className="text-2xl font-semibold">{totalPending}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Section */}
      <div className="bg-white rounded-sm shadow-sm p-8 mb-12 border border-gray-100 mt-12">
        <div className="flex items-center mb-6">
          <div className="p-3 rounded-lg bg-red-50 mr-4">
            <FaUserShield className="h-6 w-6 text-red-800" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Pending Reporter Registrations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-red-50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-red-700 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-red-700 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-red-700 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-red-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pending.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No pending requests.</td>
                </tr>
              ) : (
                pending.map(u => (
                  <tr key={u.id} className="hover:bg-red-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{u.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{u.phone_number || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <button 
                        onClick={() => previewUser(u.id)} 
                        className="bg-blue-900 text-white px-3 py-1 rounded hover:bg-blue-700 transition flex items-center space-x-1"
                      >
                        <FaEye className="h-4 w-4" />
                        <span>Preview</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approved Reporters Table */}
      <div className="bg-white shadow-sm p-8 mb-18 border border-gray-100">
        <div className="flex items-center mb-6">
          <div className="p-3 rounded-lg bg-red-50 mr-4">
            <FaUserShield className="h-6 w-6 text-red-800" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Approved Reporters</h2>
        </div>
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search reporters by name, email, or license..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-red-800 focus:border-red-800 sm:text-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-red-50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-red-700 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-red-700 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-red-700 uppercase tracking-wider">License</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-red-700 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-red-700 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reporters && reporters.length > 0 ? (
                reporters
                  .filter(r =>
                    search === "" ||
                    r.name.toLowerCase().includes(search.toLowerCase()) ||
                    r.email.toLowerCase().includes(search.toLowerCase()) ||
                    (r.license && r.license.toLowerCase().includes(search.toLowerCase()))
                  )
                  .map(r => (
                    <tr key={r.id} className="hover:bg-red-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">{r.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">{r.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-gray-700">{r.license || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={async () => {
                            if(window.confirm(`Revoke reporter ${r.name}?`)) {
                              try {
                                await api.post('/admin/revoke', { user_id: r.id }, {
                                  headers: { Authorization: `Bearer ${token}` }
                                });
                                setReporters(reporters.filter(rep => rep.id !== r.id));
                                toast.success('Reporter revoked.');
                              } catch (err) {
                                toast.error('Failed to revoke reporter.');
                              }
                            } else {
                              toast.info('Revoke cancelled.');
                            }
                          }}
                          className="bg-red-700 text-white px-4 py-1 rounded hover:bg-red-800 transition"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No approved reporters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800">Reporter Preview</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Basic Info */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h4>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <FaUserShield className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="text-sm text-gray-500">Full Name</p>
                          <p className="font-medium text-gray-800">{selectedUser.name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <FaEnvelope className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="text-sm text-gray-500">Email Address</p>
                          <p className="font-medium text-gray-800">{selectedUser.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <FaPhone className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="text-sm text-gray-500">Phone Number</p>
                          <p className="font-medium text-gray-800">{selectedUser.phone_number || 'Not provided'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <FaIdCard className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="text-sm text-gray-500">Citizenship Number</p>
                          <p className="font-medium text-gray-800">{selectedUser.citizenship_number || 'Not provided'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <FaCalendar className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="text-sm text-gray-500">Registration Date</p>
                          <p className="font-medium text-gray-800">
                            {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'Not available'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Photos */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Documents & Photos</h4>
                    <div className="space-y-4">
                      {/* Profile Photo */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Profile Photo</p>
                        {selectedUser.profile_photo_url ? (
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <img 
                              src={selectedUser.profile_photo_url} 
                              alt="Profile Photo"
                              className="w-full h-48 object-cover"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/400x300?text=Profile+Photo+Not+Available';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="border border-gray-200 rounded-lg h-48 flex items-center justify-center bg-gray-50">
                            <p className="text-gray-500">No profile photo provided</p>
                          </div>
                        )}
                      </div>

                      {/* ID Card */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Reporter ID Card</p>
                        {selectedUser.reporter_id_card_url ? (
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <img 
                              src={selectedUser.reporter_id_card_url} 
                              alt="Reporter ID Card"
                              className="w-full h-48 object-cover"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/400x300?text=ID+Card+Not+Available';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="border border-gray-200 rounded-lg h-48 flex items-center justify-center bg-gray-50">
                            <p className="text-gray-500">No ID card provided</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={approveUser}
                disabled={isApproving}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isApproving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Approving...</span>
                  </>
                ) : (
                  <>
                    <FaKey className="h-4 w-4" />
                    <span>Approve & Generate License</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
} 