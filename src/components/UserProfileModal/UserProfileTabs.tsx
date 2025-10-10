import React from 'react'

interface UserProfileTabsProps {
  activeTab: 'shift' | 'time' | 'days'
  onTabChange: (tab: 'shift' | 'time' | 'days') => void
}

export default function UserProfileTabs({ activeTab, onTabChange }: UserProfileTabsProps) {
  const tabs = [
    { id: 'shift', label: '🔄 My Shift Pattern' },
    { id: 'time', label: '⏰ My Shift Time' },
    { id: 'days', label: '📅 Shift Cycle Start' }
  ] as const

  return (
    <div className="flex border-b border-slate-200 overflow-x-auto sticky top-[81px] bg-white z-9">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-3 text-sm whitespace-nowrap transition-all border-b-2 ${
            activeTab === tab.id 
              ? 'bg-blue-50 border-blue-500 text-blue-600 font-semibold' 
              : 'border-transparent text-slate-600'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
