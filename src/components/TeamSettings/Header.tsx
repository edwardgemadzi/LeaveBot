import React from 'react'

interface TeamSettingsHeaderProps {
  teamName: string
  onClose: () => void
}

export default function TeamSettingsHeader({ teamName, onClose }: TeamSettingsHeaderProps) {
  return (
    <div className="p-5 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
      <div>
        <h2 className="m-0 text-xl font-semibold">⚙️ Team Settings</h2>
        <p className="mt-1 mb-0 text-sm text-gray-500">{teamName}</p>
      </div>
      <button
        onClick={onClose}
        className="bg-transparent border-none text-2xl cursor-pointer text-gray-500 px-2.5"
      >
        ×
      </button>
    </div>
  )
}
