import React from 'react'

interface UserProfileFooterProps {
  loading: boolean
  onClose: () => void
  onSave: () => void
}

export default function UserProfileFooter({ loading, onClose, onSave }: UserProfileFooterProps) {
  return (
    <div className="p-5 border-t border-slate-200 flex gap-2.5 justify-end sticky bottom-0 bg-white">
      <button
        onClick={onClose}
        disabled={loading}
        className={`px-5 py-2 rounded-md border border-slate-300 bg-white text-slate-700 text-sm font-medium ${
          loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'
        }`}
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={loading}
        className={`px-5 py-2 rounded-md text-white text-sm font-medium ${
          loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {loading ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  )
}
