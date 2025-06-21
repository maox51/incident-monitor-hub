
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Dashboard from "@/components/Dashboard";
import IncidenciaForm from "@/components/IncidenciaForm";
import ReportesView from "@/components/ReportesView";
import Header from "@/components/Header";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, FileText, BarChart3 } from "lucide-react";

const Index = () => {
  const { isAdmin, isMonitor } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <AlertTriangle className="text-orange-500" />
            Sistema de Monitoreo de Incidencias
          </h1>
          <p className="text-lg text-gray-600">
            Gestión integral de incidencias y reportes por área y clasificación
          </p>
        </div>

        <Tabs defaultValue={isAdmin ? "dashboard" : "reportes"} className="w-full">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-1'} mb-8`}>
            {isAdmin && (
              <>
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="nueva-incidencia" className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Nueva Incidencia
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="reportes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Reportes
            </TabsTrigger>
          </TabsList>

          {isAdmin && (
            <>
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
            </>
          )}

          <TabsContent value="reportes">
            <ReportesView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
