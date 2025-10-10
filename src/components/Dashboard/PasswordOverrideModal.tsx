import React from 'react'

interface PasswordOverrideModalProps {
  overrideModal: {
    show: boolean
    warning: string
    currentCount: number
    limit: number
  }
  overridePassword: string
  passwordError: string
  processing: string | null
  onPasswordChange: (password: string) => void
  onPasswordOverride: () => void
  onCancelOverride: () => void
}

export default function PasswordOverrideModal({
  overrideModal,
  overridePassword,
  passwordError,
  processing,
  onPasswordChange,
  onPasswordOverride,
  onCancelOverride
}: PasswordOverrideModalProps) {
  if (!overrideModal.show) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-xl p-8 max-w-[500px] w-[90%] shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-red-500">
          ⚠️ Concurrent Leave Limit Warning
        </h2>
        
        <div className="p-4 bg-amber-100 border-2 border-amber-500 rounded-lg mb-5">
          <p className="text-amber-900 leading-relaxed">
            {overrideModal.warning}
          </p>
          <p className="mt-3 text-amber-900 font-semibold text-sm">
            Currently: {overrideModal.currentCount} / {overrideModal.limit} team members on leave
          </p>
        </div>

        <div className="mb-5">
          <p className="mb-3 text-slate-700 font-medium">
            To approve this leave in emergency circumstances, please enter your password:
          </p>
          
          <input
            type="password"
            placeholder="Enter your password"
            value={overridePassword}
            onChange={(e) => onPasswordChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onPasswordOverride()}
            className="w-full p-3 border-2 border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500"
            autoFocus
          />
          
          {passwordError && (
            <p className="text-red-600 text-sm mt-2 font-medium">
              {passwordError}
            </p>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancelOverride}
            disabled={processing !== null}
            className={`px-5 py-2 rounded-lg border-2 border-slate-300 bg-white text-slate-700 font-semibold ${
              processing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'
            }`}
          >
            Cancel
          </button>
          
          <button
            onClick={onPasswordOverride}
            disabled={processing !== null || !overridePassword}
            className={`px-5 py-2 rounded-lg border-0 text-white font-semibold ${
              processing 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-red-500 hover:bg-red-600'
            } ${!overridePassword ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {processing ? '⏳ Processing...' : '🔓 Override & Approve'}
          </button>
        </div>
      </div>
    </div>
  )
}