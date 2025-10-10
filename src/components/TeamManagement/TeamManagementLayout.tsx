import React from 'react';
import { TeamManagementHeader } from './TeamManagementHeader';
import { TeamManagementError } from './TeamManagementError';
import { TeamManagementGrid } from './TeamManagementGrid';
import { TeamManagementModals } from './TeamManagementModals';

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

interface TeamManagementLayoutProps {
  currentUser: User;
  teams: Team[];
  teamsError: string;
  localError: string;
  showCreateModal: boolean;
  editingTeam: Team | null;
  membersTeam: Team | null;
  settingsTeam: Team | null;
  leaders: User[];
  users: User[];
  token: string;
  onCreateTeam: () => void;
  onEdit: (team: Team) => void;
  onSettings: (team: Team) => void;
  onViewMembers: (team: Team) => void;
  onDelete: (team: Team) => void;
  onGenerateToken: (team: Team) => void;
  onCloseCreateModal: () => void;
  onCloseEditModal: () => void;
  onCloseMembersModal: () => void;
  onCloseSettingsModal: () => void;
  onCloseTokenModal: () => void;
  onCreateTeamSubmit: (teamData: any) => Promise<{ success: boolean; error?: string }>;
  onUpdateTeamSubmit: (teamData: any) => Promise<{ success: boolean; error?: string }>;
  onAssignUser: (teamId: string, userId: string) => Promise<{ success: boolean; error?: string }>;
  onRemoveUser: (teamId: string, userId: string) => Promise<{ success: boolean; error?: string }>;
  onRefetchTeams: () => void;
  canEditTeam: (user: User, team: Team) => boolean;
}

export const TeamManagementLayout: React.FC<TeamManagementLayoutProps> = ({
  currentUser,
  teams,
  teamsError,
  localError,
  showCreateModal,
  editingTeam,
  membersTeam,
  settingsTeam,
  leaders,
  users,
  token,
  onCreateTeam,
  onEdit,
  onSettings,
  onViewMembers,
  onDelete,
  onGenerateToken,
  onCloseCreateModal,
  onCloseEditModal,
  onCloseMembersModal,
  onCloseSettingsModal,
  onCloseTokenModal,
  onCreateTeamSubmit,
  onUpdateTeamSubmit,
  onAssignUser,
  onRemoveUser,
  onRefetchTeams,
  canEditTeam
}) => {
  return (
    <div className="p-5">
      <TeamManagementHeader
        currentUser={currentUser}
        onCreateTeam={onCreateTeam}
      />

      <TeamManagementError
        teamsError={teamsError}
        localError={localError}
      />

      <TeamManagementGrid
        teams={teams}
        currentUser={currentUser}
        onEdit={onEdit}
        onSettings={onSettings}
        onViewMembers={onViewMembers}
        onDelete={onDelete}
        onGenerateToken={onGenerateToken}
        canEditTeam={canEditTeam}
      />

      <TeamManagementModals
        showCreateModal={showCreateModal}
        editingTeam={editingTeam}
        membersTeam={membersTeam}
        settingsTeam={settingsTeam}
        leaders={leaders}
        users={users}
        token={token}
        currentUser={currentUser}
        onCloseCreateModal={onCloseCreateModal}
        onCloseEditModal={onCloseEditModal}
        onCloseMembersModal={onCloseMembersModal}
        onCloseSettingsModal={onCloseSettingsModal}
        onCreateTeam={onCreateTeamSubmit}
        onUpdateTeam={onUpdateTeamSubmit}
        onAssignUser={onAssignUser}
        onRemoveUser={onRemoveUser}
        onRefetchTeams={onRefetchTeams}
        canEditTeam={canEditTeam}
      />
    </div>
  );
};
