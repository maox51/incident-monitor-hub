import {
  Home,
  Calendar,
  AlertTriangle,
  Settings,
  Users,
  FileText,
  LogOut,
  Building2
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: any;
}

const Sidebar = ({ activeTab, setActiveTab, profile }: SidebarProps) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: Home,
      description: 'Resumen general'
    },
    {
      id: 'incidencias',
      name: 'Nueva Incidencia',
      icon: AlertTriangle,
      description: 'Reportar una incidencia'
    },
    {
      id: 'reportes',
      name: 'Reportes',
      icon: FileText,
      description: 'Ver reportes'
    },
    ...(profile?.role === 'admin' ? [
      {
        id: 'admin',
        name: 'Admin',
        icon: Settings,
        description: 'Administración de usuarios'
      },
      {
        id: 'audit',
        name: 'Audit Log',
        icon: Calendar,
        description: 'Registro de actividad'
      }
    ] : []),
    ...(profile?.role === 'supervisor_monitoreo' || profile?.role === 'admin' ? [
      {
        id: 'borradores',
        name: 'Borradores',
        icon: AlertTriangle,
        description: 'Incidencias en borrador'
      }
    ] : []),
    ...(profile?.role === 'admin' || profile?.role === 'supervisor_monitoreo' || profile?.role === 'monitor' ? [
      {
        id: 'monitoreo-salas',
        name: 'Monitoreo de Salas',
        icon: Building2,
        description: 'Registro de tiempos por sala'
      }
    ] : [])
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="w-64 bg-gray-100 dark:bg-gray-900 h-screen fixed top-0 left-0 overflow-y-auto border-r dark:border-gray-800">
      <div className="p-4">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Sistema de Incidencias
        </h1>
      </div>
      <nav className="py-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.id}
            to={`/${item.id}`}
            className={`flex items-center space-x-2 p-3 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition duration-200 ${activeTab === item.id ? 'bg-gray-200 dark:bg-gray-800' : ''
              }`}
            onClick={() => setActiveTab(item.id)}
          >
            <item.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {item.name}
            </span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 p-3 bg-red-100 dark:bg-red-800 rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition duration-200 w-full"
        >
          <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
          <span className="text-sm font-medium text-red-700 dark:text-red-300">
            Cerrar Sesión
          </span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
