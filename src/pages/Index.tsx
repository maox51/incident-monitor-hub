
import { useState } from "react";
import Dashboard from "@/components/Dashboard";
import IncidenciaForm from "@/components/IncidenciaForm";
import ReportesView from "@/components/ReportesView";
import UserManagement from "@/components/admin/UserManagement";
import ConsolidadoDiario from "@/components/ConsolidadoDiario";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle } from "lucide-react";

const Index = () => {
  const { isAdmin, isMonitor } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Los monitores solo ven el formulario de nueva incidencia
  if (isMonitor && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
              <AlertTriangle className="text-orange-500" />
              Sistema de Monitoreo - Casino
            </h1>
            <p className="text-lg text-gray-600">
              Registro de incidencias de monitoreo por cámaras
            </p>
          </div>

          <IncidenciaForm />
        </div>
      </div>
    );
  }

  // Los administradores ven el sistema completo con sidebar
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <ProtectedRoute requireAdmin>
            <Dashboard />
          </ProtectedRoute>
        );
      case "nueva-incidencia":
        return (
          <ProtectedRoute requireAdmin>
            <IncidenciaForm />
          </ProtectedRoute>
        );
      case "consolidado":
        return (
          <ProtectedRoute requireAdmin>
            <ConsolidadoDiario />
          </ProtectedRoute>
        );
      case "reportes":
        return (
          <ProtectedRoute requireAdmin>
            <ReportesView />
          </ProtectedRoute>
        );
      case "usuarios":
        return (
          <ProtectedRoute requireAdmin>
            <UserManagement />
          </ProtectedRoute>
        );
      default:
        return (
          <ProtectedRoute requireAdmin>
            <Dashboard />
          </ProtectedRoute>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <div className="flex">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="flex-1 lg:ml-64 p-4 lg:p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
              <AlertTriangle className="text-orange-500" />
              Sistema de Monitoreo - Casino
            </h1>
            <p className="text-lg text-gray-600">
              Gestión integral de incidencias de monitoreo por cámaras
            </p>
          </div>

          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Index;
