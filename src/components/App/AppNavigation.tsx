import React from 'react';
import NavTab from '../Navigation/NavTab';

type View = 'dashboard' | 'calendar' | 'list' | 'team' | 'teams' | 'team-settings';

interface AppNavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
  isAdmin: boolean;
  userRole: string;
}

export const AppNavigation: React.FC<AppNavigationProps> = ({
  currentView,
  onViewChange,
  isAdmin,
  userRole
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
        
        {userRole === 'admin' ? (
          // Admin tabs: Dashboard, Requests, Teams, Leaders, Users
          <>
            <NavTab
              active={currentView === 'list'}
              onClick={() => onViewChange('list')}
              icon="📋"
              label="Requests"
            />
            <NavTab
              active={currentView === 'teams'}
              onClick={() => onViewChange('teams')}
              icon="🏢"
              label="Teams"
            />
            <NavTab
              active={currentView === 'team'}
              onClick={() => onViewChange('team')}
              icon="👑"
              label="Leaders"
            />
            <NavTab
              active={currentView === 'team-settings'}
              onClick={() => onViewChange('team-settings')}
              icon="👥"
              label="Users"
            />
          </>
        ) : userRole === 'leader' ? (
          // Leader tabs: Dashboard, Calendar, Requests, Team Management
          <>
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
              label="Requests"
            />
            <NavTab
              active={currentView === 'team'}
              onClick={() => onViewChange('team')}
              icon="👥"
              label="Team Management"
            />
          </>
        ) : (
          // User tabs: Dashboard, Calendar, Request History
          <>
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
              label="Request History"
            />
          </>
        )}
      </div>
    </div>
  );
};
