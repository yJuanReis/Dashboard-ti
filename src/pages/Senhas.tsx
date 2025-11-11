import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X, Eye, EyeOff, Copy, Plus } from "lucide-react";
import { toast } from "sonner";

interface PasswordEntry {
  id: string;
  service: string;
  username: string;
  password: string;
  category: string;
  description: string;
}

const mockPasswords: PasswordEntry[] = [
  {
    id: "1",
    service: "Gmail Corporativo",
    username: "admin@brmarinas.com",
    password: "SecurePass123!",
    category: "Email",
    description: "Conta principal de email corporativo",
  },
  {
    id: "2",
    service: "Servidor NVR Principal",
    username: "admin",
    password: "NVR@2024Secure",
    category: "Servidores",
    description: "Acesso ao servidor principal de câmeras",
  },
  {
    id: "3",
    service: "Router Cisco",
    username: "cisco_admin",
    password: "Cisco#Admin2024",
    category: "Redes",
    description: "Router principal da rede",
  },
  {
    id: "4",
    service: "Database MySQL",
    username: "db_admin",
    password: "MySQL!2024@BR",
    category: "Servidores",
    description: "Banco de dados principal",
  },
];

export default function Senhas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [serviceFilter, setServiceFilter] = useState("todos");
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  const categories = ["todas", ...Array.from(new Set(mockPasswords.map((p) => p.category)))];
  const services = ["todos", ...Array.from(new Set(mockPasswords.map((p) => p.service)))];

  const filteredPasswords = mockPasswords.filter((password) => {
    const matchesSearch =
      password.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      password.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      password.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "todas" || password.category === categoryFilter;
    const matchesService = serviceFilter === "todos" || password.service === serviceFilter;
    return matchesSearch && matchesCategory && matchesService;
  });

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência`);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Email: "bg-blue-100 text-blue-700 border-blue-200",
      Servidores: "bg-green-100 text-green-700 border-green-200",
      Redes: "bg-purple-100 text-purple-700 border-purple-200",
      Default: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return colors[category] || colors.Default;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Base de Conhecimento</h1>
          <p className="text-muted-foreground">Gestão de senhas e credenciais</p>
        </div>
        <Button disabled className="gap-2 opacity-50 cursor-not-allowed relative group">
          <Plus className="w-4 h-4" />
          Adicionar
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Em breve
          </span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por serviço, descrição ou utilizador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-muted-foreground whitespace-nowrap">
              Categoria:
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-background border border-input rounded-md text-sm min-w-[150px]"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-muted-foreground whitespace-nowrap">
              Serviço:
            </label>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="px-3 py-2 bg-background border border-input rounded-md text-sm min-w-[150px]"
            >
              {services.map((service) => (
                <option key={service} value={service}>
                  {service.charAt(0).toUpperCase() + service.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Password Cards */}
      {filteredPasswords.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPasswords.map((password) => (
            <Card key={password.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg">{password.service}</CardTitle>
                  <Badge className={getCategoryColor(password.category)} variant="outline">
                    {password.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{password.description}</p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Utilizador:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-mono">{password.username}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(password.username, "Utilizador")}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Senha:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-mono">
                        {visiblePasswords.has(password.id) ? password.password : "••••••••"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => togglePasswordVisibility(password.id)}
                      >
                        {visiblePasswords.has(password.id) ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(password.password, "Senha")}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhuma senha encontrada.</p>
        </div>
      )}
    </div>
  );
}
