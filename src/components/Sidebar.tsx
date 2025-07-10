
import React, { useState } from 'react';
import { Menu, X, BarChart3, AlertTriangle, FileText, Users, Calendar, Upload } from 'lucide-react';
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
    { id: 'importar', label: 'Importar Datos', icon: Upload },
  ];

  return (
    <>
      {/* Mobile menu button - Fixed positioning for better mobile UX */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-2 left-2 z-50 p-3 bg-white rounded-lg shadow-lg lg:hidden hover:bg-gray-50 transition-colors border border-gray-200"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay for mobile - Enhanced for better mobile interaction */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden backdrop-blur-sm" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Improved responsive behavior */}
      <div className={cn(
        "fixed left-0 top-0 h-full w-72 sm:w-80 md:w-64 bg-gradient-to-b from-slate-900 to-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-40 flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0 lg:static lg:z-auto lg:w-64"
      )}>
        {/* Header - Better padding for mobile */}
        <div className="p-4 sm:p-6 border-b border-slate-700">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="text-orange-400 w-5 h-5 sm:w-6 sm:h-6" />
            <span className="truncate">Casino Monitor</span>
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">Sistema de Gestión</p>
        </div>

        {/* Navigation - Enhanced mobile scrolling */}
        <nav className="flex-1 pt-4 sm:pt-6 overflow-y-auto overscroll-contain">
          <div className="space-y-1 px-2 sm:px-0">
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
                    "w-full flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 text-left transition-all duration-200 group relative rounded-lg sm:rounded-none mx-2 sm:mx-0",
                    activeTab === item.id
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  )}
                >
                  {activeTab === item.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-400 rounded-r-full sm:rounded-none" />
                  )}
                  <Icon className={cn(
                    "w-4 h-4 sm:w-5 sm:h-5 transition-colors flex-shrink-0",
                    activeTab === item.id ? "text-white" : "group-hover:text-orange-400"
                  )} />
                  <span className="font-medium text-sm sm:text-base truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer - Better mobile spacing */}
        <div className="p-4 sm:p-6 border-t border-slate-700">
          <div className="text-xs text-slate-400 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Sistema Activo</span>
            </div>
            <p>v2.0 - Casino Monitor Pro</p>
          </div>
        </div>
      </div>

      {/* Spacer for desktop layout */}
      <div className="hidden lg:block lg:w-64 flex-shrink-0" />
    </>
  );
};

export default Sidebar;
