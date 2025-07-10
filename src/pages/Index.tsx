
import { useState } from "react";
import Dashboard from "@/components/Dashboard";
import IncidenciaForm from "@/components/IncidenciaForm";
import ReportesView from "@/components/ReportesView";
import UserManagement from "@/components/admin/UserManagement";
import ConsolidadoDiario from "@/components/ConsolidadoDiario";
import ImportDataModule from "@/components/ImportDataModule";
import Header from "@/components/Header";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, BarChart3, FileText, Users, Calendar, Upload, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Index = () => {
  const { isAdmin, isMonitor } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, adminOnly: true },
    { id: 'nueva-incidencia', label: 'Nueva Incidencia', icon: AlertTriangle, adminOnly: false },
    { id: 'consolidado', label: 'Consolidado Diario', icon: Calendar, adminOnly: true },
    { id: 'reportes', label: 'Reportes', icon: FileText, adminOnly: true },
    { id: 'usuarios', label: 'Usuarios', icon: Users, adminOnly: true },
    { id: 'importar', label: 'Importar Datos', icon: Upload, adminOnly: true },
  ];

  // Los monitores solo ven el formulario de nueva incidencia
  if (isMonitor && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-8">
          <div className="text-center mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2 md:gap-3">
              <AlertTriangle className="text-orange-500 h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
              <span>Sistema de Monitoreo - Casino</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 px-2 sm:px-4">
              Registro de incidencias de monitoreo por cámaras
            </p>
          </div>

          <IncidenciaForm />
        </div>
      </div>
    );
  }

  // Los administradores ven el sistema completo con navegación responsive
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
      case "importar":
        return (
          <ProtectedRoute requireAdmin>
            <ImportDataModule />
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

  const filteredMenuItems = menuItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      {/* Navigation Bar - Responsive */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-2 sm:px-4">
          {/* Mobile Navigation */}
          <div className="flex items-center justify-between py-3 md:hidden">
            <h2 className="text-lg font-semibold text-gray-900">
              {filteredMenuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
            </h2>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="py-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Navegación</h3>
                  <div className="space-y-2">
                    {filteredMenuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                            activeTab === item.id
                              ? "bg-blue-100 text-blue-700 font-medium"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 py-2">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-8">
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2 md:gap-3">
            <AlertTriangle className="text-orange-500 h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
            <span>Sistema de Monitoreo - Casino</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 px-2 sm:px-4">
            Gestión integral de incidencias de monitoreo por cámaras
          </p>
        </div>

        {renderContent()}
      </div>
    </div>
  );
};

export default Index;
