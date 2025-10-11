import React from 'react';
import Header from './Header';
import Navigation from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
  title?: string;
}

export default function Layout({ 
  children, 
  currentView, 
  onViewChange, 
  title 
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={title} />
      <Navigation currentView={currentView} onViewChange={onViewChange} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
