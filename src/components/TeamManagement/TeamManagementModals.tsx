import React from 'react';
import TeamFormModal from './TeamFormModal';
import TeamMembersModal from './TeamMembersModal';
import TeamSettingsModal from '../TeamSettingsModal';

interface Team {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  leaderId?: string;
  memberCount?: number;
}

interface User {
  id: string;
  role: string;
}

interface TeamManagementModalsProps {
  showCreateModal: boolean;
  editingTeam: Team | null;
  membersTeam: Team | null;
  settingsTeam: Team | null;
  leaders: User[];
  users: User[];
  token: string;
  currentUser: User;
  onCloseCreateModal: () => void;
  onCloseEditModal: () => void;
  onCloseMembersModal: () => void;
  onCloseSettingsModal: () => void;
  onCreateTeam: (teamData: any) => Promise<{ success: boolean; error?: string }>;
  onUpdateTeam: (teamData: any) => Promise<{ success: boolean; error?: string }>;
  onAssignUser: (teamId: string, userId: string) => Promise<{ success: boolean; error?: string }>;
  onRemoveUser: (teamId: string, userId: string) => Promise<{ success: boolean; error?: string }>;
  onRefetchTeams: () => void;
  canEditTeam: (user: User, team: Team) => boolean;
}

export const TeamManagementModals: React.FC<TeamManagementModalsProps> = ({
  showCreateModal,
  editingTeam,
  membersTeam,
  settingsTeam,
  leaders,
  users,
  token,
  currentUser,
  onCloseCreateModal,
  onCloseEditModal,
  onCloseMembersModal,
  onCloseSettingsModal,
  onCreateTeam,
  onUpdateTeam,
  onAssignUser,
  onRemoveUser,
  onRefetchTeams,
  canEditTeam
}) => {
  return (
    <>
      <TeamFormModal
        isOpen={showCreateModal}
        onClose={onCloseCreateModal}
        onSubmit={onCreateTeam}
        leaders={leaders}
        mode="create"
      />

      {editingTeam && (
        <TeamFormModal
          isOpen={true}
          onClose={onCloseEditModal}
          onSubmit={onUpdateTeam}
          team={editingTeam}
          leaders={leaders}
          mode="edit"
        />
      )}

      {membersTeam && (
        <TeamMembersModal
          isOpen={true}
          onClose={onCloseMembersModal}
          team={membersTeam}
          token={token}
          allUsers={users}
          onAssignUser={onAssignUser}
          onRemoveUser={onRemoveUser}
          canManage={canEditTeam(currentUser, membersTeam)}
        />
      )}

      {settingsTeam && (
        <TeamSettingsModal
          isOpen={true}
          onClose={onCloseSettingsModal}
          team={settingsTeam as any}
          token={token}
          onSuccess={() => {
            onRefetchTeams();
            onCloseSettingsModal();
          }}
        />
      )}
    </>
  );
};
