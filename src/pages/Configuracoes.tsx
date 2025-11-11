import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Settings, User, Moon, Sun, Bell, Lock, UserPlus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const mockUsuarios = [
  { id: 1, nome: "Admin Principal", email: "admin@brmarinas.com", role: "admin" },
  { id: 2, nome: "João Silva", email: "joao.silva@brmarinas.com", role: "user" },
  { id: 3, nome: "Maria Santos", email: "maria.santos@brmarinas.com", role: "user" },
];

export default function Configuracoes() {
  const [tema, setTema] = useState("light");
  const [usuarios, setUsuarios] = useState(mockUsuarios);
  const [novoUsuario, setNovoUsuario] = useState({ email: "", nome: "", senha: "" });
  const [statusMessage, setStatusMessage] = useState("");
  const currentUser = { email: "admin@brmarinas.com", role: "admin", nome: "Equipa de TI" };

  const handleAddUser = () => {
    if (!novoUsuario.email || !novoUsuario.nome || !novoUsuario.senha) {
      setStatusMessage("Preencha todos os campos");
      return;
    }

    const newUser = {
      id: Math.max(...usuarios.map(u => u.id)) + 1,
      nome: novoUsuario.nome,
      email: novoUsuario.email,
      role: "user"
    };

    setUsuarios([...usuarios, newUser]);
    setNovoUsuario({ email: "", nome: "", senha: "" });
    setStatusMessage("Utilizador adicionado com sucesso!");
    setTimeout(() => setStatusMessage(""), 3000);
  };

  const handleDeleteUser = (id) => {
    if (window.confirm("Tem certeza que deseja remover este utilizador?")) {
      setUsuarios(usuarios.filter(u => u.id !== id));
      setStatusMessage("Utilizador removido");
      setTimeout(() => setStatusMessage(""), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("Home")}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
            <p className="text-slate-600">Gerencie preferências e configurações do sistema</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Perfil do Utilizador
                  </CardTitle>
                  <Badge className="bg-blue-100 text-blue-700">Ativo</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {currentUser.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-900">{currentUser.nome}</h3>
                    <p className="text-sm text-slate-600">{currentUser.email}</p>
                    <Badge variant="outline" className="mt-2">
                      {currentUser.role === 'admin' ? 'Administrador' : 'Utilizador'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <Label htmlFor="displayName" className="text-sm font-medium text-slate-700 mb-2">Nome de exibição</Label>
                    <div className="flex gap-2">
                      <Input
                        id="displayName"
                        type="text"
                        placeholder="Seu nome"
                        defaultValue={currentUser.nome}
                      />
                      <Button className="bg-blue-600 hover:bg-blue-700">Salvar</Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-2">Alterar senha</Label>
                    <Button variant="outline" className="w-full">
                      <Lock className="w-4 h-4 mr-2" />
                      Enviar e-mail de redefinição
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Management Card (Only for Admin) */}
            {currentUser.role === 'admin' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Gestão de Utilizadores
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-4">Adicionar Novo Utilizador</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        type="email"
                        placeholder="E-mail do novo utilizador"
                        value={novoUsuario.email}
                        onChange={(e) => setNovoUsuario({...novoUsuario, email: e.target.value})}
                      />
                      <Input
                        type="text"
                        placeholder="Nome completo"
                        value={novoUsuario.nome}
                        onChange={(e) => setNovoUsuario({...novoUsuario, nome: e.target.value})}
                      />
                      <Input
                        type="password"
                        placeholder="Senha temporária"
                        value={novoUsuario.senha}
                        onChange={(e) => setNovoUsuario({...novoUsuario, senha: e.target.value})}
                      />
                      <Button 
                        onClick={handleAddUser}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>
                    {statusMessage && (
                      <p className="text-sm text-green-600 mt-2">{statusMessage}</p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">Utilizadores Registados</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {usuarios.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.nome}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {user.role === 'admin' ? 'Admin' : 'User'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {user.id !== 1 && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Appearance Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Aparência
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-3">Tema</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setTema('light')}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                        tema === 'light' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Sun className={`w-5 h-5 ${tema === 'light' ? 'text-blue-600' : 'text-slate-600'}`} />
                      <div className="text-left">
                        <div className={`font-semibold ${tema === 'light' ? 'text-blue-900' : 'text-slate-900'}`}>Claro</div>
                        <div className={`text-xs ${tema === 'light' ? 'text-blue-700' : 'text-slate-600'}`}>Tema padrão</div>
                      </div>
                    </button>
                    <button 
                      onClick={() => setTema('dark')}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                        tema === 'dark' 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Moon className={`w-5 h-5 ${tema === 'dark' ? 'text-indigo-600' : 'text-slate-600'}`} />
                      <div className="text-left">
                        <div className={`font-semibold ${tema === 'dark' ? 'text-indigo-900' : 'text-slate-900'}`}>Escuro</div>
                        <div className={`text-xs ${tema === 'dark' ? 'text-indigo-700' : 'text-slate-600'}`}>Em breve</div>
                      </div>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notificações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                  <div>
                    <h4 className="font-semibold text-slate-900">Notificações por E-mail</h4>
                    <p className="text-sm text-slate-600">Receba atualizações importantes por e-mail</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                  <div>
                    <h4 className="font-semibold text-slate-900">Alertas do Sistema</h4>
                    <p className="text-sm text-slate-600">Notificações sobre atualizações e manutenções</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* System Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Informações do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Versão:</span>
                  <span className="font-semibold">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Último acesso:</span>
                  <span className="font-semibold">Hoje</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Ambiente:</span>
                  <Badge className="bg-green-100 text-green-700 text-xs">Produção</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start text-sm">
                  📊 Exportar Dados
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm">
                  🔄 Limpar Cache
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm text-red-600 hover:text-red-700">
                  🚪 Terminar Sessão
                </Button>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <h4 className="font-semibold text-blue-900 mb-2">Precisa de ajuda?</h4>
                <p className="text-sm text-blue-700 mb-4">
                  Entre em contato com o suporte técnico para assistência
                </p>
                <Button variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-100">
                  Contactar Suporte
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}