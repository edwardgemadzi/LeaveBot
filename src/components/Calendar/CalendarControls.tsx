import React from 'react';

interface User {
  role: string;
  teamId?: string;
}

interface CalendarControlsProps {
  user: User;
  showTeamOnly: boolean;
  onShowTeamOnlyChange: (show: boolean) => void;
}

export const CalendarControls: React.FC<CalendarControlsProps> = ({
  user,
  showTeamOnly,
  onShowTeamOnlyChange
}) => {
  if (user.role !== 'user' || !user.teamId) return null;

  return (
    <div className="flex gap-3 items-center mb-3">
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={showTeamOnly}
          onChange={(e) => onShowTeamOnlyChange(e.target.checked)}
          className="cursor-pointer"
        />
        <span>Show team leaves</span>
      </label>
    </div>
  );
};
