/**
 * Navigation tab component
 */

interface NavTabProps {
  active: boolean
  onClick: () => void
  icon: string
  label: string
}

export default function NavTab({ active, onClick, icon, label }: NavTabProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 20px',
        background: active ? '#3b82f6' : 'white',
        color: active ? 'white' : '#6b7280',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = '#f3f4f6'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'white'
        }
      }}
    >
      <span style={{ fontSize: '18px' }}>{icon}</span>
      {label}
    </button>
  )
}
