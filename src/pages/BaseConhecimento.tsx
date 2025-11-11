import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Shield, 
  Search, 
  Plus, 
  Lock,
  Server,
  Database,
  Cloud,
  Wifi,
  Eye,
  EyeOff,
  Copy,
  Check
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const mockCredenciais = [
  {
    id: 1,
    servico: "Servidor Principal",
    tipo: "SSH",
    usuario: "admin",
    senha: "***************",
    url: "192.168.1.100",
    categoria: "Servidores",
    icon: Server
  },
  {
    id: 2,
    servico: "Database MySQL",
    tipo: "Database",
    usuario: "root",
    senha: "***************",
    url: "db.brmarinas.local",
    categoria: "Banco de Dados",
    icon: Database
  },
  {
    id: 3,
    servico: "AWS Console",
    tipo: "Cloud",
    usuario: "admin@brmarinas.com",
    senha: "***************",
    url: "https://aws.amazon.com",
    categoria: "Cloud",
    icon: Cloud
  },
  {
    id: 4,
    servico: "Router Cisco",
    tipo: "Network",
    usuario: "cisco",
    senha: "***************",
    url: "192.168.1.1",
    categoria: "Rede",
    icon: Wifi
  },
];

export default function BaseConhecimento() {
  const [searchTerm, setSearchTerm] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredCredenciais = mockCredenciais.filter(cred =>
    cred.servico.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cred.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Home")}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-slate-900">Base de Conhecimento</h1>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">Em Testes</Badge>
              </div>
              <p className="text-slate-600">Credenciais e documentação técnica centralizada</p>
            </div>
          </div>
          <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
            <Plus className="w-4 h-4" />
            Nova Credencial
          </Button>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Pesquisar por serviço, categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Credenciais</p>
                  <p className="text-2xl font-bold text-slate-900">{mockCredenciais.length}</p>
                </div>
                <Shield className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Servidores</p>
                  <p className="text-2xl font-bold text-slate-900">1</p>
                </div>
                <Server className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Cloud Services</p>
                  <p className="text-2xl font-bold text-slate-900">1</p>
                </div>
                <Cloud className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Rede</p>
                  <p className="text-2xl font-bold text-slate-900">1</p>
                </div>
                <Wifi className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Credentials List */}
        <div className="grid gap-4">
          {filteredCredenciais.map((cred) => {
            const Icon = cred.icon;
            return (
              <Card key={cred.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{cred.servico}</CardTitle>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{cred.categoria}</Badge>
                          <Badge variant="outline">{cred.tipo}</Badge>
                        </div>
                      </div>
                    </div>
                    <Lock className="w-5 h-5 text-emerald-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Usuário</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm font-semibold">{cred.usuario}</p>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(cred.usuario, `user-${cred.id}`)}
                        >
                          {copiedId === `user-${cred.id}` ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Senha</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm font-semibold">
                          {visiblePasswords[cred.id] ? "SuperSecret123!" : cred.senha}
                        </p>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => togglePasswordVisibility(cred.id)}
                        >
                          {visiblePasswords[cred.id] ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </Button>
                        {visiblePasswords[cred.id] && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard("SuperSecret123!", `pass-${cred.id}`)}
                          >
                            {copiedId === `pass-${cred.id}` ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">URL/IP</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm font-semibold truncate">{cred.url}</p>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(cred.url, `url-${cred.id}`)}
                        >
                          {copiedId === `url-${cred.id}` ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredCredenciais.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhuma credencial encontrada</h3>
              <p className="text-slate-600">Tente ajustar os filtros ou adicione uma nova credencial</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}