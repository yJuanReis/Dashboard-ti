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

  // Mapeamento de categorias
  const categoryMap: { [key: string]: { name: string; icon: string; tests: string[] } } = {
    auth: {
      name: 'Autenticação e Autorização',
      icon: '🔐',
      tests: ['Autenticação', 'Força da Autenticação', 'Autorização', 'Session Management', 'Segurança de Tokens', 'Políticas de Senha', 'Password Strength', 'Controle de Acesso (RBAC)']
    },
    data: {
      name: 'Proteção de Dados',
      icon: '🛡️',
      tests: ['Exposição de Secrets', 'LocalStorage Security', 'SessionStorage Security', 'Sensitive Data Exposure', 'Dados Sensíveis no DOM', 'Segurança do Banco de Dados', 'Vazamentos no Console']
    },
    injection: {
      name: 'Injeção e XSS',
      icon: '💉',
      tests: ['Proteção XSS', 'Vulnerabilidades XSS Avançadas', 'SQL Injection', 'Validação de Inputs', 'Sanitização de HTML', 'XSS Baseado em DOM']
    },
    network: {
      name: 'Configuração de Rede',
      icon: '🌐',
      tests: ['HTTPS/SSL', 'Security Headers', 'CORS Configuration', 'Cookie Security', 'CSRF Protection', 'Clickjacking Protection', 'Subresource Integrity (SRI)']
    },
    access: {
      name: 'Controle de Acesso',
      icon: '🔒',
      tests: ['Rate Limiting', 'Segurança de Endpoints API', 'Proteção de Rotas', 'Acesso Não Autorizado']
    },
    code: {
      name: 'Vulnerabilidades de Código',
      icon: '🐛',
      tests: ['Dependency Vulnerabilities', 'Error Handling', 'File Upload Security', 'Prototype Pollution', 'Open Redirects']
    },
    env: {
      name: 'Configuração do Ambiente',
      icon: '⚙️',
      tests: ['Configuração do Ambiente', 'Modo Debug', 'Source Maps', 'Arquivos de Backup']
    }
  };

  // Agrupar resultados por categoria
  const groupedResults = Object.keys(categoryMap).map(categoryKey => {
    const category = categoryMap[categoryKey];
    const categoryTests = results.filter(r => category.tests.includes(r.name));
    return {
      key: categoryKey,
      ...category,
      tests: categoryTests,
      passed: categoryTests.filter(t => t.status === 'pass').length,
      failed: categoryTests.filter(t => t.status === 'fail').length,
      warnings: categoryTests.filter(t => t.status === 'warning').length,
      critical: categoryTests.filter(t => t.severity === 'critical').length,
    };
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto p-3 md:p-4 lg:p-6 space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4">
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            onClick={() => navigate('/configuracoes')}
            variant="outline"
            size="icon"
            className="shrink-0 h-8 w-8 md:h-10 md:w-10"
          >
            <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Shield className="hidden sm:inline-block w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8" />
              <span className="hidden sm:inline">Testes de Segurança (Pentest)</span>
              <span className="sm:hidden">Pentest</span>
            </h1>

          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full sm:w-auto">
          {hasRun && results.length > 0 && (
            <Button
              onClick={() => downloadSecurityReport(results)}
              variant="outline"
              size="lg"
              className="border-green-600 text-white hover:bg-green-600"
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-xl md:text-2xl lg:text-3xl font-bold text-green-600">{passed}</div>
                    <div className="text-sm  mt-1">Passaram</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">{warnings}</div>
                    <div className="text-sm  mt-1">Avisos</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">{failed}</div>
                    <div className="text-sm mt-1">Falhas</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-800">{critical}</div>
                    <div className="text-sm  mt-1">Críticos</div>
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
                <p className="text-sm text-white mt-2">
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
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Resultados por Categoria</h2>
            
            {/* Grid de 3 colunas com categorias */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
              {groupedResults.map((category) => {
                const hasIssues = category.failed > 0 || category.warnings > 0;
                const hasCritical = category.critical > 0;
                
                return (
                  <Card key={category.key} className={hasCritical ? "border-l-4 border-l-red-600 bg-red-50/50" : hasIssues ? "border-l-4 border-l-yellow-500" : "border-l-4 border-l-green-500"}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <span>{category.icon}</span>
                          {category.name}
                        </CardTitle>
                        <div className="flex gap-1 text-xs">
                          {category.passed > 0 && <Badge className="bg-green-100 text-green-800">{category.passed}</Badge>}
                          {category.warnings > 0 && <Badge className="bg-yellow-100 text-yellow-800">{category.warnings}</Badge>}
                          {category.failed > 0 && <Badge className="bg-red-100 text-red-800">{category.failed}</Badge>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Testes Críticos */}
                      {category.critical > 0 && (
                        <div>
                          <h4 className="font-semibold text-red-800 text-sm mb-2">⚠️ Críticos ({category.critical})</h4>
                          <div className="space-y-2">
                            {category.tests.filter(t => t.severity === 'critical').map((result, idx) => (
                              <div key={idx} className="p-2 bg-red-100 rounded text-sm">
                                <div className="font-medium text-red-900">{result.name}</div>
                                <div className="text-xs text-red-700 mt-1">{result.message}</div>
                                {result.recommendations && result.recommendations.length > 0 && (
                                  <div className="mt-2 text-xs">
                                    <strong>Correções:</strong>
                                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                                      {result.recommendations.map((rec, i) => (
                                        <li key={i}>{rec}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Falhas */}
                      {category.failed > 0 && (
                        <div>
                          <h4 className="font-semibold text-red-600 text-sm mb-2">❌ Falhas ({category.failed})</h4>
                          <div className="space-y-2">
                            {category.tests.filter(t => t.status === 'fail' && t.severity !== 'critical').map((result, idx) => (
                              <div key={idx} className="p-2 bg-red-50 rounded text-sm">
                                <div className="font-medium text-red-900">{result.name}</div>
                                <div className="text-xs text-red-700 mt-1">{result.message}</div>
                                {result.recommendations && result.recommendations.length > 0 && (
                                  <div className="mt-2 text-xs">
                                    <strong>Correções:</strong>
                                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                                      {result.recommendations.map((rec, i) => (
                                        <li key={i}>{rec}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Avisos */}
                      {category.warnings > 0 && (
                        <div>
                          <h4 className="font-semibold text-yellow-600 text-sm mb-2">⚠️ Avisos ({category.warnings})</h4>
                          <div className="space-y-2">
                            {category.tests.filter(t => t.status === 'warning').map((result, idx) => (
                              <div key={idx} className="p-2 bg-yellow-50 rounded text-sm">
                                <div className="font-medium text-yellow-900">{result.name}</div>
                                <div className="text-xs text-yellow-700 mt-1">{result.message}</div>
                                {result.recommendations && result.recommendations.length > 0 && (
                                  <div className="mt-2 text-xs">
                                    <strong>Melhorias:</strong>
                                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                                      {result.recommendations.map((rec, i) => (
                                        <li key={i}>{rec}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Testes Passados */}
                      {category.passed > 0 && (
                        <details className="group">
                          <summary className="font-semibold text-green-600 text-sm cursor-pointer list-none flex items-center gap-1">
                            <span className="transform group-open:rotate-90 transition-transform">▶</span>
                            ✅ Passaram ({category.passed})
                          </summary>
                          <div className="mt-2 space-y-1">
                            {category.tests.filter(t => t.status === 'pass').map((result, idx) => (
                              <div key={idx} className="p-2 bg-green-50 rounded text-xs">
                                <div className="font-medium text-green-900">{result.name}</div>
                                <div className="text-green-700 mt-0.5">{result.message}</div>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}

                      {category.tests.length === 0 && (
                        <div className="text-sm text-slate-500">Nenhum teste nesta categoria</div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
              <div>
                <h4 className="font-semibold mb-2">🔐 Autenticação e Autorização</h4>
                <ul className="list-disc list-inside space-y-1 text-white text-sm">
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
                <ul className="list-disc list-inside space-y-1 text-white text-sm">
                  <li>Exposição de secrets (chaves API, tokens)</li>
                  <li>LocalStorage security</li>
                  <li>SessionStorage security</li>
                  <li>Exposição de dados sensíveis</li>
                  <li>Dados sensíveis no DOM</li>
                  <li>Segurança do banco de dados (RLS)</li>
                  <li>Vazamentos no console</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">💉 Injeção e XSS</h4>
                <ul className="list-disc list-inside space-y-1 text-white text-sm">
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
                <ul className="list-disc list-inside space-y-1 text-white text-sm">
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
                <ul className="list-disc list-inside space-y-1 text-white text-sm">
                  <li>Rate Limiting</li>
                  <li>Segurança de endpoints API</li>
                  <li>Proteção de rotas</li>
                  <li>Acesso não autorizado</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">🐛 Vulnerabilidades de Código</h4>
                <ul className="list-disc list-inside space-y-1 text-white text-sm">
                  <li>Vulnerabilidades de dependências</li>
                  <li>Tratamento de erros</li>
                  <li>Segurança de upload de arquivos</li>
                  <li>Prototype Pollution</li>
                  <li>Open Redirects</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">⚙️ Configuração do Ambiente</h4>
                <ul className="list-disc list-inside space-y-1 text-white text-sm">
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

