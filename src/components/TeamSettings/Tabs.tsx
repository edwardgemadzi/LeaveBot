import React from 'react'

interface TeamSettingsTabsProps {
  activeTab: string
  setActiveTab: (tab: 'limits' | 'annual' | 'defaults') => void
}

const tabs = [
  { id: 'limits', label: '👥 Concurrent Limits' },
  { id: 'annual', label: '🏖️ Annual Leave' },
  { id: 'defaults', label: '⚙️ Default Settings' }
]

export default function TeamSettingsTabs({ activeTab, setActiveTab }: TeamSettingsTabsProps) {
  return (
    <div className="flex border-b border-gray-200 overflow-x-auto sticky top-20 bg-white z-10">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as any)}
          className={`px-4 py-3 border-none cursor-pointer text-sm whitespace-nowrap transition-all duration-200 ${
            activeTab === tab.id 
              ? 'bg-blue-50 border-b-2 border-b-blue-500 font-semibold text-blue-600' 
              : 'bg-transparent border-b-2 border-b-transparent font-normal text-gray-500'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
