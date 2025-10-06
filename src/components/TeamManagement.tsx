import React, { useEffect, useState } from 'react';

interface User {
  _id: string;
  username: string;
  name: string;
  role: 'admin' | 'leader' | 'user';
  teamId?: string;
}

interface TeamManagementProps {
  currentUser: User;
  token: string;
}

interface Team {
  _id: string;
  name: string;
  description: string;
  leaderId: string;
  leaderName?: string;
  memberCount: number;
  createdAt: string;
}

interface TeamMember {
  _id: string;
  username: string;
  name: string;
  role: string;
}

interface TeamDetails extends Team {
  members: TeamMember[];
}

const TeamManagement: React.FC<TeamManagementProps> = ({ currentUser, token }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [leaders, setLeaders] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  
  // Form state
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [selectedLeaderId, setSelectedLeaderId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadTeams(), loadLeaders(), loadAllUsers()]);
    } catch (err) {
      setError(`Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}. The API may need to redeploy.`);
      console.error('Load error details:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    const response = await fetch('/api/teams', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to load teams');
    const data = await response.json();
    setTeams(data.teams);
  };

  const loadLeaders = async () => {
    const response = await fetch('/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to load leaders');
    const data = await response.json();
    setLeaders(data.users.filter((u: User) => u.role === 'leader'));
  };

  const loadAllUsers = async () => {
    const response = await fetch('/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to load users');
    const data = await response.json();
    setAllUsers(data.users);
  };

  const loadTeamMembers = async (teamId: string) => {
    const response = await fetch(`/api/teams?id=${teamId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to load team members');
    const data: { team: TeamDetails } = await response.json();
    setTeamMembers(data.team.members);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: teamName,
          description: teamDescription,
          leaderId: selectedLeaderId || undefined
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create team');
      }

      await loadTeams();
      setShowCreateModal(false);
      resetForm();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    setError(null);

    try {
      const response = await fetch(`/api/teams?id=${selectedTeam._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: teamName,
          description: teamDescription,
          leaderId: selectedLeaderId || undefined
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update team');
      }

      await loadTeams();
      setShowEditModal(false);
      resetForm();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team? All members will be unassigned.')) {
      return;
    }

    setError(null);
    try {
      const response = await fetch(`/api/teams?id=${teamId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete team');
      }

      await loadTeams();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAssignUser = async (userId: string, teamId: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/teams?id=${teamId}&action=assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to assign user');
      }

      await Promise.all([loadTeams(), loadAllUsers()]);
      if (showMembersModal && selectedTeam) {
        await loadTeamMembers(selectedTeam._id);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRemoveUser = async (userId: string, teamId: string) => {
    if (!confirm('Remove this user from the team?')) return;

    setError(null);
    try {
      const response = await fetch(`/api/teams?id=${teamId}&action=remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove user');
      }

      await Promise.all([loadTeams(), loadAllUsers()]);
      if (showMembersModal && selectedTeam) {
        await loadTeamMembers(selectedTeam._id);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (team: Team) => {
    setSelectedTeam(team);
    setTeamName(team.name);
    setTeamDescription(team.description);
    setSelectedLeaderId(team.leaderId || '');
    setShowEditModal(true);
  };

  const openMembersModal = async (team: Team) => {
    setSelectedTeam(team);
    setShowMembersModal(true);
    await loadTeamMembers(team._id);
  };

  const resetForm = () => {
    setTeamName('');
    setTeamDescription('');
    setSelectedLeaderId('');
    setSelectedTeam(null);
    setError(null);
  };

  const getLeaderName = (leaderId: string) => {
    const leader = leaders.find(l => l._id === leaderId);
    return leader ? leader.name : 'No leader';
  };

  const getUsersNotInTeam = (teamId: string) => {
    return allUsers.filter(user => user.teamId !== teamId);
  };

  if (loading) {
    return <div className="loading">Loading teams...</div>;
  }

  return (
    <div className="team-management">
      <div className="header">
        <h2>🏢 Team Management</h2>
        <button className="btn-primary" onClick={openCreateModal}>
          ➕ Create Team
        </button>
      </div>

      {error && (
        <div className="error-banner">
          ❌ {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="teams-grid">
        {teams.length === 0 ? (
          <div className="empty-state">
            <p>No teams yet. Create your first team to get started!</p>
          </div>
        ) : (
          teams.map(team => (
            <div key={team._id} className="team-card">
              <div className="team-header">
                <h3>{team.name}</h3>
                <div className="team-actions">
                  <button onClick={() => openMembersModal(team)} title="View members">
                    👥 {team.memberCount}
                  </button>
                  <button onClick={() => openEditModal(team)} title="Edit team">
                    ✏️
                  </button>
                  <button onClick={() => handleDeleteTeam(team._id)} title="Delete team">
                    🗑️
                  </button>
                </div>
              </div>
              
              <p className="team-description">{team.description}</p>
              
              <div className="team-info">
                <div className="info-row">
                  <span className="label">Leader:</span>
                  <span className="value">{getLeaderName(team.leaderId)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Members:</span>
                  <span className="value">{team.memberCount} users</span>
                </div>
                <div className="info-row">
                  <span className="label">Created:</span>
                  <span className="value">{new Date(team.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Team</h3>
              <button onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleCreateTeam}>
              <div className="form-group">
                <label>Team Name *</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  required
                  minLength={3}
                  maxLength={50}
                  placeholder="Engineering, Sales, Marketing..."
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={teamDescription}
                  onChange={e => setTeamDescription(e.target.value)}
                  maxLength={200}
                  placeholder="Brief description of the team..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Team Leader</label>
                <select
                  value={selectedLeaderId}
                  onChange={e => setSelectedLeaderId(e.target.value)}
                >
                  <option value="">No leader assigned</option>
                  {leaders.map(leader => (
                    <option key={leader._id} value={leader._id}>
                      {leader.name} (@{leader.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {showEditModal && selectedTeam && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Team</h3>
              <button onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleEditTeam}>
              <div className="form-group">
                <label>Team Name *</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  required
                  minLength={3}
                  maxLength={50}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={teamDescription}
                  onChange={e => setTeamDescription(e.target.value)}
                  maxLength={200}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Team Leader</label>
                <select
                  value={selectedLeaderId}
                  onChange={e => setSelectedLeaderId(e.target.value)}
                >
                  <option value="">No leader assigned</option>
                  {leaders.map(leader => (
                    <option key={leader._id} value={leader._id}>
                      {leader.name} (@{leader.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Members Modal */}
      {showMembersModal && selectedTeam && (
        <div className="modal-overlay" onClick={() => setShowMembersModal(false)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👥 {selectedTeam.name} - Members</h3>
              <button onClick={() => setShowMembersModal(false)}>✕</button>
            </div>
            
            <div className="members-section">
              <h4>Current Members ({teamMembers.length})</h4>
              {teamMembers.length === 0 ? (
                <p className="empty-message">No members in this team yet.</p>
              ) : (
                <div className="members-list">
                  {teamMembers.map(member => (
                    <div key={member._id} className="member-item">
                      <div className="member-info">
                        <strong>{member.name}</strong>
                        <span className="username">@{member.username}</span>
                        <span className={`role-badge role-${member.role}`}>
                          {member.role}
                        </span>
                      </div>
                      <button
                        className="btn-danger-small"
                        onClick={() => handleRemoveUser(member._id, selectedTeam._id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="members-section">
              <h4>Add Members</h4>
              {getUsersNotInTeam(selectedTeam._id).length === 0 ? (
                <p className="empty-message">All users are already in teams.</p>
              ) : (
                <div className="members-list">
                  {getUsersNotInTeam(selectedTeam._id).map(user => (
                    <div key={user._id} className="member-item">
                      <div className="member-info">
                        <strong>{user.name}</strong>
                        <span className="username">@{user.username}</span>
                        <span className={`role-badge role-${user.role}`}>
                          {user.role}
                        </span>
                        {user.teamId && (
                          <span className="team-badge">
                            In: {teams.find(t => t._id === user.teamId)?.name || 'Another team'}
                          </span>
                        )}
                      </div>
                      <button
                        className="btn-primary-small"
                        onClick={() => handleAssignUser(user._id, selectedTeam._id)}
                      >
                        Add to Team
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .team-management {
          padding: 20px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .header h2 {
          margin: 0;
        }

        .error-banner {
          background: #fee;
          color: #c00;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .error-banner button {
          background: transparent;
          border: none;
          color: #c00;
          font-size: 18px;
          cursor: pointer;
        }

        .teams-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .team-card {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .team-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }

        .team-header h3 {
          margin: 0;
          flex: 1;
        }

        .team-actions {
          display: flex;
          gap: 8px;
        }

        .team-actions button {
          background: transparent;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 5px 10px;
          cursor: pointer;
          font-size: 14px;
        }

        .team-actions button:hover {
          background: #f5f5f5;
        }

        .team-description {
          color: #666;
          margin-bottom: 15px;
          min-height: 40px;
        }

        .team-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 15px;
          border-top: 1px solid #eee;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
        }

        .info-row .label {
          color: #666;
        }

        .info-row .value {
          font-weight: 500;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-large {
          max-width: 700px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .modal-header h3 {
          margin: 0;
        }

        .modal-header button {
          background: transparent;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }

        .modal form {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }

        .modal-actions button {
          padding: 10px 20px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn-primary,
        .btn-primary-small {
          background: #007bff;
          color: white;
          border: none;
        }

        .btn-primary:hover,
        .btn-primary-small:hover {
          background: #0056b3;
        }

        .btn-danger-small {
          background: #dc3545;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .btn-danger-small:hover {
          background: #c82333;
        }

        .members-section {
          padding: 20px;
          border-top: 1px solid #eee;
        }

        .members-section h4 {
          margin-top: 0;
          margin-bottom: 15px;
        }

        .members-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .member-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .member-info {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }

        .username {
          color: #666;
          font-size: 14px;
        }

        .role-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .role-admin {
          background: #dc3545;
          color: white;
        }

        .role-leader {
          background: #ffc107;
          color: #000;
        }

        .role-user {
          background: #28a745;
          color: white;
        }

        .team-badge {
          background: #6c757d;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
        }

        .empty-message {
          color: #666;
          font-style: italic;
        }

        .loading {
          padding: 40px;
          text-align: center;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default TeamManagement;
