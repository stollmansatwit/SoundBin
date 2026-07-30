import { useEffect, useState } from 'react'
import { NavBar } from '../components/NavBar'
import { Header } from '../components/Header'
import { authFetch } from '../utils/api';
import { apiUrl } from '../config';
import { PlaybackControlBar } from '../components/playback/PlaybackControlBar';


// User/admin endpoints all live under /api, so bake that in once here.
const API_ROOT = apiUrl('/api');

type User = {
  user_id: number;
  username: string;
  display_name: string;
  register_date: string;
  is_active: boolean;
  is_admin: boolean;
  is_approved: boolean;
  last_login: string | null;
};

export default function User() {
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Profile form state
  const [usernameInput, setUsernameInput] = useState('')
  const [displayNameInput, setDisplayNameInput] = useState('')
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [profileSaving, setProfileSaving] = useState(false)

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordSaving, setPasswordSaving] = useState(false)

  // Admin panel state
  const [allUsers, setAllUsers] = useState<User[] | null>(null)
  const [adminMessage, setAdminMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [adminBusyUserId, setAdminBusyUserId] = useState<number | null>(null)

  const openNav = () => setIsNavOpen(true)
  const closeNav = () => setIsNavOpen(false)

  const fetchCurrentUser = () => {
    return authFetch(`${API_ROOT}/user`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        return response.json() as Promise<User>;
      })
      .then((data) => {
        setUser(data);
        setUsernameInput(data.username);
        setDisplayNameInput(data.display_name);
        return data;
      });
  };

  const fetchAllUsers = () => {
    return authFetch(`${API_ROOT}/admin/users`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        return response.json() as Promise<User[]>;
      })
      .then((data) => {
        setAllUsers(data);
      });
  };

  useEffect(() => {
    fetchCurrentUser()
      .then((currentUser) => {
        if (currentUser.is_admin) {
          return fetchAllUsers();
        }
      })
      .catch((error) => {
        console.error('Error fetching user:', error);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileMessage(null);
    setProfileSaving(true);

    try {
      const response = await authFetch(`${API_ROOT}/user`, {
        method: 'PATCH',
        body: JSON.stringify({
          username: usernameInput.trim(),
          display_name: displayNameInput.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setProfileMessage({ type: 'error', text: data.error || 'Failed to update profile' });
        return;
      }

      setUser(data);
      setProfileMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setProfileMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordSaving(true);

    try {
      const response = await authFetch(`${API_ROOT}/user/password`, {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordMessage({ type: 'error', text: data.error || 'Failed to change password' });
        return;
      }

      setPasswordMessage({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleApprove(userId: number) {
    setAdminMessage(null);
    setAdminBusyUserId(userId);
    try {
      const response = await authFetch(`${API_ROOT}/admin/users/${userId}/approve`, {
        method: 'PATCH',
      });
      const data = await response.json();

      if (!response.ok) {
        setAdminMessage({ type: 'error', text: data.error || 'Failed to approve user' });
        return;
      }

      setAllUsers((prev) => prev?.map((u) => (u.user_id === userId ? data : u)) ?? null);
    } catch (error) {
      console.error('Error approving user:', error);
      setAdminMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setAdminBusyUserId(null);
    }
  }

  async function handleReject(userId: number) {
    if (!confirm('Reject and remove this pending registration request?')) return;

    setAdminMessage(null);
    setAdminBusyUserId(userId);
    try {
      const response = await authFetch(`${API_ROOT}/admin/users/${userId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        setAdminMessage({ type: 'error', text: data.error || 'Failed to reject user' });
        return;
      }

      setAllUsers((prev) => prev?.filter((u) => u.user_id !== userId) ?? null);
    } catch (error) {
      console.error('Error rejecting user:', error);
      setAdminMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setAdminBusyUserId(null);
    }
  }

  async function handleToggleAdmin(userId: number, makeAdmin: boolean) {
    setAdminMessage(null);
    setAdminBusyUserId(userId);
    try {
      const response = await authFetch(`${API_ROOT}/admin/users/${userId}/admin`, {
        method: 'PATCH',
        body: JSON.stringify({ is_admin: makeAdmin }),
      });
      const data = await response.json();

      if (!response.ok) {
        setAdminMessage({ type: 'error', text: data.error || 'Failed to update admin status' });
        return;
      }

      setAllUsers((prev) => prev?.map((u) => (u.user_id === userId ? data : u)) ?? null);
    } catch (error) {
      console.error('Error updating admin status:', error);
      setAdminMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setAdminBusyUserId(null);
    }
  }

  const pendingUsers = allUsers?.filter((u) => !u.is_approved) ?? [];
  const approvedUsers = allUsers?.filter((u) => u.is_approved) ?? [];

  return (
    <div className={`min-h-screen bg-linear-to-t from-orange-500 to-gray-500 font-bold transition-[padding-left] duration-300 pl-14 ${isNavOpen ? 'sm:pl-32' : 'sm:pl-16'}`}>
      <Header />
      <NavBar isOpen={isNavOpen} openNav={openNav} closeNav={closeNav} />
      <div className="p-4 max-w-2xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Hello, {user?.display_name || 'User'}</h2>
          <p className="text-gray-200 font-normal">
            {user?.last_login ? `Last login: ${new Date(user.last_login).toLocaleString()}` : 'Welcome to SoundBin'}
          </p>
        </div>

        {loading && <p className="text-gray-200 font-normal">Loading your account...</p>}

        {!loading && user && (
          <>
            {/* Profile section */}
            <section className="bg-white/10 rounded-lg p-6 space-y-4">
              <h3 className="text-xl font-bold text-white">Profile</h3>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block mb-1 text-sm font-medium text-gray-100">Username</label>
                  <input
                    id="username"
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md font-normal focus:outline-none focus:ring focus:ring-orange-400"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="display_name" className="block mb-1 text-sm font-medium text-gray-100">Display Name</label>
                  <input
                    id="display_name"
                    type="text"
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md font-normal focus:outline-none focus:ring focus:ring-orange-400"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-4 py-2 text-white bg-orange-500 rounded-md hover:bg-orange-600 focus:outline-none focus:ring focus:ring-orange-400 disabled:opacity-50"
                >
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </button>
                {profileMessage && (
                  <p className={`text-sm font-normal ${profileMessage.type === 'success' ? 'text-green-300' : 'text-red-300'}`}>
                    {profileMessage.text}
                  </p>
                )}
              </form>
            </section>

            {/* Password section */}
            <section className="bg-white/10 rounded-lg p-6 space-y-4">
              <h3 className="text-xl font-bold text-white">Change Password</h3>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block mb-1 text-sm font-medium text-gray-100">Current Password</label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md font-normal focus:outline-none focus:ring focus:ring-orange-400"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block mb-1 text-sm font-medium text-gray-100">New Password</label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md font-normal focus:outline-none focus:ring focus:ring-orange-400"
                    minLength={8}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium text-gray-100">Confirm New Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md font-normal focus:outline-none focus:ring focus:ring-orange-400"
                    minLength={8}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="px-4 py-2 text-white bg-orange-500 rounded-md hover:bg-orange-600 focus:outline-none focus:ring focus:ring-orange-400 disabled:opacity-50"
                >
                  {passwordSaving ? 'Updating...' : 'Update Password'}
                </button>
                {passwordMessage && (
                  <p className={`text-sm font-normal ${passwordMessage.type === 'success' ? 'text-green-300' : 'text-red-300'}`}>
                    {passwordMessage.text}
                  </p>
                )}
              </form>
            </section>

            {/* Admin-only section */}
            {user.is_admin && (
              <section className="bg-white/10 rounded-lg p-6 space-y-4">
                <h3 className="text-xl font-bold text-white">Admin: User Management</h3>
                <p className="text-gray-200 font-normal text-sm">
                  This section is only visible to admins.
                </p>

                {adminMessage && (
                  <p className={`text-sm font-normal ${adminMessage.type === 'success' ? 'text-green-300' : 'text-red-300'}`}>
                    {adminMessage.text}
                  </p>
                )}

                {pendingUsers.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-white">Pending Approval ({pendingUsers.length})</h4>
                    <div className="space-y-2">
                      {pendingUsers.map((pendingUser) => (
                        <div key={pendingUser.user_id} className="flex items-center justify-between bg-white/10 rounded-md px-4 py-2">
                          <div className="font-normal text-white">
                            <span className="font-semibold">{pendingUser.username}</span>
                            <span className="text-gray-300"> ({pendingUser.display_name})</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(pendingUser.user_id)}
                              disabled={adminBusyUserId === pendingUser.user_id}
                              className="px-3 py-1 text-sm text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(pendingUser.user_id)}
                              disabled={adminBusyUserId === pendingUser.user_id}
                              className="px-3 py-1 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="text-lg font-semibold text-white">All Users ({approvedUsers.length})</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm font-normal text-white">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="py-2 pr-4">Username</th>
                          <th className="py-2 pr-4">Display Name</th>
                          <th className="py-2 pr-4">Admin</th>
                          <th className="py-2 pr-4">Joined</th>
                          <th className="py-2 pr-4"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {approvedUsers.map((approvedUser) => (
                          <tr key={approvedUser.user_id} className="border-b border-white/10">
                            <td className="py-2 pr-4">{approvedUser.username}</td>
                            <td className="py-2 pr-4">{approvedUser.display_name}</td>
                            <td className="py-2 pr-4">{approvedUser.is_admin ? 'Yes' : 'No'}</td>
                            <td className="py-2 pr-4">{new Date(approvedUser.register_date).toLocaleDateString()}</td>
                            <td className="py-2 pr-4">
                              {approvedUser.user_id !== user.user_id && (
                                <button
                                  onClick={() => handleToggleAdmin(approvedUser.user_id, !approvedUser.is_admin)}
                                  disabled={adminBusyUserId === approvedUser.user_id}
                                  className="px-2 py-1 text-xs text-white bg-orange-500 rounded hover:bg-orange-600 disabled:opacity-50"
                                >
                                  {approvedUser.is_admin ? 'Revoke Admin' : 'Make Admin'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
      <PlaybackControlBar />
    </div>
  )
}
