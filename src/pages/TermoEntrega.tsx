import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Download, Printer } from "lucide-react";
import { toast } from "sonner";

export default function TermoEntrega() {
  const [formData, setFormData] = useState({
    colaborador: "",
    matricula: "",
    departamento: "",
    equipamento: "",
    patrimonio: "",
    observacoes: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleGenerate = () => {
    if (!formData.colaborador || !formData.equipamento) {
      toast.error("Preencha pelo menos o nome do colaborador e equipamento");
      return;
    }
    toast.info("Funcionalidade de geração em desenvolvimento");
  };

  const handleClear = () => {
    setFormData({
      colaborador: "",
      matricula: "",
      departamento: "",
      equipamento: "",
      patrimonio: "",
      observacoes: "",
    });
    toast.success("Formulário limpo");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Termo de Entrega</h1>
        <p className="text-muted-foreground">
          Geração de documentos de entrega de equipamentos
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Termo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="colaborador">Nome do Colaborador *</Label>
              <Input
                id="colaborador"
                value={formData.colaborador}
                onChange={handleInputChange}
                placeholder="Ex: João Silva"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula</Label>
                <Input
                  id="matricula"
                  value={formData.matricula}
                  onChange={handleInputChange}
                  placeholder="Ex: 12345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="departamento">Departamento</Label>
                <Input
                  id="departamento"
                  value={formData.departamento}
                  onChange={handleInputChange}
                  placeholder="Ex: TI"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipamento">Equipamento *</Label>
              <Input
                id="equipamento"
                value={formData.equipamento}
                onChange={handleInputChange}
                placeholder="Ex: Notebook Dell Latitude 5420"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="patrimonio">Número de Patrimônio</Label>
              <Input
                id="patrimonio"
                value={formData.patrimonio}
                onChange={handleInputChange}
                placeholder="Ex: PAT-2024-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={handleInputChange}
                placeholder="Informações adicionais sobre o equipamento..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4">
              <Button onClick={handleGenerate} className="gap-2">
                <FileText className="w-4 h-4" />
                Gerar
              </Button>
              <Button variant="outline" className="gap-2" disabled>
                <Download className="w-4 h-4" />
                PDF
              </Button>
              <Button variant="outline" onClick={handleClear}>
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pré-visualização</CardTitle>
              <Button variant="ghost" size="sm" disabled>
                <Printer className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-white border border-slate-200 rounded-lg p-8 min-h-[600px] shadow-sm">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-slate-900">TERMO DE ENTREGA DE EQUIPAMENTO</h2>
                <p className="text-sm text-slate-600 mt-2">BR Marinas - TI</p>
              </div>

              <div className="space-y-4 text-sm text-slate-800">
                <p>
                  Eu, <strong>{formData.colaborador || "_______________"}</strong>, matrícula{" "}
                  <strong>{formData.matricula || "_______________"}</strong>, do departamento de{" "}
                  <strong>{formData.departamento || "_______________"}</strong>, declaro ter
                  recebido o seguinte equipamento:
                </p>

                <div className="my-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="font-semibold mb-2">Equipamento:</p>
                  <p>{formData.equipamento || "_______________"}</p>
                  <p className="font-semibold mt-3 mb-2">Nº Patrimônio:</p>
                  <p>{formData.patrimonio || "_______________"}</p>
                </div>

                {formData.observacoes && (
                  <div className="my-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold mb-2 text-blue-900">Observações:</p>
                    <p className="text-slate-700">{formData.observacoes}</p>
                  </div>
                )}

                <p className="mt-8">
                  Comprometo-me a zelar pela conservação do equipamento e devolvê-lo quando
                  solicitado ou ao término do vínculo empregatício.
                </p>

                <div className="mt-12 pt-8 border-t border-slate-300">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="text-center">
                      <div className="border-t border-slate-400 pt-2">
                        <p className="text-xs">Assinatura do Colaborador</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="border-t border-slate-400 pt-2">
                        <p className="text-xs">Assinatura do Responsável TI</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-xs text-slate-500 mt-6">
                    Data: {new Date().toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
