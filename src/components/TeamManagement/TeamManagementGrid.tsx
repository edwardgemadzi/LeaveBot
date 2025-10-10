import React from 'react';
import TeamCard from './TeamCard';

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

interface TeamManagementGridProps {
  teams: Team[];
  currentUser: User;
  onEdit: (team: Team) => void;
  onSettings: (team: Team) => void;
  onViewMembers: (team: Team) => void;
  onDelete: (team: Team) => void;
  onGenerateToken: (team: Team) => void;
  canEditTeam: (user: User, team: Team) => boolean;
}

export const TeamManagementGrid: React.FC<TeamManagementGridProps> = ({
  teams,
  currentUser,
  onEdit,
  onSettings,
  onViewMembers,
  onDelete,
  onGenerateToken,
  canEditTeam
}) => {
  if (teams.length === 0) {
    return (
      <p className="text-center text-gray-400 py-10">
        No teams found. Create your first team to get started!
      </p>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5 mb-5">
      {teams.map((team) => (
        <TeamCard
          key={team.id || team._id}
          team={team}
          currentUser={currentUser}
          canEdit={canEditTeam(currentUser, team)}
          onEdit={() => onEdit(team)}
          onSettings={() => onSettings(team)}
          onViewMembers={() => onViewMembers(team)}
          onDelete={() => onDelete(team)}
          onGenerateToken={() => onGenerateToken(team)}
        />
      ))}
    </div>
  );
};
