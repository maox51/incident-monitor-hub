
import React, { useState } from 'react';
import { Menu, X, BarChart3, AlertTriangle, FileText, Users, Calendar, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'nueva-incidencia', label: 'Nueva Incidencia', icon: AlertTriangle },
    { id: 'consolidado', label: 'Consolidado Diario', icon: Calendar },
    { id: 'reportes', label: 'Reportes', icon: FileText },
    { id: 'usuarios', label: 'Usuarios', icon: Users },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg lg:hidden"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-40",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0 lg:static lg:z-auto"
      )}>
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <AlertTriangle className="text-orange-500" />
            Casino Monitor
          </h2>
        </div>

        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-6 py-3 text-left transition-colors",
                  activeTab === item.id
                    ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 text-xs text-gray-500 text-center">
          Sistema de Monitoreo v1.0
        </div>
      </div>
    </>
  );
};

export default Sidebar;
