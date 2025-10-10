import React from 'react';
import NavTab from '../Navigation/NavTab';

type View = 'dashboard' | 'calendar' | 'list' | 'team' | 'teams' | 'team-settings';

interface AppNavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
  isAdmin: boolean;
}

export const AppNavigation: React.FC<AppNavigationProps> = ({
  currentView,
  onViewChange,
  isAdmin
}) => {
  return (
    <div className="bg-white border-b border-slate-200 py-4 px-7">
      <div className="max-w-[1400px] mx-auto flex gap-2.5 flex-wrap">
        <NavTab
          active={currentView === 'dashboard'}
          onClick={() => onViewChange('dashboard')}
          icon="📊"
          label="Dashboard"
        />
        <NavTab
          active={currentView === 'calendar'}
          onClick={() => onViewChange('calendar')}
          icon="📅"
          label="Calendar"
        />
        <NavTab
          active={currentView === 'list'}
          onClick={() => onViewChange('list')}
          icon="📋"
          label="My Requests"
        />
        {isAdmin && (
          <>
            <NavTab
              active={currentView === 'team'}
              onClick={() => onViewChange('team')}
              icon="👥"
              label="Team Members"
            />
            <NavTab
              active={currentView === 'teams'}
              onClick={() => onViewChange('teams')}
              icon="🏢"
              label="Teams"
            />
            <NavTab
              active={currentView === 'team-settings'}
              onClick={() => onViewChange('team-settings')}
              icon="⚙️"
              label="Team Settings"
            />
          </>
        )}
      </div>
    </div>
  );
};
