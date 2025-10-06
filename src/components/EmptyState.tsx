import { FileQuestion, Calendar, Users, ClipboardList } from 'lucide-react'

interface EmptyStateProps {
  icon?: 'leaves' | 'calendar' | 'users' | 'teams'
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

const iconMap = {
  leaves: ClipboardList,
  calendar: Calendar,
  users: Users,
  teams: Users
}

export function EmptyState({ icon = 'leaves', title, description, action }: EmptyStateProps) {
  const Icon = iconMap[icon]

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="rounded-full bg-slate-100 p-6 mb-4">
        <Icon className="w-12 h-12 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 text-center max-w-md mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
