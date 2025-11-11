import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Mail, Download, Trash2, Copy, ArrowLeft, Check, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Assinaturas() {
  const [layout, setLayout] = useState("default");
  const [nome, setNome] = useState("");
  const [setor, setSetor] = useState("");
  const [local, setLocal] = useState("");
  const [telefone, setTelefone] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const assinaturaRef = useRef(null);

  const handleLimpar = () => {
    setNome("");
    setSetor("");
    setLocal("");
    setTelefone("");
    setCelular("");
    setEmail("");
  };

  const handleCopiar = () => {
    if (!assinaturaRef.current) return;

    const range = document.createRange();
    range.selectNodeContents(assinaturaRef.current);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    try {
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erro ao copiar:", err);
    }
    
    selection.removeAllRanges();
  };

  const handleBaixar = () => {
    alert("Para salvar como imagem, use Print Screen ou a ferramenta de captura de tela do seu sistema operacional.");
  };

  const AssinaturaPreview = () => {
    const logoUrl = layout === "default" 
      ? "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904b41406c91fbe9801f18e/ccfa2b4aa_logo_br.png"
      : "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904b41406c91fbe9801f18e/03feda651_logo_jl.png";

    const whatsappIcon = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904b41406c91fbe9801f18e/3ee888717_logo_whatsapp.png";
    const telefoneIcon = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904b41406c91fbe9801f18e/5714ec70c_logotelefone.png";
    const emailIcon = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904b41406c91fbe9801f18e/39a92a30a_email_logo.png";

    return (
      <div ref={assinaturaRef} style={{ fontFamily: "Arial, sans-serif", fontSize: "13px", color: "#212529" }}>
        <table cellPadding={0} cellSpacing={0} border={0} style={{ maxWidth: "500px" }}>
          <tbody>
            <tr>
              <td style={{ paddingBottom: "10px" }}>
                <img src={logoUrl} alt="BR Marinas" style={{ height: "50px", display: "block" }} />
              </td>
            </tr>
            <tr>
              <td style={{ borderTop: "2px solid #1e40af", paddingTop: "10px" }}>
                <table cellPadding={0} cellSpacing={0} border={0}>
                  <tbody>
                    <tr>
                      <td>
                        <div style={{ fontWeight: "bold", fontSize: "15px", color: "#1e40af", marginBottom: "4px" }}>
                          {nome || "Seu Nome"}
                        </div>
                        <div style={{ color: "#666", marginBottom: "2px" }}>
                          {setor || "Seu Cargo"}
                        </div>
                        {local && (
                          <div style={{ color: "#666", marginBottom: "8px", fontSize: "12px" }}>
                            {local}
                          </div>
                        )}
                        <div style={{ marginTop: "8px" }}>
                          {telefone && (
                            <div style={{ marginBottom: "3px", display: "flex", alignItems: "center", gap: "6px" }}>
                              <img src={telefoneIcon} alt="Tel" style={{ width: "14px", height: "14px" }} />
                              <span>{telefone}</span>
                            </div>
                          )}
                          {celular && (
                            <div style={{ marginBottom: "3px", display: "flex", alignItems: "center", gap: "6px" }}>
                              <img src={whatsappIcon} alt="WhatsApp" style={{ width: "14px", height: "14px" }} />
                              <span>{celular}</span>
                            </div>
                          )}
                          {email && (
                            <div style={{ marginBottom: "3px", display: "flex", alignItems: "center", gap: "6px" }}>
                              <img src={emailIcon} alt="Email" style={{ width: "14px", height: "14px" }} />
                              <a href={`mailto:${email}`} style={{ color: "#1e40af", textDecoration: "none" }}>
                                {email}
                              </a>
                            </div>
                          )}
                        </div>
                        <div style={{ marginTop: "10px", fontSize: "11px", color: "#999" }}>
                          <a href="https://www.brmarinas.com.br" style={{ color: "#1e40af", textDecoration: "none" }}>
                            www.brmarinas.com.br
                          </a>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
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
            <p className="text-slate-600">Crie assinaturas profissionais para email</p>
          </div>
        </div>

        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Clique em "Selecionar Assinatura" para selecionar o HTML e depois copie com Ctrl+C (Cmd+C no Mac).
          </AlertDescription>
        </Alert>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div>
            <Card>
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
                    required
                  />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 gap-3 pt-4 border-t">
                  <Button
                    onClick={handleCopiar}
                    disabled={!nome || !email}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Selecionado! Use Ctrl+C
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Selecionar Assinatura
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleBaixar}
                    disabled={!nome || !email}
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Instruções para Salvar
                  </Button>
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
                <div className="flex items-center justify-between">
                  <CardTitle>Pré-visualização</CardTitle>
                  <Badge className="bg-indigo-100 text-indigo-700">Preview</Badge>
                </div>
              </CardHeader>
              <CardContent className="bg-white p-8 rounded-lg">
                <AssinaturaPreview />
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm">Como usar</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 space-y-2">
                <p>1. Preencha todos os campos obrigatórios (*)</p>
                <p>2. Clique em "Selecionar Assinatura" para selecionar</p>
                <p>3. Pressione Ctrl+C (ou Cmd+C no Mac) para copiar</p>
                <p>4. Cole nas configurações de assinatura do seu email</p>
                <p className="text-xs text-slate-500 pt-2">
                  Para Outlook: Arquivo → Opções → Email → Assinaturas
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}