import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, Trash2, ArrowLeft, AlertCircle, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function Crachas() {
  const [layout, setLayout] = useState("padrao");
  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result);
        setShowCropDialog(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropConfirm = () => {
    setFotoPreview(tempImage);
    setFoto(tempImage);
    setShowCropDialog(false);
  };

  const handleLimpar = () => {
    setNome("");
    setMatricula("");
    setFoto(null);
    setFotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleBaixar = () => {
    // Placeholder for download functionality
    alert("Funcionalidade de download estará disponível em breve!\n\nPor enquanto, você pode fazer screenshot do crachá.");
  };

  const getLayoutImage = () => {
    const layouts = {
      padrao: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904b41406c91fbe9801f18e/92ba092c5_layout_geral.png",
      jl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904b41406c91fbe9801f18e/ecd5f8f67_layout_jl.png",
      brigadista: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904b41406c91fbe9801f18e/e879b5db2_layout_brigadista.png",
    };
    return layouts[layout];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("Home")}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gerador de Crachás</h1>
            <p className="text-slate-600">Crie e personalize crachás para colaboradores</p>
          </div>
        </div>

        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Preencha os campos e faça screenshot do crachá. Funcionalidade de download em desenvolvimento.
          </AlertDescription>
        </Alert>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Crachá</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Layout Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Escolha o Layout</Label>
                  <RadioGroup value={layout} onValueChange={setLayout}>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                      <RadioGroupItem value="padrao" id="padrao" />
                      <Label htmlFor="padrao" className="flex-1 cursor-pointer">Padrão</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                      <RadioGroupItem value="jl" id="jl" />
                      <Label htmlFor="jl" className="flex-1 cursor-pointer">JL Bracuhy</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                      <RadioGroupItem value="brigadista" id="brigadista" />
                      <Label htmlFor="brigadista" className="flex-1 cursor-pointer">Brigadista</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Photo Upload */}
                <div className="space-y-3">
                  <Label htmlFor="foto" className="text-base font-semibold">Foto do Colaborador</Label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-all"
                  >
                    {fotoPreview ? (
                      <div className="relative">
                        <img src={fotoPreview} alt="Preview" className="w-32 h-32 mx-auto rounded-full object-cover" />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="mt-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCropDialog(true);
                            setTempImage(fotoPreview);
                          }}
                        >
                          <Edit className="w-3 h-3 mr-2" />
                          Ajustar Foto
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="w-12 h-12 mx-auto text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">Clique para carregar foto</p>
                          <p className="text-xs text-slate-500">PNG, JPG até 5MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="foto"
                    accept="image/*"
                    onChange={handleFotoChange}
                    className="hidden"
                  />
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: João Silva"
                      className="text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="matricula">Matrícula</Label>
                    <Input
                      id="matricula"
                      value={matricula}
                      onChange={(e) => setMatricula(e.target.value)}
                      placeholder="Ex: 12345"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <Button
                    onClick={handleBaixar}
                    disabled={!nome || !fotoPreview}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar
                  </Button>
                  <Button variant="outline" onClick={handleLimpar}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar
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
                  <Badge className="bg-purple-100 text-purple-700">Preview</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-center p-8">
                <div
                  id="cracha-preview"
                  className="relative bg-white rounded-2xl shadow-2xl overflow-hidden"
                  style={{ width: "280px", height: "420px" }}
                >
                  {/* Layout Background */}
                  <img
                    src={getLayoutImage()}
                    alt="Layout"
                    className="absolute inset-0 w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />

                  {/* Photo Container */}
                  <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-200">
                    {fotoPreview && (
                      <img src={fotoPreview} alt="Foto" className="w-full h-full object-cover" />
                    )}
                  </div>

                  {/* Name */}
                  <div className="absolute bottom-32 left-0 right-0 text-center px-4">
                    <p className="text-xl font-bold text-white drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                      {nome || "Nome do Colaborador"}
                    </p>
                  </div>

                  {/* Matricula */}
                  <div className="absolute bottom-20 left-0 right-0 text-center">
                    <p className="text-sm font-medium text-white drop-shadow-md" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                      {matricula ? `Mat: ${matricula}` : "Matrícula"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Crop Dialog */}
        <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ajustar Foto</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {tempImage && (
                <div className="flex justify-center">
                  <img src={tempImage} alt="Crop" className="max-w-full max-h-96 rounded-lg" />
                </div>
              )}
              <p className="text-sm text-slate-600 mt-4 text-center">
                Clique em confirmar para usar esta imagem no crachá.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCropDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCropConfirm} className="bg-purple-600 hover:bg-purple-700">
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}