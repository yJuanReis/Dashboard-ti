import React, { useState, useRef, useEffect } from "react";
import Cropper from "cropperjs";
import html2canvas from "html2canvas";
import "cropperjs/dist/cropper.css"; // Importar o CSS do Cropper

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, Trash2, ArrowLeft, AlertCircle, Edit, ZoomIn, ZoomOut } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export default function Crachas() {
  const [layout, setLayout] = useState("padrao");
  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const crachaPreviewRef = useRef<HTMLDivElement>(null);
  const cropperRef = useRef<Cropper | null>(null);

  // URLs dos layouts
  const layouts = {
    padrao: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904b41406c91fbe9801f18e/92ba092c5_layout_geral.png",
    jl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904b41406c91fbe9801f18e/ecd5f8f67_layout_jl.png",
    brigadista: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904b41406c91fbe9801f18e/e879b5db2_layout_brigadista.png",
  };
  const getLayoutImage = () => layouts[layout] || layouts.padrao;

  // Efeito para inicializar e destruir o Cropper.js
  useEffect(() => {
    // Só inicializa se o diálogo estiver aberto, houver imagem E a imagem estiver carregada
    if (!showCropDialog || !originalImage || !imageLoaded) {
      // Limpa o cropper quando o modal fecha
      if (!showCropDialog && cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
      return;
    }

    // Aguarda um pouco para garantir que o DOM está pronto
    const timeoutId = setTimeout(() => {
      if (!imageRef.current) {
        console.log("Elemento de imagem não encontrado");
        return;
      }

      // Destrói instância anterior se existir
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }

      try {
        const isBrigadista = layout === "brigadista";
        console.log("Inicializando cropper...", { isBrigadista, layout });
        
        const cropper = new Cropper(imageRef.current, {
          aspectRatio: isBrigadista ? 1 / 1 : 3 / 4,
          viewMode: 1,
          dragMode: 'move',
          autoCropArea: 1,
          responsive: true,
          restore: false,
          guides: true,
          center: true,
          highlight: true,
          cropBoxMovable: false,
          cropBoxResizable: false,
          toggleDragModeOnDblclick: false,
          minCropBoxWidth: 100,
          minCropBoxHeight: 100,
          ready() {
            console.log("✅ Cropper pronto e funcionando!");
          },
        });
        
        cropperRef.current = cropper;
        console.log("Cropper inicializado com sucesso");
      } catch (error) {
        console.error("❌ Erro ao inicializar o cropper:", error);
      }
    }, 200);

    // Função de limpeza do useEffect
    return () => {
      clearTimeout(timeoutId);
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
    };
  }, [showCropDialog, originalImage, imageLoaded, layout]);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageLoaded(false); // Reset do estado de carregamento
        setOriginalImage(reader.result as string);
        setShowCropDialog(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropConfirm = () => {
    if (!cropperRef.current) {
      toast({
        title: "Erro",
        description: "O editor de imagem não está pronto. Tente novamente.",
        variant: "destructive",
      });
      return;
    }

    try {
      const canvas = cropperRef.current.getCroppedCanvas({
        width: 300,
        height: layout === "brigadista" ? 300 : 400,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
      });

      if (canvas) {
        setCroppedImage(canvas.toDataURL("image/png"));
        setShowCropDialog(false);
        setImageLoaded(false); // Reset do estado
        toast({
          title: "Sucesso!",
          description: "Foto ajustada com sucesso.",
        });
      }
    } catch (error) {
      console.error("Erro ao processar a imagem:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar a imagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleLimpar = () => {
    setNome("");
    setMatricula("");
    setOriginalImage(null);
    setCroppedImage(null);
    setImageLoaded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleBaixar = () => {
    if (!nome.trim() || !matricula.trim() || !croppedImage) {
      toast({
        title: "Campos em falta",
        description: "Preencha nome, matrícula e adicione uma foto para baixar.",
        variant: "destructive",
      });
      return;
    }

    if (crachaPreviewRef.current) {
      html2canvas(crachaPreviewRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
      })
        .then((canvas) => {
          const link = document.createElement("a");
          link.download = `cracha_${nome.replace(/\s+/g, "_").toLowerCase()}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
          toast({
            title: "Sucesso!",
            description: "O seu crachá foi gerado e o download iniciado.",
          });
        })
        .catch((err) => {
          console.error("Erro no html2canvas:", err);
          toast({
            title: "Erro na Geração",
            description: "Ocorreu um problema ao gerar a imagem do crachá.",
            variant: "destructive",
          });
        });
    }
  };

  const handleOpenAjustar = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!originalImage) {
      toast({
        title: "Aviso",
        description: "Nenhuma foto foi carregada ainda.",
        variant: "destructive",
      });
      return;
    }
    
    setImageLoaded(false); // Reset para recarregar a imagem
    setShowCropDialog(true);
  };

  const isBrigadista = layout === "brigadista";

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
          </div>
        </div>

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
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center transition-all">
                    {croppedImage ? (
                      <div className="space-y-3">
                        <img
                          src={croppedImage}
                          alt="Preview"
                          className={cn(
                            "w-32 h-40 mx-auto object-cover bg-slate-200",
                            isBrigadista && "w-32 h-32 rounded-full"
                          )}
                        />
                        <div className="flex gap-2 justify-center">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleOpenAjustar}
                            disabled={!originalImage}
                          >
                            <Edit className="w-3 h-3 mr-2" />
                            Ajustar Foto
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="w-3 h-3 mr-2" />
                            Trocar Foto
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="space-y-3 cursor-pointer hover:opacity-70 transition-opacity"
                      >
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
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="matricula">Matrícula</Label>
                    <Input
                      id="matricula"
                      value={matricula}
                      onChange={(e) => setMatricula(e.target.value)}
                      placeholder="Ex: 12345"
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <Button
                    onClick={handleBaixar}
                    disabled={!nome || !matricula || !croppedImage}
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
                <div className="flex items-center justify-center">
                <Badge className="bg-[rgb(243_232_255)] text-[rgb(126_34_206)] text-md selection:bg-[rgb(168_85_247)] selection:text-[rgb(255_255_255)]">
                  Preview
                </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-center p-8">
                {/* Esta estrutura recria o cracha.html e cracha-generator.css
                  usando Tailwind e classes dinâmicas para o posicionamento.
                */}
                <div
                  ref={crachaPreviewRef}
                  className="relative w-full max-w-[380px] mx-auto grid place-items-center"
                >
                  {/* Layout Background (oculta/mostra baseado no layout) */}
                  <img
                    src={layouts.padrao}
                    className={cn("w-full h-auto grid-row-1 grid-col-1", layout !== 'padrao' && 'hidden')}
                    crossOrigin="anonymous"
                    alt="Layout Padrão"
                  />
                  <img
                    src={layouts.jl}
                    className={cn("w-full h-auto grid-row-1 grid-col-1", layout !== 'jl' && 'hidden')}
                    crossOrigin="anonymous"
                    alt="Layout JL"
                  />
                  <img
                    src={layouts.brigadista}
                    className={cn("w-full h-auto grid-row-1 grid-col-1", layout !== 'brigadista' && 'hidden')}
                    crossOrigin="anonymous"
                    alt="Layout Brigadista"
                  />

                  {/* Foto (posicionamento dinâmico) */}
                  {croppedImage && (
                    <img
                      src={croppedImage}
                      alt="Foto"
                      className={cn(
                        "absolute left-1/2 -translate-x-1/2 object-cover z-[2] grid-row-1 grid-col-1",
                        // Estilos Padrão/JL:
                        !isBrigadista && "w-[45%] h-[40%] top-[32%]",
                        // Estilos Brigadista (redondo perfeito):
                        isBrigadista && "w-[50%] aspect-[1/1] top-[20%] rounded-full"
                      )}
                      crossOrigin="anonymous"
                    />
                  )}

                  {/* Nome (posicionamento dinâmico) */}
                  <div
                    className={cn(
                      "absolute left-1/2 -translate-x-1/2 w-full text-center z-[3] grid-row-1 grid-col-1 font-bold",
                      "text-[clamp(12px,3.5vw,20px)]", // Texto responsivo
                      // Estilos Padrão/JL:
                      "text-white top-[75%]",
                      // Estilos Brigadista (sobrescreve):
                      isBrigadista && "text-black top-[60%]"
                    )}
                    style={{ textShadow: !isBrigadista ? '1px 1px 3px rgba(0, 0, 0, 0.8)' : 'none' }}
                  >
                    {nome.toUpperCase() || "NOME COMPLETO"}
                  </div>

                  {/* Matrícula (posicionamento dinâmico) */}
                  <div
                    className={cn(
                      "absolute left-1/2 -translate-x-1/2 w-full text-center z-[3] grid-row-1 grid-col-1 font-medium",
                      "text-[clamp(11px,3vw,18px)]", // Texto responsivo
                      // Estilos Padrão/JL:
                      "text-white top-[85%]",
                      // Estilos Brigadista (sobrescreve):
                      isBrigadista && "text-black top-[70%]"
                    )}
                    style={{ textShadow: !isBrigadista ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none' }}
                  >
                    {matricula ? matricula : "MATRÍCULA"}
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
              <DialogDescription>
                Posicione e ajuste o zoom da foto para o crachá. Use os botões de zoom ou arraste a imagem para posicioná-la.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="h-80 w-full bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden flex items-center justify-center">
                {!imageLoaded && (
                  <div className="absolute z-10 text-sm text-gray-500">
                    Carregando imagem...
                  </div>
                )}
                <img
                  ref={imageRef}
                  src={originalImage || ""}
                  alt="Recortar"
                  style={{ display: imageLoaded ? 'block' : 'none', maxWidth: '100%' }}
                  onLoad={() => {
                    console.log("📸 Imagem carregada!");
                    setImageLoaded(true);
                  }}
                  onError={(e) => {
                    console.error("❌ Erro ao carregar imagem:", e);
                  }}
                />
              </div>
              <div className="flex items-center justify-center gap-3 mt-4">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => {
                    if (cropperRef.current) {
                      cropperRef.current.zoom(-0.1);
                      console.log("🔍 Zoom out");
                    } else {
                      console.log("⚠️ Cropper não está pronto");
                    }
                  }}
                  title="Diminuir zoom"
                  disabled={!imageLoaded}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => {
                    if (cropperRef.current) {
                      cropperRef.current.zoom(0.1);
                      console.log("🔍 Zoom in");
                    } else {
                      console.log("⚠️ Cropper não está pronto");
                    }
                  }}
                  title="Aumentar zoom"
                  disabled={!imageLoaded}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button 
                onClick={handleCropConfirm} 
                className="bg-purple-600 hover:bg-purple-700"
                disabled={!imageLoaded}
              >
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}