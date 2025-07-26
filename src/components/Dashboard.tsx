import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import IncidenciaForm from './incidencias/IncidenciaForm';
import ReportesView from './reports/ReportesView';
import UserManagement from './admin/UserManagement';
import AuditLog from './admin/AuditLog';
import BorradoresView from './incidencias/BorradoresView';
import QuinzenalStatsCard from './dashboard/QuinzenalStatsCard';
import PeriodComparisonCard from './dashboard/PeriodComparisonCard';
import SalaTimingModule from './monitoring/SalaTimingModule';

const Dashboard = () => {
  const { profile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (!profile) {
      router.push('/login');
    }
  }, [profile, router]);

  if (!profile) {
    return <div>Cargando...</div>;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <QuinzenalStatsCard />
              <PeriodComparisonCard />
            </div>
          </div>
        );
      case 'incidencias':
        return <IncidenciaForm />;
      case 'reportes':
        return <ReportesView />;
      case 'admin':
        return profile?.role === 'admin' ? <UserManagement /> : <div>No tienes permisos para acceder a esta sección.</div>;
      case 'audit':
        return profile?.role === 'admin' ? <AuditLog /> : <div>No tienes permisos para acceder a esta sección.</div>;
      case 'borradores':
        return (profile?.role === 'supervisor_monitoreo' || profile?.role === 'admin') ? 
          <BorradoresView /> : 
          <div>No tienes permisos para acceder a esta sección.</div>;
      case 'monitoreo-salas':
        return <SalaTimingModule />;
      default:
        return <div>Sección no encontrada</div>;
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList>
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="incidencias">Incidencias</TabsTrigger>
        <TabsTrigger value="reportes">Reportes</TabsTrigger>
        {(profile?.role === 'admin' || profile?.role === 'supervisor_monitoreo') && (
          <TabsTrigger value="borradores">Borradores</TabsTrigger>
        )}
        {profile?.role === 'admin' && <TabsTrigger value="admin">Admin</TabsTrigger>}
        {profile?.role === 'admin' && <TabsTrigger value="audit">Audit Log</TabsTrigger>}
        {(profile?.role === 'admin' || profile?.role === 'supervisor_monitoreo' || profile?.role === 'monitor') && (
          <TabsTrigger value="monitoreo-salas">Monitoreo de Salas</TabsTrigger>
        )}
      </TabsList>
      <TabsContent value={activeTab}>
        {renderContent()}
      </TabsContent>
    </Tabs>
  );
};

export default Dashboard;
