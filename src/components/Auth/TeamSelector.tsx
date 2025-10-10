import React from 'react';

interface Team {
  id?: string;
  _id?: string;
  name: string;
}

interface TeamSelectorProps {
  teams: Team[];
  selectedTeamId: string;
  onTeamChange: (teamId: string) => void;
  disabled?: boolean;
}

export const TeamSelector: React.FC<TeamSelectorProps> = ({
  teams,
  selectedTeamId,
  onTeamChange,
  disabled = false
}) => {
  if (teams.length === 0) return null;

  return (
    <div className="mb-5">
      <label className="block mb-2 text-gray-700 font-medium">
        Team (Optional)
      </label>
      <select
        value={selectedTeamId}
        onChange={(e) => onTeamChange(e.target.value)}
        disabled={disabled}
        className="w-full p-3 border border-gray-300 rounded-lg text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">No team</option>
        {teams.map((team) => (
          <option key={team.id || team._id} value={team.id || team._id}>
            {team.name}
          </option>
        ))}
      </select>
    </div>
  );
};
