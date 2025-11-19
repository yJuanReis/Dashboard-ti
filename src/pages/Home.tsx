import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  Mail, 
  IdCard, 
  Wrench, 
  Settings, 
  HardDrive, 
  Server,
  Video,
  ArrowRight,
  Key,
  Network,
  FileText
} from "lucide-react";

const tools = [
  {
    title: "Assinaturas de Email",
    description: "Crie assinaturas profissionais personalizadas",
    icon: Mail,
    path: "/assinaturas",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    title: "Gerador de Crachás",
    description: "Gere crachás personalizados para sua equipe",
    icon: IdCard,
    path: "/crachas",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    title: "Gestão de Chamados",
    description: "Gerencie e acompanhe tickets de suporte",
    icon: Wrench,
    path: "/chamados",
    gradient: "from-orange-500 to-red-500"
  },
  {
    title: "Controle de NVR",
    description: "Monitorize sistemas de câmeras e gravadores",
    icon: Video,
    path: "/controle-nvr",
    gradient: "from-green-500 to-emerald-500"
  },
  {
    title: "Controle de HDs",
    description: "Acompanhe a evolução e status dos discos",
    icon: HardDrive,
    path: "/Controle-hds",
    gradient: "from-teal-500 to-cyan-500"
  },
  {
    title: "Servidores",
    description: "Monitorize performance dos servidores",
    icon: Server,
    path: "/servidores",
    gradient: "from-slate-600 to-slate-800"
  },
  {
    title: "Senhas",
    description: "Gerencie e consulte senhas do sistema",
    icon: Key,
    path: "/senhas",
    gradient: "from-amber-500 to-yellow-500"
  },
  {
    title: "Gestão de Rede",
    description: "Gerencie configurações e monitoramento de rede",
    icon: Network,
    path: "/gestaorede",
    gradient: "from-indigo-500 to-blue-500"
  },
  {
    title: "Termo de Responsabilidade",
    description: "Acesse e gerencie termos de responsabilidade",
    icon: FileText,
    path: "/termos",
    gradient: "from-violet-500 to-purple-500"
  },
  {
    title: "Configurações",
    description: "Gerencie usuários e preferências do sistema",
    icon: Settings,
    path: "/configuracoes",
    gradient: "from-gray-600 to-gray-800"
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-3">
            Bem-vindo ao Portal de TI
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Acesse todas as ferramentas e recursos necessários para gerenciar a infraestrutura de TI 
            de forma centralizada e eficiente.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.path} to={tool.path} className="block h-full">
                <Card className="group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-border/50 bg-card/50 backdrop-blur-sm h-full hover:border-primary/50 hover:bg-card">
                  <CardContent className="p-6 h-full flex flex-col">
                    {/* Icon with gradient background */}
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-5 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300 shadow-md`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 mb-4">
                      <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                        {tool.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {tool.description}
                      </p>
                    </div>

                    {/* Arrow indicator */}
                    <div className="flex items-center text-primary mt-auto pt-2 group-hover:translate-x-1 transition-transform duration-300">
                      <span className="text-sm font-medium mr-2">Acessar</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            Sistema desenvolvido pela equipe de TI - BR Marinas
          </p>
        </div>
      </main>
    </div>
  );
}
