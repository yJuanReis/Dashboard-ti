import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  Mail, 
  IdCard, 
  Wrench, 
  Settings, 
  HardDrive, 
  Server,
  Shield,
  Video,
  ArrowRight,
  Workflow
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
    title: "Evolução de HDs",
    description: "Acompanhe a evolução e status dos discos",
    icon: HardDrive,
    path: "/evolucao-hds",
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
    title: "Base de Conhecimento",
    description: "Acesse credenciais e documentação técnica",
    icon: Shield,
    path: "/base-conhecimento",
    gradient: "from-indigo-500 to-purple-500"
  },
  {
    title: "Fluxo Stepper",
    description: "Navegue por processos com passos interativos",
    icon: Workflow,
    path: "/fluxo-stepper",
    gradient: "from-pink-500 to-rose-500"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.path} to={tool.path}>
                <Card className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-gray-200 bg-white/80 backdrop-blur-sm h-full">
                  <CardContent className="p-6">
                    <div className="flex flex-col h-full">
                      {/* Icon with gradient background */}
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {tool.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {tool.description}
                        </p>
                      </div>

                      {/* Arrow indicator */}
                      <div className="flex items-center text-primary mt-4 group-hover:translate-x-2 transition-transform duration-300">
                        <span className="text-sm font-medium mr-1">Acessar</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
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
