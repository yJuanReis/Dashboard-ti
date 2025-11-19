import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, XCircle, AlertTriangle, Loader2, Download, ArrowLeft } from "lucide-react";
import { runSecurityTests, SecurityTestResult, downloadSecurityReport } from "@/lib/securityTests";
import { useNavigate } from "react-router-dom";

export default function SecurityTest() {
  const navigate = useNavigate();
  const [results, setResults] = useState<SecurityTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  // Verificar se o acesso veio de Configurações
  useEffect(() => {
    const fromConfig = sessionStorage.getItem('securityTestFromConfig');
    if (!fromConfig) {
      // Se não veio de Configurações, redirecionar
      navigate('/configuracoes', { replace: true });
    } else {
      // Limpar o flag após verificar
      sessionStorage.removeItem('securityTestFromConfig');
    }
  }, [navigate]);

  const handleRunTests = async () => {
    setIsRunning(true);
    setHasRun(false);
    try {
      const testResults = await runSecurityTests();
      setResults(testResults);
      setHasRun(true);
    } catch (error) {
      console.error("Erro ao executar testes:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">Passou</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-800">Falhou</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Aviso</Badge>;
      default:
        return null;
    }
  };

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-600 text-white">Crítico</Badge>;
      case 'high':
        return <Badge className="bg-orange-600 text-white">Alto</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-600 text-white">Médio</Badge>;
      case 'low':
        return <Badge className="bg-blue-600 text-white">Baixo</Badge>;
      default:
        return null;
    }
  };

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const critical = results.filter(r => r.severity === 'critical').length;

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate('/configuracoes')}
            variant="outline"
            size="icon"
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Shield className="w-8 h-8" />
              Testes de Segurança (Pentest)
            </h1>
            <p className="text-slate-600 mt-2">
              Execute testes automatizados para verificar vulnerabilidades de segurança
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {hasRun && results.length > 0 && (
            <Button
              onClick={() => downloadSecurityReport(results)}
              variant="outline"
              size="lg"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar Relatório TXT
            </Button>
          )}
          <Button
            onClick={handleRunTests}
            disabled={isRunning}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Executando testes...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Executar Testes
              </>
            )}
          </Button>
        </div>
      </div>

      {hasRun && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{passed}</div>
                  <div className="text-sm text-slate-600 mt-1">Passaram</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">{warnings}</div>
                  <div className="text-sm text-slate-600 mt-1">Avisos</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{failed}</div>
                  <div className="text-sm text-slate-600 mt-1">Falhas</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-800">{critical}</div>
                  <div className="text-sm text-slate-600 mt-1">Críticos</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Score de Segurança */}
          <Card>
            <CardHeader>
              <CardTitle>Score de Segurança</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
                      style={{ width: `${Math.round((passed / results.length) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  {Math.round((passed / results.length) * 100)}%
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                {passed === results.length && "🎉 Excelente! Todos os testes passaram."}
                {critical > 0 && "⚠️ Atenção: Vulnerabilidades críticas detectadas!"}
                {failed > 0 && critical === 0 && "⚠️ Algumas falhas foram detectadas."}
                {warnings > 0 && failed === 0 && "✅ Bom! Apenas alguns avisos."}
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {results.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Resultados Detalhados</h2>
          
          {/* Falhas Críticas */}
          {critical > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-red-800 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Vulnerabilidades Críticas ({critical})
              </h3>
              <div className="space-y-3">
                {results.filter(r => r.severity === 'critical').map((result, index) => (
                  <Card key={index} className="border-l-4 border-l-red-600 bg-red-50/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(result.status)}
                          <CardTitle className="text-lg">{result.name}</CardTitle>
                        </div>
                        <div className="flex gap-2">
                          {getSeverityBadge(result.severity)}
                          {getStatusBadge(result.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-slate-700 mb-3">
                        {result.message}
                      </CardDescription>
                      {result.recommendations && result.recommendations.length > 0 && (
                        <div className="mt-3 p-3 bg-white rounded-md border border-red-200">
                          <p className="font-semibold text-sm mb-2">Recomendações:</p>
                          <ul className="text-sm space-y-1">
                            {result.recommendations.map((rec, i) => (
                              <li key={i} className="flex gap-2">
                                <span>•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {result.details && (
                        <div className="mt-3 p-3 bg-white rounded-md">
                          <p className="font-semibold text-sm mb-2">Detalhes:</p>
                          <pre className="text-xs text-slate-600 overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Falhas */}
          {failed > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-red-600 mb-3">Testes que Falharam ({failed})</h3>
              <div className="space-y-3">
                {results.filter(r => r.status === 'fail' && r.severity !== 'critical').map((result, index) => (
                  <Card key={index} className="border-l-4 border-l-red-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(result.status)}
                          <CardTitle className="text-lg">{result.name}</CardTitle>
                        </div>
                        <div className="flex gap-2">
                          {getSeverityBadge(result.severity)}
                          {getStatusBadge(result.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-slate-700 mb-3">
                        {result.message}
                      </CardDescription>
                      {result.recommendations && result.recommendations.length > 0 && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-md">
                          <p className="font-semibold text-sm mb-2">Recomendações:</p>
                          <ul className="text-sm space-y-1">
                            {result.recommendations.map((rec, i) => (
                              <li key={i} className="flex gap-2">
                                <span>•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {result.details && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-md">
                          <pre className="text-xs text-slate-600 overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Avisos */}
          {warnings > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-yellow-600 mb-3">Avisos ({warnings})</h3>
              <div className="space-y-3">
                {results.filter(r => r.status === 'warning').map((result, index) => (
                  <Card key={index} className="border-l-4 border-l-yellow-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(result.status)}
                          <CardTitle className="text-lg">{result.name}</CardTitle>
                        </div>
                        <div className="flex gap-2">
                          {getSeverityBadge(result.severity)}
                          {getStatusBadge(result.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-slate-700">
                        {result.message}
                      </CardDescription>
                      {result.recommendations && result.recommendations.length > 0 && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-md">
                          <p className="font-semibold text-sm mb-2">Recomendações:</p>
                          <ul className="text-sm space-y-1">
                            {result.recommendations.map((rec, i) => (
                              <li key={i} className="flex gap-2">
                                <span>•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Testes Passados (colapsado) */}
          {passed > 0 && (
            <details className="group">
              <summary className="text-xl font-semibold text-green-600 mb-3 cursor-pointer list-none flex items-center gap-2">
                <span className="transform group-open:rotate-90 transition-transform">▶</span>
                Testes que Passaram ({passed})
              </summary>
              <div className="space-y-3 mt-3">
                {results.filter(r => r.status === 'pass').map((result, index) => (
                  <Card key={index} className="border-l-4 border-l-green-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(result.status)}
                          <CardTitle className="text-lg">{result.name}</CardTitle>
                        </div>
                        {getStatusBadge(result.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-slate-700">
                        {result.message}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {!hasRun && !isRunning && (
        <Card>
          <CardHeader>
            <CardTitle>Testes Disponíveis</CardTitle>
            <CardDescription>
              Os seguintes testes serão executados:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">🔐 Autenticação e Autorização</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm">
                  <li>Autenticação (validação de tokens JWT)</li>
                  <li>Força da autenticação (expiração de tokens)</li>
                  <li>Autorização (acesso a rotas protegidas)</li>
                  <li>Gerenciamento de sessões</li>
                  <li>Segurança de tokens</li>
                  <li>Políticas de senha</li>
                  <li>Força de senhas</li>
                  <li>Controle de acesso baseado em roles (RBAC)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">🛡️ Proteção de Dados</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm">
                  <li>Exposição de secrets (chaves API, tokens)</li>
                  <li>LocalStorage security</li>
                  <li>SessionStorage security</li>
                  <li>Dados sensíveis no DOM</li>
                  <li>Segurança do banco de dados (RLS)</li>
                  <li>Vazamentos no console</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">💉 Injeção e XSS</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm">
                  <li>Proteção XSS básica</li>
                  <li>Vulnerabilidades XSS avançadas</li>
                  <li>SQL Injection</li>
                  <li>Validação de inputs</li>
                  <li>Sanitização de HTML</li>
                  <li>XSS baseado em DOM</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">🌐 Configuração de Rede</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm">
                  <li>HTTPS/SSL</li>
                  <li>Security Headers (CSP, X-Frame-Options)</li>
                  <li>CORS Configuration</li>
                  <li>Cookie Security</li>
                  <li>CSRF Protection</li>
                  <li>Clickjacking Protection</li>
                  <li>Subresource Integrity (SRI)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">🔒 Controle de Acesso</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm">
                  <li>Rate Limiting</li>
                  <li>Segurança de endpoints API</li>
                  <li>Proteção de rotas</li>
                  <li>Acesso não autorizado</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">🐛 Vulnerabilidades de Código</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm">
                  <li>Vulnerabilidades de dependências</li>
                  <li>Tratamento de erros</li>
                  <li>Segurança de upload de arquivos</li>
                  <li>Prototype Pollution</li>
                  <li>Open Redirects</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">⚙️ Configuração do Ambiente</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm">
                  <li>Configuração do ambiente</li>
                  <li>Modo debug</li>
                  <li>Source maps</li>
                  <li>Arquivos de backup</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}

