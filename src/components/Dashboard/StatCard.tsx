import React from 'react'

interface StatCardProps {
  title: string
  value: number
  color: string
  icon: string
  subtitle?: string
}

export default function StatCard({ title, value, color, icon, subtitle }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-default"
         style={{ borderLeftColor: color }}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-3xl font-bold mb-1" style={{ color }}>
        {value}
      </div>
      <div className="text-sm text-slate-600 font-medium">
        {title}
      </div>
      {subtitle && (
        <div className="text-xs text-slate-400 mt-1.5 font-normal">
          {subtitle}
        </div>
      )}
    </div>
  )
}
