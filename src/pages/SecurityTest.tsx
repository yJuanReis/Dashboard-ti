import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { runSecurityTests, SecurityTestResult } from "@/lib/securityTests";

export default function SecurityTest() {
  const [results, setResults] = useState<SecurityTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);

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

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Testes de Segurança (Pentest)
          </h1>
          <p className="text-slate-600 mt-2">
            Execute testes automatizados para verificar vulnerabilidades de segurança
          </p>
        </div>
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

      {hasRun && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{passed}</div>
                <div className="text-sm text-slate-600 mt-1">Testes Passaram</div>
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
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Resultados Detalhados</h2>
          {results.map((result, index) => (
            <Card key={index} className="border-l-4 border-l-blue-500">
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
                {result.details && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-md">
                    <pre className="text-xs text-slate-600 overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
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
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Exposição de Secrets (chaves API, tokens)</li>
              <li>Proteção XSS (Cross-Site Scripting)</li>
              <li>Autenticação (validação de tokens JWT)</li>
              <li>Autorização (acesso a rotas protegidas)</li>
              <li>Validação de Inputs (sanitização de dados)</li>
              <li>Security Headers (CSP, X-Frame-Options, etc.)</li>
              <li>Rate Limiting (proteção contra brute force)</li>
              <li>LocalStorage Security (dados sensíveis)</li>
            </ul>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}

