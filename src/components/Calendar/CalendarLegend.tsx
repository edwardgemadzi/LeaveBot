import React from 'react';
import type { UserSettings } from '../../types';

interface CalendarLegendProps {
  userSettings?: UserSettings | null;
}

export const CalendarLegend: React.FC<CalendarLegendProps> = ({ userSettings }) => {
  return (
    <div className="flex gap-4 mb-5 text-xs flex-wrap">
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 bg-emerald-500 rounded"></div>
        <span>My Leaves</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 bg-blue-500 rounded"></div>
        <span>Team Leaves</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 bg-amber-500 rounded"></div>
        <span>Pending</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 bg-red-500 rounded"></div>
        <span>Rejected</span>
      </div>
      {userSettings && (
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 bg-gray-50 rounded border border-gray-200"></div>
          <span className="text-gray-500">Non-Working Days</span>
        </div>
      )}
    </div>
  );
};
