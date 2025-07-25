
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, FileText, Users, Settings, TrendingUp, AlertTriangle } from 'lucide-react';
import IncidenciaForm from './IncidenciaForm';
import ReportesView from './ReportesView';
import ConsolidadoDiario from './ConsolidadoDiario';
import UserManagement from './admin/UserManagement';
import AuditLog from './admin/AuditLog';
import BorradoresView from './supervisor/BorradoresView';
import MonitorKPIs from './dashboard/MonitorKPIs';
import MonitorPerformance from './dashboard/MonitorPerformance';
import PeriodComparisonChart from './dashboard/PeriodComparisonChart';
import UserStatisticsChart from './dashboard/UserStatisticsChart';
import QuinzenalStatsCard from './dashboard/QuinzenalStatsCard';

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Cargando...</h2>
          <p className="text-gray-600">Por favor espera mientras cargamos tu perfil</p>
        </div>
      </div>
    );
  }

  const canViewReports = ['admin', 'supervisor_monitoreo', 'rrhh', 'finanzas', 'supervisor_salas'].includes(profile.role);
  const canViewBorradores = ['admin', 'supervisor_monitoreo'].includes(profile.role);
  const canViewAdmin = profile.role === 'admin';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Bienvenido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{profile.full_name || profile.email}</div>
                  <p className="text-sm text-gray-500 mt-1">
                    <Badge variant="outline" className="capitalize">
                      {profile.role.replace('_', ' ')}
                    </Badge>
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Estado del Sistema</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Operativo</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Todos los servicios funcionando correctamente</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <button 
                      onClick={() => setActiveTab('incidencias')}
                      className="w-full text-left text-sm p-2 rounded hover:bg-gray-50 transition-colors"
                    >
                      📝 Nueva Incidencia
                    </button>
                    {canViewReports && (
                      <button 
                        onClick={() => setActiveTab('reportes')}
                        className="w-full text-left text-sm p-2 rounded hover:bg-gray-50 transition-colors"
                      >
                        📊 Ver Reportes
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* KPIs and Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MonitorKPIs />
              <MonitorPerformance />
            </div>

            {/* Quinzenal Stats and User Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <QuinzenalStatsCard />
              <UserStatisticsChart />
            </div>

            {/* Period Comparison Chart */}
            <div className="grid grid-cols-1 gap-6">
              <PeriodComparisonChart />
            </div>
          </div>
        );
      
      case 'incidencias':
        return <IncidenciaForm />;
      
      case 'reportes':
        return canViewReports ? <ReportesView /> : <div>No tienes permisos para ver esta sección</div>;
      
      case 'consolidado':
        return canViewReports ? <ConsolidadoDiario /> : <div>No tienes permisos para ver esta sección</div>;
      
      case 'borradores':
        return canViewBorradores ? <BorradoresView /> : <div>No tienes permisos para ver esta sección</div>;
      
      case 'admin':
        return canViewAdmin ? <UserManagement /> : <div>No tienes permisos para ver esta sección</div>;
      
      case 'auditoria':
        return canViewAdmin ? <AuditLog /> : <div>No tienes permisos para ver esta sección</div>;
      
      default:
        return <div>Sección no encontrada</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
          <p className="mt-2 text-gray-600">Gestiona incidencias y revisa reportes del sistema</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 xl:grid-cols-7">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            
            <TabsTrigger value="incidencias" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Incidencias
            </TabsTrigger>
            
            {canViewReports && (
              <TabsTrigger value="reportes" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Reportes
              </TabsTrigger>
            )}
            
            {canViewReports && (
              <TabsTrigger value="consolidado" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Consolidado
              </TabsTrigger>
            )}
            
            {canViewBorradores && (
              <TabsTrigger value="borradores" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Borradores
              </TabsTrigger>
            )}
            
            {canViewAdmin && (
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Admin
              </TabsTrigger>
            )}
            
            {canViewAdmin && (
              <TabsTrigger value="auditoria" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Auditoría
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {renderTabContent()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
