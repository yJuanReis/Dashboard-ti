import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Wrench,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  User
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const mockChamados = [
  {
    id: 1,
    titulo: "Impressora não imprime",
    descricao: "Impressora HP da recepção não está imprimindo documentos",
    prioridade: "alta",
    status: "aberto",
    solicitante: "Maria Silva",
    data: "2024-01-15"
  },
  {
    id: 2,
    titulo: "Lentidão na rede",
    descricao: "Internet muito lenta no setor administrativo",
    prioridade: "media",
    status: "em_andamento",
    solicitante: "João Santos",
    data: "2024-01-14"
  },
  {
    id: 3,
    titulo: "Acesso ao sistema bloqueado",
    descricao: "Não consigo acessar o sistema de gestão",
    prioridade: "alta",
    status: "aberto",
    solicitante: "Ana Costa",
    data: "2024-01-15"
  },
  {
    id: 4,
    titulo: "Backup falhou",
    descricao: "Backup automático não foi executado na última noite",
    prioridade: "critica",
    status: "em_andamento",
    solicitante: "Sistema",
    data: "2024-01-15"
  },
  {
    id: 5,
    titulo: "Instalação de software",
    descricao: "Preciso do Adobe Acrobat instalado",
    prioridade: "baixa",
    status: "resolvido",
    solicitante: "Pedro Oliveira",
    data: "2024-01-13"
  },
];

export default function Chamados() {
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const chamadosFiltrados = filtroStatus === "todos" 
    ? mockChamados 
    : mockChamados.filter(c => c.status === filtroStatus);

  const getPrioridadeColor = (prioridade) => {
    switch(prioridade) {
      case "critica": return "bg-red-100 text-red-700 border-red-200";
      case "alta": return "bg-orange-100 text-orange-700 border-orange-200";
      case "media": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "baixa": return "bg-primary/10 text-primary border-primary/30";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusInfo = (status) => {
    switch(status) {
      case "aberto":
        return { icon: AlertCircle, label: "Aberto", color: "bg-red-100 text-red-700 border-red-200" };
      case "em_andamento":
        return { icon: Clock, label: "Em Andamento", color: "bg-primary/10 text-primary border-primary/30" };
      case "resolvido":
        return { icon: CheckCircle2, label: "Resolvido", color: "bg-green-100 text-green-700 border-green-200" };
      default:
        return { icon: AlertCircle, label: status, color: "bg-gray-100 text-gray-700 border-gray-200" };
    }
  };

  const abertosCount = mockChamados.filter(c => c.status === "aberto").length;
  const emAndamentoCount = mockChamados.filter(c => c.status === "em_andamento").length;
  const resolvidosCount = mockChamados.filter(c => c.status === "resolvido").length;

  return (
    <div className="min-h-screen bg-background p-3 md:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Chamados</p>
                  <p className="text-xl md:text-2xl font-bold text-slate-900">{mockChamados.length}</p>
                </div>
                <Wrench className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Abertos</p>
                  <p className="text-2xl font-bold text-red-600">{abertosCount}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Em Andamento</p>
                  <p className="text-2xl font-bold text-primary">{emAndamentoCount}</p>
                </div>
                <Clock className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Resolvidos</p>
                  <p className="text-2xl font-bold text-green-600">{resolvidosCount}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Button 
                variant={filtroStatus === "todos" ? "default" : "outline"}
                onClick={() => setFiltroStatus("todos")}
              >
                Todos
              </Button>
              <Button 
                variant={filtroStatus === "aberto" ? "default" : "outline"}
                onClick={() => setFiltroStatus("aberto")}
              >
                Abertos
              </Button>
              <Button 
                variant={filtroStatus === "em_andamento" ? "default" : "outline"}
                onClick={() => setFiltroStatus("em_andamento")}
              >
                Em Andamento
              </Button>
              <Button 
                variant={filtroStatus === "resolvido" ? "default" : "outline"}
                onClick={() => setFiltroStatus("resolvido")}
              >
                Resolvidos
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <div className="grid gap-4">
          {chamadosFiltrados.map((chamado) => {
            const statusInfo = getStatusInfo(chamado.status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <Card key={chamado.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">#{chamado.id} - {chamado.titulo}</CardTitle>
                      </div>
                      <p className="text-slate-600 text-sm">{chamado.descricao}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge className={statusInfo.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                      <Badge className={getPrioridadeColor(chamado.prioridade)}>
                        {chamado.prioridade.charAt(0).toUpperCase() + chamado.prioridade.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{chamado.solicitante}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(chamado.data).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <Button variant="outline">
                      Ver Detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}