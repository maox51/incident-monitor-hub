
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Dashboard from "@/components/Dashboard";
import IncidenciaForm from "@/components/IncidenciaForm";
import ReportesView from "@/components/ReportesView";
import UserManagement from "@/components/admin/UserManagement";
import Header from "@/components/Header";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, FileText, BarChart3, Users } from "lucide-react";

const Index = () => {
  const { isAdmin, isMonitor } = useAuth();

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

  // Los administradores ven todo el sistema completo
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
            Gestión integral de incidencias de monitoreo por cámaras
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="nueva-incidencia" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Nueva Incidencia
            </TabsTrigger>
            <TabsTrigger value="reportes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Reportes
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Usuarios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <ProtectedRoute requireAdmin>
              <Dashboard />
            </ProtectedRoute>
          </TabsContent>

          <TabsContent value="nueva-incidencia">
            <ProtectedRoute requireAdmin>
              <IncidenciaForm />
            </ProtectedRoute>
          </TabsContent>

          <TabsContent value="reportes">
            <ProtectedRoute requireAdmin>
              <ReportesView />
            </ProtectedRoute>
          </TabsContent>

          <TabsContent value="usuarios">
            <ProtectedRoute requireAdmin>
              <UserManagement />
            </ProtectedRoute>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
