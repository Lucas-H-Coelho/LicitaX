import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, FileText, ListChecks, PlusCircle, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function DashboardPage() {
  const navigate = useNavigate();
  // Mock data - replace with actual data fetching
  const stats = {
    licitacoesAtivas: 15,
    propostasEnviadas: 8,
    propostasVencidas: 2,
    novasLicitacoesHoje: 3,
  };

  const recentActivities = [
    { id: 1, text: "Nova licitação 'Construção de Escola' adicionada.", time: "2 horas atrás" },
    { id: 2, text: "Proposta para 'Serviços de TI' enviada.", time: "5 horas atrás" },
    { id: 3, text: "Você venceu a licitação 'Consultoria Ambiental'.", time: "1 dia atrás" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button onClick={() => navigate('/licitacoes/nova')}> {/* Assuming a route for new tender */}
          <PlusCircle className="mr-2 h-4 w-4" /> Nova Licitação
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Licitações Ativas</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.licitacoesAtivas}</div>
            <p className="text-xs text-muted-foreground">
              {stats.novasLicitacoesHoje} novas hoje
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propostas Enviadas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.propostasEnviadas}</div>
            <p className="text-xs text-muted-foreground">
              Acompanhando status
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propostas Vencidas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.propostasVencidas}</div>
            <p className="text-xs text-muted-foreground">
              Parabéns!
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso (Exemplo)</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.propostasVencidas / (stats.propostasEnviadas || 1) * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Baseado nas propostas enviadas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Visão Geral (Exemplo)</CardTitle>
            <CardDescription>Um gráfico de exemplo mostrando o progresso.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {/* Placeholder for a chart - Recharts can be used here */}
            <div className="h-[350px] w-full bg-muted/50 flex items-center justify-center rounded-md">
              <p className="text-muted-foreground">Chart Placeholder</p>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>Últimas atualizações e ações na plataforma.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 pt-1">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <div>
                  <p className="text-sm">{activity.text}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
             <Button variant="outline" className="w-full" onClick={() => navigate('/atividades')}>
              Ver todas as atividades
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
