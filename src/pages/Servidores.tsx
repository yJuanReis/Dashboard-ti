import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Server,
  Cpu,
  HardDrive,
  Activity,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const mockServidores = [
  { 
    id: 1, 
    nome: "VM-APP-01", 
    tipo: "Aplicação", 
    cpu: 45, 
    memoria: 68, 
    disco: 52, 
    status: "online",
    ip: "192.168.1.100"
  },
  { 
    id: 2, 
    nome: "SRV-DB-01", 
    tipo: "Banco de Dados", 
    cpu: 82, 
    memoria: 91, 
    disco: 78, 
    status: "warning",
    ip: "192.168.1.101"
  },
  { 
    id: 3, 
    nome: "SRV-WEB-01", 
    tipo: "Web Server", 
    cpu: 23, 
    memoria: 34, 
    disco: 41, 
    status: "online",
    ip: "192.168.1.102"
  },
  { 
    id: 4, 
    nome: "SRV-BACKUP-01", 
    tipo: "Backup", 
    cpu: 12, 
    memoria: 18, 
    disco: 95, 
    status: "warning",
    ip: "192.168.1.103"
  },
];

const ProgressBar = ({ value, color = "blue" }) => {
  const colorClass = 
    value >= 90 ? "bg-red-500" :
    value >= 75 ? "bg-yellow-500" :
    `bg-${color}-500`;

  return (
    <div className="w-full bg-slate-200 rounded-full h-2">
      <div 
        className={`${colorClass} h-2 rounded-full transition-all`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
};

export default function Servidores() {
  return (
    <div className="min-h-screen bg-background p-3 md:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-6 lg:mb-8">
          <Link to={createPageUrl("Home")}>
            <Button variant="outline" size="icon" className="h-8 w-8 md:h-10 md:w-10">
              <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Pagina em desenvolvimento</h1>
              <Badge variant="secondary" className="text-xs">Em Desenvolvimento</Badge>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">Em Desenvolvimento</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Servidores</p>
                  <p className="text-2xl font-bold text-white">{mockServidores.length}</p>
                </div>
                <Server className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Online</p>
                  <p className="text-2xl font-bold text-green-400">2</p>
                </div>
                <Activity className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Atenção</p>
                  <p className="text-2xl font-bold text-yellow-400">2</p>
                </div>
                <Zap className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Uptime Médio</p>
                  <p className="text-2xl font-bold text-white">99.8%</p>
                </div>
                <div className="text-2xl">⚡</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Servers List */}
        <div className="grid gap-4">
          {mockServidores.map((servidor) => (
            <Card key={servidor.id} className="bg-slate-800 border-slate-700 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg flex items-center justify-center border border-slate-600">
                      <Server className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-white">{servidor.nome}</CardTitle>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-slate-300 border-slate-600">{servidor.tipo}</Badge>
                        <Badge variant="outline" className="text-slate-300 border-slate-600">{servidor.ip}</Badge>
                      </div>
                    </div>
                  </div>
                  <Badge className={
                    servidor.status === "online" ? "bg-green-500/20 text-green-300 border-green-500" :
                    "bg-yellow-500/20 text-yellow-300 border-yellow-500"
                  }>
                    {servidor.status === "online" ? "Online" : "Atenção"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-slate-300">CPU</span>
                      </div>
                      <span className="text-sm font-semibold text-white">{servidor.cpu}%</span>
                    </div>
                    <ProgressBar value={servidor.cpu} color="blue" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-slate-300">Memória</span>
                      </div>
                      <span className="text-sm font-semibold text-white">{servidor.memoria}%</span>
                    </div>
                    <ProgressBar value={servidor.memoria} color="purple" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-slate-300">Disco</span>
                      </div>
                      <span className="text-sm font-semibold text-white">{servidor.disco}%</span>
                    </div>
                    <ProgressBar value={servidor.disco} color="green" />
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant="outline" className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                    Ver Métricas Detalhadas
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}