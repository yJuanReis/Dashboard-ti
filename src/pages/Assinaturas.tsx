import React, { useState, useRef, forwardRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
// Importações de ícone atualizadas: Copy e Check removidos
import { Mail, Download, Trash2, ArrowLeft, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import html2canvas from "html2canvas";
import { toast } from "sonner";

export default function Assinaturas() {
  const [layout, setLayout] = useState("default");
  const [nome, setNome] = useState("");
  const [setor, setSetor] = useState("");
  const [local, setLocal] = useState("");
  const [telefone, setTelefone] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  // Estado 'copied' removido
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  // 'assinaturaRef' removida, não é mais necessária
  const previewRef = useRef<HTMLDivElement>(null);

  const handleLimpar = () => {
    setNome("");
    setSetor("");
    setLocal("");
    setTelefone("");
    setCelular("");
    setEmail("");
  };

  // Função 'handleCopiar' removida

  const handleBaixar = () => {
    if (!nome.trim() || !email.trim()) {
      toast.error("Preencha Nome e E-mail para baixar.");
      return;
    }

    if (!previewRef.current) {
      toast.error("Erro: Não foi possível encontrar a pré-visualização.");
      return;
    }

    // Define o fundo como branco para o PNG
    const originalBackgroundColor = previewRef.current.style.backgroundColor;
    previewRef.current.style.backgroundColor = '#FFFFFF';

    html2canvas(previewRef.current, {
      scale: 3, // Aumenta a resolução
      useCORS: true, // Permite que o canvas leia as imagens (logos)
      backgroundColor: '#FFFFFF', // Define o fundo do canvas como branco
    })
      .then((canvas) => {
        const link = document.createElement("a");
        link.download = `assinatura_${nome.replace(/\s+/g, "_").toLowerCase()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        toast.success("Download da assinatura iniciado.");

        // Restaura o fundo original (se houver)
        if (previewRef.current) {
          previewRef.current.style.backgroundColor = originalBackgroundColor;
        }
      })
      .catch((err) => {
        console.error("Erro no html2canvas:", err);
        toast.error("Ocorreu um problema ao gerar a imagem.");
        // Restaura o fundo original em caso de erro
        if (previewRef.current) {
          previewRef.current.style.backgroundColor = originalBackgroundColor;
        }
      });
  };

  // Componente de Layout Padrão (Baseado no defaultLayoutHtmlTemplate)
  const LayoutDefault = ({ nome, setor, local, telefone, celular, email, logoUrl, iconTelefone, iconWhatsapp, iconEmail }: any) => (
    <table cellPadding={0} cellSpacing={0} border={0} style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', lineHeight: 1.5, color: '#333', borderCollapse: 'collapse', minHeight: '120px' }}>
      <tbody>
        <tr>
          <td style={{ paddingRight: '12px', borderRight: '1px solid #0055A5', verticalAlign: 'top', width: '110px', textAlign: 'center' }}>
            <img src={logoUrl} alt="Logo BR Marinas" width="100" style={{ display: 'block', margin: '0 auto' }} />
          </td>
          <td style={{ paddingLeft: '12px', verticalAlign: 'top', width: '300px' }}>
            <p style={{ margin: 0, fontWeight: 'bold', color: '#0055A5', fontSize: '14px' }}>
              {nome || "Seu Nome"}
            </p>
            <p style={{ margin: 0 }}>
              {setor || "Seu Cargo"}
            </p>
            <p style={{ margin: 0 }}>
              {local ? `BR Marinas | ${local}` : "BR Marinas"}
            </p>

            {telefone && (
              <p style={{ margin: 0 }}>
                {telefone}
              </p>
            )}

            {celular && (
              <p style={{ margin: 0 }}>
                {celular}
              </p>
            )}

            {email && (
              <p style={{ margin: 0 }}>
                <a href={`mailto:${email}`} style={{ color: '#333', textDecoration: 'none' }}>
                  {email}
                </a>
              </p>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  );

  // Componente de Layout Alternativo (Baseado no altLayoutHtmlTemplate)
  const LayoutAlt = ({ nome, setor, local, telefone, celular, email, logoUrl, iconTelefone, iconWhatsapp, iconEmail }: any) => (
    <table cellPadding={0} cellSpacing={0} border={0} style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', lineHeight: 1.5, color: '#333', borderCollapse: 'collapse', width: '100%' }}>
      <tbody>
        <tr>
          <td style={{ textAlign: 'left', verticalAlign: 'top' }}>
            <p style={{ margin: 0, fontWeight: 'bold', color: '#0055A5', fontSize: '14px' }}>
              {nome || "Seu Nome"}
            </p>
            <p style={{ margin: 0 }}>
              {setor || "Seu Cargo"}
            </p>
            <p style={{ margin: 0 }}>
              {local || "BR Marinas JL"}
            </p>

            {telefone && (
              <p style={{ margin: 0 }}>
                {telefone}
              </p>
            )}

            {celular && (
              <p style={{ margin: 0 }}>
                {celular}
              </p>
            )}

            {email && (
              <p style={{ margin: 0 }}>
                <a href={`mailto:${email}`} style={{ color: '#333', textDecoration: 'none' }}>
                  {email}
                </a>
              </p>
            )}

            <div style={{ marginTop: '8px' }}>
              <img src={logoUrl} alt="Logo BR Marinas JL" width="220" style={{ display: 'block', marginTop: '10px' }} />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );

  // AssinaturaPreview alterado: 'forwardRef' e 'ref' removidos
  const AssinaturaPreview = (props: any) => {
    const { layout, ...rest } = props;

    // Define os URLs dos ícones (como no seu código original)
    const iconWhatsapp = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904b41406c91fbe9801f18e/3ee888717_logo_whatsapp.png";
    const iconTelefone = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904b41406c91fbe9801f18e/5714ec70c_logotelefone.png";
    const iconEmail = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904b41406c91fbe9801f18e/39a92a30a_email_logo.png";

    const logoUrl = layout === "default"
      ? "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904b41406c91fbe9801f18e/ccfa2b4aa_logo_br.png"
      : "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904b41406c91fbe9801f18e/03feda651_logo_jl.png";

    const localFinal = (layout === 'alt' && !rest.local) ? 'BR Marinas Bracuhy' : rest.local;

    return (
      // 'ref' removido do div
      <div style={{ fontFamily: "Arial, sans-serif", fontSize: "13px", color: "#212529" }}>
        {layout === "default" ? (
          <LayoutDefault
            {...rest}
            local={rest.local} // No layout default, o local é opcional e será tratado (Ex: "BR Marinas | Gloria")
            logoUrl={logoUrl}
            iconTelefone={iconTelefone}
            iconWhatsapp={iconWhatsapp}
            iconEmail={iconEmail}
          />
        ) : (
          <LayoutAlt
            {...rest}
            local={localFinal} // No layout alt, se o local estiver vazio, usamos 'BR Marinas Bracuhy'
            logoUrl={logoUrl}
            iconTelefone={iconTelefone}
            iconWhatsapp={iconWhatsapp}
            iconEmail={iconEmail}
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("Home")}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gerador de Assinaturas</h1>
          </div>
        </div>

        {/* Alert sobre Copiar/Colar removido */}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div>
            <Card className="w-[600px] mx-auto">
              <CardHeader>
                <CardTitle>Informações da Assinatura</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Layout Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Layout</Label>
                  <RadioGroup value={layout} onValueChange={setLayout} className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                      <RadioGroupItem value="default" id="default" />
                      <Label htmlFor="default" className="flex-1 cursor-pointer">BR Marinas</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                      <RadioGroupItem value="alt" id="alt" />
                      <Label htmlFor="alt" className="flex-1 cursor-pointer">BR Marinas JL</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Seu Nome"
                      required
                      autoComplete="off"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="setor">Setor/Cargo *</Label>
                    <Input
                      id="setor"
                      value={setor}
                      onChange={(e) => setSetor(e.target.value)}
                      placeholder="Seu Cargo"
                      required
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="local">Local (Marina)</Label>
                  <Input
                    id="local"
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                    placeholder="Ex: Glória, Verolme"
                    autoComplete="off"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone Fixo</Label>
                    <Input
                      id="telefone"
                      type="tel"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="(XX) XXXX-XXXX"
                      autoComplete="off"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="celular">Celular (WhatsApp)</Label>
                    <Input
                      id="celular"
                      type="tel"
                      value={celular}
                      onChange={(e) => setCelular(e.target.value)}
                      placeholder="(XX) XXXXX-XXXX"
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@brmarinas.com.br"
                    autoComplete="off"
                    required
                  />
                </div>

                {/* Action Buttons - MODIFICADO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t">
                  <Button
                    onClick={handleBaixar} // Função de baixar (abre o modal)
                    disabled={!nome || !email}
                    className="bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent/90"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar PNG
                  </Button>
                  
                  {/* Botão de Selecionar Assinatura removido */}
                  {/* Botão de Instruções removido */}

                  <Button variant="outline" onClick={handleLimpar} className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar Campos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-center">
                  <Badge className="bg-indigo-100 text-md text--700">Preview</Badge>
                </div>


              </CardHeader>
              <CardContent className="bg-white p-8 rounded-lg">
                <div ref={previewRef} style={{ width: '330px', height: '120px', display: 'inline-block' }}>
                  <AssinaturaPreview
                    // 'ref' removido
                    layout={layout}
                    nome={nome}
                    setor={setor}
                    local={local}
                    telefone={telefone}
                    celular={celular}
                    email={email}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card "Como usar" removido */}
            
          </div>
        </div>
      </div>

      <Dialog open={showInstructionsModal} onOpenChange={setShowInstructionsModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            {/* Título do Modal atualizado para refletir "Baixar PNG" */}
            <DialogTitle>Como Salvar como Imagem (PNG)</DialogTitle> 
            <DialogDescription>
              Este navegador não suporta o download direto da assinatura como imagem. Por favor, use a ferramenta de captura de tela do seu sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div>
              <h4 className="font-semibold">Windows:</h4>
              <p className="text-sm text-slate-600">Pressione <Badge variant="outline">Windows + Shift + S</Badge> para abrir a Ferramenta de Captura.</p>
            </div>
            <div>
              <h4 className="font-semibold">Mac:</h4>
              <p className="text-sm text-slate-600">Pressione <Badge variant="outline">Cmd + Shift + 4</Badge> para capturar uma seleção.</p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button">Entendido</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}