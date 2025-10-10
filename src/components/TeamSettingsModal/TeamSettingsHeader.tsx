import React from 'react'

interface TeamSettingsHeaderProps {
  teamName: string
  onClose: () => void
}

export default function TeamSettingsHeader({ teamName, onClose }: TeamSettingsHeaderProps) {
  return (
    <div className="p-5 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10">
      <div>
        <h2 className="m-0 text-xl font-semibold">⚙️ Team Settings</h2>
        <p className="mt-1 text-sm text-slate-600">{teamName}</p>
      </div>
      <button 
        onClick={onClose} 
        className="bg-transparent border-0 text-2xl cursor-pointer text-slate-600 px-2 hover:text-slate-800"
      >
        ×
      </button>
    </div>
  )
}
