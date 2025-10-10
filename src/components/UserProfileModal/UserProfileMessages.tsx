import React from 'react'

interface UserProfileMessagesProps {
  error: string
  success: string
}

export default function UserProfileMessages({ error, success }: UserProfileMessagesProps) {
  return (
    <>
      {error && (
        <div className="mt-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="mt-5 px-4 py-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-600 text-sm">
          ✅ {success}
        </div>
      )}
    </>
  )
}
