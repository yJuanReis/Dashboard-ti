import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { FileText, Download, Eye, RefreshCw, Laptop, Smartphone, Tablet, Monitor, Radio, Cloud, Shield, Zap, ExternalLink, Printer } from "lucide-react";
import { toast } from "sonner";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { useIsMobile } from "@/hooks/use-mobile";
import { logger } from "@/lib/logger";

interface TermoData {
  dia: string;
  mes: string;
  ano: string;
  equipamento: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  valorMercado: string;
  // Campos específicos para celulares
  aparelho?: string;
  numero?: string;
  chip?: string;
  imei?: string;
  acessorio?: string;
  valorAparelho?: string;
  valorChip?: string;
  minutagem?: string;
  dadosMoveis?: string;
  marinas?: string;
}

export default function TesteTermos() {
  const isMobile = useIsMobile();
  // Links para modelos e armazenamento
  const linkModeloPC = "https://docs.google.com/document/d/1yC3RSg9FHkJSCTLUbOd4jBPhqeVwPJh0/edit?usp=drive_link&ouid=117439329535517834842&rtpof=true&sd=true";
  const linkModeloCelular = "https://docs.google.com/document/d/1Bz48DSzVfB0WJUTGmf6Rajpb0Z4R6PUI/edit?usp=drive_link&ouid=117439329535517834842&rtpof=true&sd=true";
  const linkPoliticaSmartphones = "https://docs.google.com/document/d/18Dlsx3-KZBjQsWF8nY7dPB41jK3tCgde/edit";
  const linkPoliticaComputadores = "https://docs.google.com/document/d/1ISN5Umx_iGYlDAz2Ka0Pm8PviAAqU-Ct/edit?usp=drive_web&ouid=117439329535517834842&rtpof=true";
  const linkPoliticaGerais = "https://drive.google.com/drive/u/0/folders/1ReHtAA6wQJYlT0-eogU468BcLXQlQQQB";
  const linkPastaDrive = "https://drive.google.com/drive/u/0/folders/1GrB5v2lmiU09mquWIqadPAk_HFMXYO4i";
  const linkDriveComputador = "https://drive.google.com/drive/u/0/folders/1HLK50DolouzjSy1WwVPF5XVrlZ5fE_s-";
  const linkDriveSmartphone = "https://drive.google.com/drive/u/0/folders/1FDLrIi3ZOY5OFB93zwTatPclhjC-7GxB";
  const linkDriveTablets = "https://drive.google.com/drive/u/0/folders/1LNI4GC_Cu0liczCeJKVri_DBXOwKVtxl";
  const linkDriveBastaoRonda = "https://drive.google.com/drive/u/0/folders/1nKfON7djUeiWWTauHXgktUqn9RpNei5Z";
  const linkDriveMonitores = "https://drive.google.com/drive/u/0/folders/1ph6M-T1R0H_NuLtY37HSL6DbmQ1B34e1";

  const hoje = new Date();
  const [tipoModelo, setTipoModelo] = useState<"computadores" | "celulares" | "em_breve">("computadores");
  
  const [termoData, setTermoData] = useState<TermoData>({
    dia: hoje.getDate().toString(),
    mes: (hoje.getMonth() + 1).toString(),
    ano: hoje.getFullYear().toString(),
    equipamento: "",
    marca: "",
    modelo: "",
    numeroSerie: "",
    valorMercado: "",
    // Campos específicos para celulares
    aparelho: "",
    numero: "",
    chip: "",
    imei: "",
    acessorio: "",
    valorAparelho: "",
    valorChip: "",
    minutagem: "",
    dadosMoveis: "",
    marinas: "",
  });

  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string>("");
  const [pdfVersion, setPdfVersion] = useState<number>(Date.now());
  
  // Estado para rastrear quais campos devem ser preenchidos com "N/A"
  const [camposNA, setCamposNA] = useState<Record<string, boolean>>({});
  
  // Ref para rastrear se é a primeira renderização
  const isFirstRender = useRef(true);
  
  // Refs para calcular posição e largura do glider baseado no texto
  const tab1Ref = useRef<HTMLLabelElement>(null);
  const tab2Ref = useRef<HTMLLabelElement>(null);
  const tab3Ref = useRef<HTMLLabelElement>(null);
  const gliderRef = useRef<HTMLSpanElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  
  // Ref para debounce do preview
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Ref para armazenar a URL anterior do preview (para evitar recriação do useCallback)
  const previewPdfUrlRef = useRef<string>("");
  // Refs para armazenar os dados atuais (para evitar recriação do updatePreview)
  const termoDataRef = useRef<TermoData>(termoData);
  const camposNARef = useRef<Record<string, boolean>>(camposNA);
  
  // Atualizar refs quando os dados mudarem
  useEffect(() => {
    termoDataRef.current = termoData;
  }, [termoData]);
  
  useEffect(() => {
    camposNARef.current = camposNA;
  }, [camposNA]);
  
  // Estado para controlar o hover
  const [hoveredTab, setHoveredTab] = useState<number | null>(null);
  
  // Função para atualizar posição e largura do glider
  const updateGlider = React.useCallback((tabIndex: number) => {
    if (!gliderRef.current || !tabsContainerRef.current) return;
    
    const tabs = [tab1Ref.current, tab2Ref.current, tab3Ref.current];
    const activeTab = tabs[tabIndex];
    
    if (!activeTab) return;
    
    const tabsElement = tabsContainerRef.current.querySelector('.tabs') as HTMLElement;
    if (!tabsElement) return;
    
    const tabsRect = tabsElement.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    
    // Calcular posição relativa ao container .tabs (não ao .tabs-container)
    const left = tabRect.left - tabsRect.left;
    const width = tabRect.width;
    
    gliderRef.current.style.width = `${width}px`;
    gliderRef.current.style.transform = `translateX(${left}px)`;
  }, []);
  
  // Atualizar glider quando o tipo de modelo mudar
  useEffect(() => {
    const tabIndex = tipoModelo === "computadores" ? 0 : tipoModelo === "celulares" ? 1 : 2;
    // Pequeno delay para garantir que o DOM foi renderizado
    const timeoutId = setTimeout(() => updateGlider(tabIndex), 10);
    return () => clearTimeout(timeoutId);
  }, [tipoModelo, updateGlider]);
  
  // Atualizar glider no hover
  useEffect(() => {
    if (hoveredTab !== null) {
      updateGlider(hoveredTab);
    } else {
      const tabIndex = tipoModelo === "computadores" ? 0 : tipoModelo === "celulares" ? 1 : 2;
      updateGlider(tabIndex);
    }
  }, [hoveredTab, tipoModelo, updateGlider]);
  
  // Atualizar glider quando a janela for redimensionada
  useEffect(() => {
    const handleResize = () => {
      if (hoveredTab !== null) {
        updateGlider(hoveredTab);
      } else {
        const tabIndex = tipoModelo === "computadores" ? 0 : tipoModelo === "celulares" ? 1 : 2;
        updateGlider(tabIndex);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [hoveredTab, tipoModelo, updateGlider]);

  // Função para carregar o PDF sempre sem cache
  const loadPdf = (showToast = false, tipo: "computadores" | "celulares" | "em_breve" = tipoModelo) => {
    // Não carregar PDF se for "em_breve"
    if (tipo === "em_breve") {
      return;
    }
    // Limpar URL anterior do preview para forçar recarregamento
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl("");
    }
    
    // Limpar bytes anteriores
    setPdfBytes(null);
    
    // Adiciona timestamp único para forçar recarregamento
    const timestamp = Date.now();
    const random = Math.random();
    const cacheBuster = `?v=${timestamp}&t=${random}&_=${timestamp}`;
    
    // Definir nome do arquivo e pasta baseado no tipo
    const pdfConfig = {
      computadores: {
        fileName: "Termo_de_Responsabilidade_Computadores_e_Periféricos.pdf",
        folder: "COMPUTADORES_E_PERIFERICOS"
      },
      celulares: {
        fileName: "Termo_de_Responsabilidade_Smartphone_e_Tablet.pdf",
        folder: "SMARTPHONE_E_TABLET"
      }
    };
    
    const config = pdfConfig[tipo];
    const pdfFileName = encodeURIComponent(config.fileName);
    const pdfUrl = `/termos/${config.folder}/${pdfFileName}${cacheBuster}`;
    
    logger.log("🔄 Carregando PDF:", pdfUrl);
    logger.log("📅 Timestamp:", timestamp);
    logger.log("📋 Tipo:", tipo);
    
    // Criar uma nova requisição com cache completamente desabilitado
    const controller = new AbortController();
    const signal = controller.signal;
    
    fetch(pdfUrl, {
      method: 'GET',
      cache: 'no-store', // Força sempre buscar do servidor
      signal: signal,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'If-Modified-Since': '0'
      }
    })
      .then((response) => {
        logger.log("✅ Resposta do servidor:", response.status, response.statusText);
        if (!response.ok) {
          throw new Error(`Erro ao carregar PDF: ${response.status}`);
        }
        return response.arrayBuffer();
      })
      .then((arrayBuffer) => {
        const newPdfBytes = new Uint8Array(arrayBuffer);
        logger.log("📄 PDF carregado, tamanho:", newPdfBytes.length, "bytes");
        setPdfBytes(newPdfBytes);
        setPdfVersion(timestamp);
        if (showToast) {
          toast.success("PDF recarregado com sucesso!");
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          logger.error("❌ Erro ao carregar PDF:", error);
          toast.error(`Erro ao carregar o template do termo: ${error.message}`);
        }
      });
  };

  // Carregar o PDF sempre que a página for carregada ou o tipo de modelo mudar (sem cache)
  useEffect(() => {
    loadPdf(false, tipoModelo); // Não mostrar toast no carregamento inicial
  }, [tipoModelo]);

  // Limpar campos quando o tipo de termo mudar (mas não na primeira renderização)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const hoje = new Date();
    setTermoData({
      dia: hoje.getDate().toString(),
      mes: (hoje.getMonth() + 1).toString(),
      ano: hoje.getFullYear().toString(),
      equipamento: "",
      marca: "",
      modelo: "",
      numeroSerie: "",
      valorMercado: "",
      // Campos específicos para celulares
      aparelho: "",
      numero: "",
      chip: "",
      imei: "",
      acessorio: "",
      valorAparelho: "",
      valorChip: "",
      minutagem: "",
      dadosMoveis: "",
      marinas: "",
    });
    setCamposNA({});
  }, [tipoModelo]);

  // Limpar URL do preview quando o componente desmontar
  useEffect(() => {
    return () => {
      if (previewPdfUrlRef.current) {
        URL.revokeObjectURL(previewPdfUrlRef.current);
      }
    };
  }, []);

  // ============================================
  // CONFIGURAÇÃO DE CAMPOS DO PDF
  // ============================================
  // AJUSTE AS COORDENADAS (x e y) DE CADA CAMPO ABAIXO
  // x = posição horizontal (0 = esquerda, aumenta para direita)
  // y = posição vertical (use pageHeight - valor, valor maior = mais para cima)
  // ============================================

  const fillPdfFields = async (pdfDoc: PDFDocument, dadosParaUsar?: TermoData, camposNAParaUsar?: Record<string, boolean>) => {
    const dados = dadosParaUsar || termoData;
    const camposNAUsar = camposNAParaUsar || camposNA;
    const pages = pdfDoc.getPages();
    
    // Verificar se existe página 2 (índice 1)
    if (pages.length < 2) {
      logger.warn("PDF não tem página 2, os campos serão preenchidos na página 1");
    }
    
    // Usar página 2 (índice 1) ou página 1 se não existir página 2
    const targetPage = pages[1] || pages[0];
    const { width, height } = targetPage.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // ============================================
    // 1. DATA - PÁGINA 2
    // Dia, Mês e Ano são inseridos separadamente em posições diferentes
    // Coordenadas diferentes para cada tipo de termo
    // ============================================
    
    if (tipoModelo === "computadores") {
      // DIA - Coordenadas para COMPUTADORES
      if (dados.dia || camposNAUsar.dia) {
        targetPage.drawText(camposNAUsar.dia ? "N/A" : dados.dia, {
          x: 160,                    // ← AJUSTE X DO DIA AQUI (esquerda/direita)
          y: height - 562,           // ← AJUSTE Y DO DIA AQUI (cima/baixo)
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        });
      }

      // MÊS - Coordenadas para COMPUTADORES
      if (dados.mes || camposNAUsar.mes) {
        targetPage.drawText(camposNAUsar.mes ? "N/A" : dados.mes, {
          x: 184,                    // ← AJUSTE X DO MÊS AQUI (esquerda/direita)
          y: height - 562,           // ← AJUSTE Y DO MÊS AQUI (cima/baixo)
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        });
      }

      // ANO - Coordenadas para COMPUTADORES
      if (dados.ano || camposNAUsar.ano) {
        targetPage.drawText(camposNAUsar.ano ? "N/A" : dados.ano, {
          x: 206,                    // ← AJUSTE X DO ANO AQUI (esquerda/direita)
          y: height - 562,           // ← AJUSTE Y DO ANO AQUI (cima/baixo)
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        });
      }
    } else if (tipoModelo === "celulares") {
      // DIA - Coordenadas para CELULARES
      if (dados.dia || camposNAUsar.dia) {
        targetPage.drawText(camposNAUsar.dia ? "N/A" : dados.dia, {
          x: 388,                    // ← AJUSTE X DO DIA AQUI (esquerda/direita) - CELULARES
          y: height - 710,       // ← AJUSTE Y DO DIA AQUI (cima/baixo) - CELULARES
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        });
      }

// MÊS - Coordenadas para CELULARES
      if (dados.mes || camposNAUsar.mes) {
        let valorMes = dados.mes;
        
        // Lógica adicionada: Converte número para nome apenas se não for N/A
        if (!camposNAUsar.mes && dados.mes) {
            const mesesExtenso = [
                "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
            ];
            const mesIndex = parseInt(dados.mes) - 1;
            if (mesIndex >= 0 && mesIndex < 12) {
                valorMes = mesesExtenso[mesIndex];
            }
        }

        targetPage.drawText(camposNAUsar.mes ? "N/A" : valorMes, {
          x: 435,
          y: height - 710,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        });
      }

      // ANO - Coordenadas para CELULARES
      if (dados.ano || camposNAUsar.ano) {
        targetPage.drawText(camposNAUsar.ano ? "N/A" : dados.ano, {
          x: 516,                    // ← AJUSTE X DO ANO AQUI (esquerda/direita) - CELULARES
          y: height - 710,      // ← AJUSTE Y DO ANO AQUI (cima/baixo) - CELULARES
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        });
      }
    }

    // ============================================
    // 2. EQUIPAMENTO - PÁGINA 2
    // Coordenadas: I x227 y263 - F x508 y263
    // ============================================
    if (dados.equipamento || camposNAUsar.equipamento) {
      targetPage.drawText(camposNAUsar.equipamento ? "N/A" : dados.equipamento, {
        x: 218,                    // ← X INICIAL (I)
        y: height - 235.2,           // ← Y INICIAL (I) - convertido para coordenadas do PDF
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
        maxWidth: 508 - 220,       // Largura máxima (F x - I x)
      });
    }

    // ============================================
    // 3. MARCA - PÁGINA 2
    // Coordenadas: I x227 y279 - F x508 y279
    // ============================================
    if (dados.marca || camposNAUsar.marca) {
      targetPage.drawText(camposNAUsar.marca ? "N/A" : dados.marca, {
        x: 218,                    // ← X INICIAL (I)
        y: height - 250,           // ← Y INICIAL (I) - convertido para coordenadas do PDF
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
        maxWidth: 508 - 227,       // Largura máxima (F x - I x)
      });
    }

    // ============================================
    // 4. MODELO - PÁGINA 2
    // Coordenadas: I x227 y293 - F x508 y293
    // ============================================
    if (dados.modelo || camposNAUsar.modelo) {
      targetPage.drawText(camposNAUsar.modelo ? "N/A" : dados.modelo, {
        x: 218,                    // ← X INICIAL (I)
        y: height - 265.8,           // ← Y INICIAL (I) - convertido para coordenadas do PDF
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
        maxWidth: 508 - 227,       // Largura máxima (F x - I x)
      });
    }

    // ============================================
    // 5. NÚMERO DE SÉRIE - PÁGINA 2
    // Coordenadas: I x227 y308 - F x508 y308
    // Apenas para COMPUTADORES (celulares têm coordenadas diferentes)
    // ============================================
    if (tipoModelo === "computadores" && (dados.numeroSerie || camposNAUsar.numeroSerie)) {
      targetPage.drawText(camposNAUsar.numeroSerie ? "N/A" : dados.numeroSerie, {
        x: 218,                    // ← X INICIAL (I)
        y: height - 281,           // ← Y INICIAL (I) - convertido para coordenadas do PDF
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
        maxWidth: 508 - 218,       // Largura máxima (F x - I x)
      });
    }

    // ============================================
    // 6. VALOR ATUAL DE MERCADO - PÁGINA 2
    // Coordenadas: I x227 y324 - F x508 y324
    // ============================================
    if (dados.valorMercado || camposNAUsar.valorMercado) {
      targetPage.drawText(camposNAUsar.valorMercado ? "N/A" : dados.valorMercado, {
        x: 232.8,                    // ← X INICIAL (I)
        y: height - 297.61,           // ← Y INICIAL (I) - convertido para coordenadas do PDF
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
        maxWidth: 508 - 227,       // Largura máxima (F x - I x)
      });
    }

    // ============================================
    // CAMPOS ESPECÍFICOS PARA CELULARES - PÁGINA 2
    // ============================================
    if (tipoModelo === "celulares") {
      
      // 1. APARELHO - Coordenadas: I x183 y249 - F x330 y249
      if (dados.aparelho || camposNAUsar.aparelho) {
        targetPage.drawText(camposNAUsar.aparelho ? "N/A" : dados.aparelho, {
          x: 180,                    // ← X INICIAL (I)
          y: height - 236,         // ← Y INICIAL (I) - convertido para coordenadas do PDF
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
          maxWidth: 330 - 180,       // Largura máxima (F x - I x)
        });
      }

      // 2. NUMERO - Coordenadas: I x357 y249 - F x560 y249
      if (dados.numero || camposNAUsar.numero) {
        targetPage.drawText(camposNAUsar.numero ? "N/A" : dados.numero, {
          x: 353,                    // ← X INICIAL (I)
          y: height - 236,          // ← Y INICIAL (I) - convertido para coordenadas do PDF
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
          maxWidth: 555 - 353,       // Largura máxima (F x - I x)
        });
      }

      // 3. NUMERO DE SERIE - Coordenadas: I x100 y264 - F x186 y261
      // Usando y264 (inicial) como referência
      if (dados.numeroSerie || camposNAUsar.numeroSerie) {
        targetPage.drawText(camposNAUsar.numeroSerie ? "N/A" : dados.numeroSerie, {
          x: 94,                    // ← X INICIAL (I)
          y: height - 253.8,           // ← Y INICIAL (I) - convertido para coordenadas do PDF
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
          maxWidth: 330 - 180,       // Largura máxima (F x - I x)
        });
      }

      // 4. CHIP - Coordenadas: I x222 y263 - F x329 y262
      // Usando y263 (inicial) como referência
      if (dados.chip || camposNAUsar.chip) {
        targetPage.drawText(camposNAUsar.chip ? "N/A" : dados.chip, {
          x: 216.8,                    // ← X INICIAL (I)
          y: height - 253.8,      // ← Y INICIAL (I) - convertido para coordenadas do PDF
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
          maxWidth: 329 - 216.8,       // Largura máxima (F x - I x)
        });
      }

      // 5. IMEI - Coordenadas: I x370 y262 - F x578 y262
      if (dados.imei || camposNAUsar.imei) {
        targetPage.drawText(camposNAUsar.imei ? "N/A" : dados.imei, {
          x: 366,                    // ← X INICIAL (I)
          y: height - 253.8,  // ← Y INICIAL (I) - convertido para coordenadas do PDF
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
          maxWidth: 555 - 366,      // Largura máxima (F x - I x)
        });
      }

      // 6. ACESSORIO - Coordenadas: I x129 y290 - F x331 y290
      if (dados.acessorio || camposNAUsar.acessorio) {
        targetPage.drawText(camposNAUsar.acessorio ? "N/A" : dados.acessorio, {
          x: 93,                    // ← X INICIAL (I)
          y: height - 268.4,        // ← Y INICIAL (I) - convertido para coordenadas do PDF
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
          maxWidth: 331 - 129,       // Largura máxima (F x - I x)
        });
      }

      // 6.1. MARINAS - Coordenadas logo abaixo do campo Acessório
      if (dados.marinas || camposNAUsar.marinas) {
        targetPage.drawText(camposNAUsar.marinas ? "N/A" : dados.marinas, {
          x: 350,                   // ← X INICIAL (I) - Mesmo que acessório
          y: height - 220,       // ← Y INICIAL (I) - Logo abaixo do acessório
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
          maxWidth: 331 - 129,       // Largura máxima (F x - I x)
        });
      }

      // 7. VALOR APARELHO - Coordenadas: I x127 y297 - F x330 y290
      // Usando y297 (inicial) como referência
      if (dados.valorAparelho || camposNAUsar.valorAparelho) {
        targetPage.drawText(camposNAUsar.valorAparelho ? "N/A" : dados.valorAparelho, {
          x: 137.5,                  // ← X INICIAL (I)
          y: height - 283.5,           // ← Y INICIAL (I) - convertido para coordenadas do PDF
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
          maxWidth: 323 - 127,       // Largura máxima (F x - I x)
        });
      }

      // 7.1. VALOR DO CHIP - Coordenadas específicas para celulares
      if (dados.valorChip || camposNAUsar.valorChip) {
        targetPage.drawText(camposNAUsar.valorChip ? "N/A" : dados.valorChip, {
          x: 412.5,                    // ← X INICIAL (I)
          y: height - 283.5,        // ← Y INICIAL (I) - convertido para coordenadas do PDF
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
          maxWidth: 555 - 124,       // Largura máxima (F x - I x)
        });
      }

      // 8. MINUTAGEM - Coordenadas: I x203 y304 - F x329 y305
      // Usando y304 (inicial) como referência
      if (dados.minutagem || camposNAUsar.minutagem) {
        targetPage.drawText(camposNAUsar.minutagem ? "N/A" : dados.minutagem, {
          x: 203,                    // ← X INICIAL (I)
          y: height - 298,           // ← Y INICIAL (I) - convertido para coordenadas do PDF
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
          maxWidth: 323 - 203,       // Largura máxima (F x - I x)
        });
      }

      // 9. DADOS MOVEIS - Coordenadas: I x407 y306 - F x560 y305
      // Usando y306 (inicial) como referência
      if (dados.dadosMoveis || camposNAUsar.dadosMoveis) {
        targetPage.drawText(camposNAUsar.dadosMoveis ? "N/A" : dados.dadosMoveis, {
          x: 403,                    // ← X INICIAL (I)
          y: height - 298,           // ← Y INICIAL (I) - convertido para coordenadas do PDF
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
          maxWidth: 555 - 403,       // Largura máxima (F x - I x)
        });
      }
    }
  };

  const updatePreview = useCallback(async () => {
    if (!pdfBytes) return;

    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      // Usar os valores atuais das refs
      await fillPdfFields(pdfDoc, termoDataRef.current, camposNARef.current);

      // Gerar bytes do PDF atualizado
      const pdfBytesUpdated = await pdfDoc.save();
      
      // Limpar URL anterior se existir (usando ref para evitar dependência)
      if (previewPdfUrlRef.current) {
        URL.revokeObjectURL(previewPdfUrlRef.current);
      }
      
      // Criar URL para preview
      const blob = new Blob([pdfBytesUpdated as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      previewPdfUrlRef.current = url;
      setPreviewPdfUrl(url);
    } catch (error) {
      logger.error("Erro ao atualizar preview do PDF:", error);
    }
  }, [pdfBytes, tipoModelo]);

  // Atualizar preview quando os dados mudarem (com debounce para evitar piscar)
  useEffect(() => {
    if (pdfBytes) {
      // Limpar timeout anterior se existir
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
      
      // Criar novo timeout para atualizar o preview após 2000ms de inatividade
      previewTimeoutRef.current = setTimeout(() => {
        updatePreview();
      }, 700);
      
      // Limpar timeout quando o componente desmontar ou quando pdfBytes mudar
      return () => {
        if (previewTimeoutRef.current) {
          clearTimeout(previewTimeoutRef.current);
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termoData, pdfBytes, camposNA]);

  const handleInputChange = (field: keyof TermoData, value: string) => {
    setTermoData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDownload = async () => {
    if (tipoModelo === "em_breve") {
      toast.error("Este tipo de termo ainda não está disponível");
      return;
    }

    if (!pdfBytes) {
      toast.error("PDF não carregado");
      return;
    }

    // Validação para ANO (obrigatório para ambos os tipos)
    if (!termoData.ano || termoData.ano.trim() === "") {
      toast.error("O campo Ano é obrigatório");
      return;
    }

    // Validação para campos obrigatórios de computadores
    if (tipoModelo === "computadores") {
      if (!termoData.equipamento || termoData.equipamento.trim() === "") {
        toast.error("O campo Equipamento é obrigatório");
        return;
      }
      if (!termoData.marca || termoData.marca.trim() === "") {
        toast.error("O campo Marca é obrigatório");
        return;
      }
      if (!termoData.modelo || termoData.modelo.trim() === "") {
        toast.error("O campo Modelo é obrigatório");
        return;
      }
      if (!termoData.numeroSerie || termoData.numeroSerie.trim() === "") {
        toast.error("O campo Número de Série é obrigatório");
        return;
      }
      if (!termoData.valorMercado || termoData.valorMercado.trim() === "") {
        toast.error("O campo Valor Atual de Mercado é obrigatório");
        return;
      }
    }

    // Validação para campos obrigatórios de celulares
    if (tipoModelo === "celulares") {
      if (!termoData.aparelho || termoData.aparelho.trim() === "") {
        toast.error("O campo Aparelho é obrigatório");
        return;
      }
      if (!termoData.numeroSerie || termoData.numeroSerie.trim() === "") {
        toast.error("O campo Número de Série é obrigatório");
        return;
      }
      if (!termoData.valorAparelho || termoData.valorAparelho.trim() === "") {
        toast.error("O campo Valor do Aparelho é obrigatório");
        return;
      }
      
      // Se o campo CHIP estiver preenchido, validar campos relacionados
      if (termoData.chip && termoData.chip.trim() !== "") {
        if (!termoData.valorChip || termoData.valorChip.trim() === "") {
          toast.error("Como você informou o Chip, o campo Valor do Chip é obrigatório");
          return;
        }
        if (!termoData.minutagem || termoData.minutagem.trim() === "") {
          toast.error("Como você informou o Chip, o campo Minutagem é obrigatório");
          return;
        }
        if (!termoData.dadosMoveis || termoData.dadosMoveis.trim() === "") {
          toast.error("Como você informou o Chip, o campo Dados Móveis é obrigatório");
          return;
        }
      }
    }

    try {
      toast.info("Gerando PDF...", { duration: 2000 });

      // Se IMEI estiver vazio para celulares, preencher automaticamente com "N/A"
      const dadosParaPdf = { ...termoData };
      if (tipoModelo === "celulares" && (!dadosParaPdf.imei || dadosParaPdf.imei.trim() === "")) {
        dadosParaPdf.imei = "N/A";
      }

      const pdfDoc = await PDFDocument.load(pdfBytes);
      await fillPdfFields(pdfDoc, dadosParaPdf, camposNA);

      // Salvar PDF
      const pdfBytesUpdated = await pdfDoc.save();
      
      // Baixar o PDF
      const blob = new Blob([pdfBytesUpdated as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const tipoNome = tipoModelo === "computadores" ? "Computadores" : "Celulares";
      a.download = `Termo_${tipoNome}_${termoData.equipamento || "Responsabilidade"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("PDF baixado com sucesso!");
    } catch (error) {
      logger.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF. Tente novamente.");
    }
  };

  const handlePrint = async () => {
    if (tipoModelo === "em_breve") {
      toast.error("Este tipo de termo ainda não está disponível");
      return;
    }

    if (!pdfBytes) {
      toast.error("PDF não carregado");
      return;
    }

    // Validação para ANO (obrigatório para ambos os tipos)
    if (!termoData.ano || termoData.ano.trim() === "") {
      toast.error("O campo Ano é obrigatório");
      return;
    }

    // Validação para campos obrigatórios de computadores
    if (tipoModelo === "computadores") {
      if (!termoData.equipamento || termoData.equipamento.trim() === "") {
        toast.error("O campo Equipamento é obrigatório");
        return;
      }
      if (!termoData.marca || termoData.marca.trim() === "") {
        toast.error("O campo Marca é obrigatório");
        return;
      }
      if (!termoData.modelo || termoData.modelo.trim() === "") {
        toast.error("O campo Modelo é obrigatório");
        return;
      }
      if (!termoData.numeroSerie || termoData.numeroSerie.trim() === "") {
        toast.error("O campo Número de Série é obrigatório");
        return;
      }
      if (!termoData.valorMercado || termoData.valorMercado.trim() === "") {
        toast.error("O campo Valor Atual de Mercado é obrigatório");
        return;
      }
    }

    // Validação para campos obrigatórios de celulares
    if (tipoModelo === "celulares") {
      if (!termoData.aparelho || termoData.aparelho.trim() === "") {
        toast.error("O campo Aparelho é obrigatório");
        return;
      }
      if (!termoData.numeroSerie || termoData.numeroSerie.trim() === "") {
        toast.error("O campo Número de Série é obrigatório");
        return;
      }
      if (!termoData.valorAparelho || termoData.valorAparelho.trim() === "") {
        toast.error("O campo Valor do Aparelho é obrigatório");
        return;
      }
      
      // Se o campo CHIP estiver preenchido, validar campos relacionados
      if (termoData.chip && termoData.chip.trim() !== "") {
        if (!termoData.valorChip || termoData.valorChip.trim() === "") {
          toast.error("Como você informou o Chip, o campo Valor do Chip é obrigatório");
          return;
        }
        if (!termoData.minutagem || termoData.minutagem.trim() === "") {
          toast.error("Como você informou o Chip, o campo Minutagem é obrigatório");
          return;
        }
        if (!termoData.dadosMoveis || termoData.dadosMoveis.trim() === "") {
          toast.error("Como você informou o Chip, o campo Dados Móveis é obrigatório");
          return;
        }
      }
    }

    try {
      toast.info("Gerando PDF para impressão...", { duration: 2000 });

      // Se IMEI estiver vazio para celulares, preencher automaticamente com "N/A"
      const dadosParaPdf = { ...termoData };
      if (tipoModelo === "celulares" && (!dadosParaPdf.imei || dadosParaPdf.imei.trim() === "")) {
        dadosParaPdf.imei = "N/A";
      }

      const pdfDoc = await PDFDocument.load(pdfBytes);
      await fillPdfFields(pdfDoc, dadosParaPdf, camposNA);

      // Salvar PDF
      const pdfBytesUpdated = await pdfDoc.save();
      
      // Criar blob e abrir janela de impressão
      const blob = new Blob([pdfBytesUpdated as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      
      // Usar iframe para impressão (mais confiável que window.open)
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = url;
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.print();
          // Limpar após impressão
          setTimeout(() => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
          }, 1000);
        }, 250);
      };
      
      toast.success("Abrindo impressão...");
    } catch (error) {
      logger.error("Erro ao gerar PDF para impressão:", error);
      toast.error("Erro ao gerar PDF. Tente novamente.");
    }
  };

  const handleReset = () => {
    const hoje = new Date();
    setTermoData({
      dia: hoje.getDate().toString(),
      mes: (hoje.getMonth() + 1).toString(),
      ano: hoje.getFullYear().toString(),
      equipamento: "",
      marca: "",
      modelo: "",
      numeroSerie: "",
      valorMercado: "",
      // Campos específicos para celulares
      aparelho: "",
      numero: "",
      chip: "",
      imei: "",
      acessorio: "",
      valorAparelho: "",
      valorChip: "",
      minutagem: "",
      dadosMoveis: "",
      marinas: "",
    });
    setCamposNA({});
    toast.info("Formulário resetado");
  };

  const handleToggleNA = (campo: string, checked: boolean) => {
    if (campo === "chip" && checked) {
      // Se marcar N/A no CHIP, automaticamente marca N/A em: valorChip, minutagem, dadosMoveis, numero, e o próprio chip
      setCamposNA((prev) => ({
        ...prev,
        chip: true,
        valorChip: true,
        minutagem: true,
        dadosMoveis: true,
        numero: true,
      }));
    } else if (campo === "chip" && !checked) {
      // Se desmarcar N/A no CHIP, desmarca também os campos relacionados
      setCamposNA((prev) => {
        const newState = { ...prev };
        delete newState.chip;
        delete newState.valorChip;
        delete newState.minutagem;
        delete newState.dadosMoveis;
        delete newState.numero;
        return newState;
      });
    } else {
      setCamposNA((prev) => ({
        ...prev,
        [campo]: checked,
      }));
    }
  };

  // Componente de Checkbox customizado com "N/A" dentro
  const NACheckbox = ({ id, checked, onCheckedChange, className }: {
    id: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    className?: string;
  }) => {
    const isSmall = className?.includes("h-3");
    return (
      <CheckboxPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={(checked) => onCheckedChange(checked === true)}
        className={`shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-red-200 data-[state=checked]:border-red-300 ${className || "h-4 w-4"}`}
      >
        <CheckboxPrimitive.Indicator className={`flex items-center justify-center font-semibold text-red-700 leading-none ${isSmall ? "text-[7px]" : "text-[8px]"}`}>
          N/A
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-2 md:gap-4 ${isMobile ? "" : "flex-1 min-h-0"}`}>
    {/* Formulário */}
    <Card className={`shadow-lg border-border/50 ${isMobile ? "" : "lg:col-span-3"} flex flex-col`}>
      <CardContent className={`space-y-2 md:space-y-3 ${isMobile ? "" : "flex-1 overflow-y-auto custom-scrollbar"} pt-3 md:pt-4 pb-3 md:pb-4 px-3 md:px-4`}>
        {/* Seletor de Modelo */}
        <div>
          <Label htmlFor="tipoModelo" className="text-sm mb-2 block">Tipo de Termo</Label>
          <div className="tabs-container" ref={tabsContainerRef}>
            <div className="tabs">
              <input 
                type="radio" 
                id="radio-1" 
                name="tabs" 
                checked={tipoModelo === "computadores"}
                onChange={() => setTipoModelo("computadores")}
              />
              <label 
                className="tab" 
                htmlFor="radio-1"
                ref={tab1Ref}
                onMouseEnter={() => setHoveredTab(0)}
                onMouseLeave={() => setHoveredTab(null)}
              >
                Computadores
              </label>
              <input 
                type="radio" 
                id="radio-2" 
                name="tabs"
                checked={tipoModelo === "celulares"}
                onChange={() => setTipoModelo("celulares")}
              />
              <label 
                className="tab" 
                htmlFor="radio-2"
                ref={tab2Ref}
                onMouseEnter={() => setHoveredTab(1)}
                onMouseLeave={() => setHoveredTab(null)}
              >
                Celulares
              </label>
              <input 
                type="radio" 
                id="radio-3" 
                name="tabs"
                checked={tipoModelo === "em_breve"}
                onChange={() => setTipoModelo("em_breve")}
              />
              <label 
                className="tab" 
                htmlFor="radio-3"
                ref={tab3Ref}
                onMouseEnter={() => setHoveredTab(2)}
                onMouseLeave={() => setHoveredTab(null)}
              >
                Em breve
              </label>
              <span className="glider" ref={gliderRef}></span>
            </div>
          </div>
        </div>

        {/* Campos do Termo */}
        <div className="space-y-2">
          {tipoModelo === "em_breve" ? (
            <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                    Aguardando atualização
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Estamos aguardando a qualidade informar os novos modelos de termos.
                  </p>
                </div>
              </div>
            </div>
          ) : (
          <div className="grid grid-cols-1 gap-2">
            {tipoModelo === "computadores" ? (
              <>
                <div>
                  <Label htmlFor="equipamento" className="text-sm">Equipamento *</Label>
                  <Input
                    id="equipamento"
                    value={termoData.equipamento}
                    onChange={(e) =>
                      handleInputChange("equipamento", e.target.value)
                    }
                    placeholder="Ex: Notebook, Desktop, etc."
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="marca" className="text-sm">Marca *</Label>
                  <Input
                    id="marca"
                    value={termoData.marca}
                    onChange={(e) => handleInputChange("marca", e.target.value)}
                    placeholder="Ex: ACER, Dell, HP, etc."
                    className="h-8 text-sm"
                 />
                </div>
                <div>
                  <Label htmlFor="modelo" className="text-sm">Modelo *</Label>
                  <Input
                    id="modelo"
                    value={termoData.modelo}
                    onChange={(e) => handleInputChange("modelo", e.target.value)}
                    placeholder="Ex: Aspire A515-57"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="numeroSerie" className="text-sm">Número de Série *</Label>
                  <Input
                    id="numeroSerie"
                    value={termoData.numeroSerie}
                    onChange={(e) =>
                      handleInputChange("numeroSerie", e.target.value)
                    }
                    placeholder="Número de série"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="valorMercado" className="text-sm">Valor Atual de Mercado *</Label>
                  <div className="relative">
                    <Input
                      id="valorMercado"
                      value={termoData.valorMercado}
                      onChange={(e) =>
                        handleInputChange("valorMercado", e.target.value)
                      }
                      placeholder="Ex: R$2.989,10"
                      disabled={camposNA.valorMercado || false}
                      className="h-8 text-sm pr-6 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2">
                      <NACheckbox
                        id="valorMercado-na"
                        checked={camposNA.valorMercado || false}
                        onCheckedChange={(checked) =>
                          handleToggleNA("valorMercado", checked)
                        }
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Campos específicos para celulares - Reordenados e melhor distribuídos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 1. Marina (Dropdown obrigatório) */}
                  <div className="col-span-1 sm:col-span-2">
                    <Label htmlFor="marina" className="text-sm">
                      Marina <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={termoData.marinas || ""}
                      onValueChange={(value) => handleInputChange("marinas", value)}
                      required
                    >
                      <SelectTrigger className="h-8 text-sm bg-background">
                        <SelectValue placeholder="Selecione a marina..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Boa Vista">Boa Vista</SelectItem>
                        <SelectItem value="Bracuhy">Bracuhy</SelectItem>
                        <SelectItem value="Piccola">Piccola</SelectItem>
                        <SelectItem value="Búzios">Búzios</SelectItem>
                        <SelectItem value="Itacuruçá">Itacuruçá</SelectItem>
                        <SelectItem value="Glória">Glória</SelectItem>
                        <SelectItem value="Paraty">Paraty</SelectItem>
                        <SelectItem value="Piratas">Piratas</SelectItem>
                        <SelectItem value="Ribeira">Ribeira</SelectItem>
                        <SelectItem value="Verolme">Verolme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 2. Aparelho (obrigatório) */}
                  <div className="col-span-1 sm:col-span-2">
                    <Label htmlFor="aparelho" className="text-sm">
                      Aparelho <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="aparelho"
                      value={termoData.aparelho || ""}
                      onChange={(e) => handleInputChange("aparelho", e.target.value)}
                      placeholder="Ex: iPhone 14, Samsung Galaxy S23"
                      className="h-8 text-sm"
                      required
                    />
                  </div>

                  {/* 3. Número (opcional) */}
                  <div>
                    <Label htmlFor="numero" className="text-sm">Número</Label>
                    <div className="relative">
                      <Input
                        id="numero"
                        value={termoData.numero || ""}
                        onChange={(e) => handleInputChange("numero", e.target.value)}
                        placeholder="Número CHIP"
                        disabled={camposNA.numero || false}
                        className="h-8 text-sm pr-6 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2">
                        <NACheckbox
                          id="numero-na"
                          checked={camposNA.numero || false}
                          onCheckedChange={(checked) => handleToggleNA("numero", checked)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. Número de Série (obrigatório) */}
                  <div>
                    <Label htmlFor="numeroSerie" className="text-sm">
                      Número de Série <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="numeroSerie"
                      value={termoData.numeroSerie}
                      onChange={(e) => handleInputChange("numeroSerie", e.target.value)}
                      placeholder="Número de série"
                      className="h-8 text-sm"
                      required
                    />
                  </div>

                  {/* 5. Chip (opcional) */}
                  <div>
                    <Label htmlFor="chip" className="text-sm">Chip</Label>
                    <div className="relative">
                      <Input
                        id="chip"
                        value={termoData.chip || ""}
                        onChange={(e) => handleInputChange("chip", e.target.value)}
                        placeholder="Número do chip"
                        disabled={camposNA.chip || false}
                        className="h-8 text-sm pr-6 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2">
                        <NACheckbox
                          id="chip-na"
                          checked={camposNA.chip || false}
                          onCheckedChange={(checked) => handleToggleNA("chip", checked)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 6. IMEI (obrigatório) */}
                  <div>
                    <Label htmlFor="imei1" className="text-sm">
                      IMEI1<span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="imei1"
                        value={termoData.imei || ""}
                        onChange={(e) => handleInputChange("imei", e.target.value)}
                        placeholder="IMEI1"
                        disabled={camposNA.imei || false}
                        className="h-8 text-sm pr-6 disabled:opacity-50 disabled:cursor-not-allowed"
                        required
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2">
                        <NACheckbox
                          id="imei-na"
                          checked={camposNA.imei || false}
                          onCheckedChange={(checked) => handleToggleNA("imei", checked)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 7. Acessórios (opcional) */}
                  <div className="col-span-1 sm:col-span-2">
                    <Label htmlFor="acessorio" className="text-sm">Acessórios</Label>
                    <div className="relative">
                      <Input
                        id="acessorio"
                        value={termoData.acessorio || ""}
                        onChange={(e) => handleInputChange("acessorio", e.target.value)}
                        placeholder="Ex: Capa, Carregador, Fone"
                        disabled={camposNA.acessorio || false}
                        className="h-8 text-sm pr-6 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2">
                        <NACheckbox
                          id="acessorio-na"
                          checked={camposNA.acessorio || false}
                          onCheckedChange={(checked) => handleToggleNA("acessorio", checked)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 8. Valor do Aparelho (obrigatório) */}
                  <div>
                    <Label htmlFor="valorAparelho" className="text-sm">
                      Valor do Aparelho <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="valorAparelho"
                        value={termoData.valorAparelho || ""}
                        onChange={(e) => handleInputChange("valorAparelho", e.target.value)}
                        placeholder="Ex: R$2.989,10"
                        disabled={camposNA.valorAparelho || false}
                        className="h-8 text-sm pr-6 disabled:opacity-50 disabled:cursor-not-allowed"
                        required
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2">
                        <NACheckbox
                          id="valorAparelho-na"
                          checked={camposNA.valorAparelho || false}
                          onCheckedChange={(checked) => handleToggleNA("valorAparelho", checked)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 9. Valor do Chip (opcional, obrigatório se chip preenchido) */}
                  <div>
                    <Label htmlFor="valorChip" className="text-sm">
                      Valor do Chip {termoData.chip && termoData.chip.trim() !== "" && <span className="text-red-500">*</span>}
                    </Label>
                    <div className="relative">
                      <Input
                        id="valorChip"
                        value={termoData.valorChip || ""}
                        onChange={(e) => handleInputChange("valorChip", e.target.value)}
                        placeholder="Ex: R$50,00"
                        disabled={camposNA.valorChip || false}
                        className={`h-8 text-sm pr-6 disabled:opacity-50 disabled:cursor-not-allowed ${termoData.chip && termoData.chip.trim() !== "" ? "border-blue-500 focus:border-blue-600" : ""}`}
                        required={termoData.chip && termoData.chip.trim() !== "" ? true : false}
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2">
                        <NACheckbox
                          id="valorChip-na"
                          checked={camposNA.valorChip || false}
                          onCheckedChange={(checked) => handleToggleNA("valorChip", checked)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 10. Minutagem (opcional, obrigatório se chip preenchido) */}
                  <div>
                    <Label htmlFor="minutagem" className="text-sm">
                      Minutagem {termoData.chip && termoData.chip.trim() !== "" && <span className="text-red-500">*</span>}
                    </Label>
                    <div className="relative">
                      <Input
                        id="minutagem"
                        value={termoData.minutagem || ""}
                        onChange={(e) => handleInputChange("minutagem", e.target.value)}
                        placeholder="Minutagem"
                        disabled={camposNA.minutagem || false}
                        className={`h-8 text-sm pr-6 disabled:opacity-50 disabled:cursor-not-allowed ${termoData.chip && termoData.chip.trim() !== "" ? "border-blue-500 focus:border-blue-600" : ""}`}
                        required={termoData.chip && termoData.chip.trim() !== "" ? true : false}
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2">
                        <NACheckbox
                          id="minutagem-na"
                          checked={camposNA.minutagem || false}
                          onCheckedChange={(checked) => handleToggleNA("minutagem", checked)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 11. Dados Móveis (opcional, obrigatório se chip preenchido) */}
                  <div>
                    <Label htmlFor="dadosMoveis" className="text-sm">
                      Dados Móveis {termoData.chip && termoData.chip.trim() !== "" && <span className="text-red-500">*</span>}
                    </Label>
                    <div className="relative">
                      <Input
                        id="dadosMoveis"
                        value={termoData.dadosMoveis || ""}
                        onChange={(e) => handleInputChange("dadosMoveis", e.target.value)}
                        placeholder="Dados móveis"
                        disabled={camposNA.dadosMoveis || false}
                        className={`h-8 text-sm pr-6 disabled:opacity-50 disabled:cursor-not-allowed ${termoData.chip && termoData.chip.trim() !== "" ? "border-blue-500 focus:border-blue-600" : ""}`}
                        required={termoData.chip && termoData.chip.trim() !== "" ? true : false}
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2">
                        <NACheckbox
                          id="dadosMoveis-na"
                          checked={camposNA.dadosMoveis || false}
                          onCheckedChange={(checked) => handleToggleNA("dadosMoveis", checked)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            {/* Data - Dia, Mês e Ano */}
            <div>
              <Label className="text-sm">Data <span className="text-xs text-muted-foreground"></span></Label>
              <div className="grid grid-cols-3 gap-2">
                {/* Dia */}
                <div>
                  <Input
                    id="dia"
                    value={termoData.dia}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 2);
                      handleInputChange("dia", value);
                    }}
                    placeholder="Dia"
                    maxLength={2}
                    className="h-8 text-sm"
                  />
                </div>
                {/* Mês */}
                <div>
                  <Input
                    id="mes"
                    value={termoData.mes}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 2);
                      handleInputChange("mes", value);
                    }}
                    placeholder="Mês"
                    maxLength={2}
                    className="h-8 text-sm"
                  />
                </div>
                {/* Ano */}
                <div>
                  <Input
                    id="ano"
                    value={termoData.ano}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                      handleInputChange("ano", value);
                    }}
                    placeholder="Ano *"
                    maxLength={4}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="space-y-2 pt-3 border-t">
          <Button
            onClick={handleReset}
            variant="outline"
            className="w-full h-8 text-sm"
          >
            <RefreshCw className="w-3 h-3 mr-1.5" />
            Limpar
          </Button>
          <Button
            onClick={handleDownload}
            className="w-full h-8 text-sm"
            disabled={!pdfBytes || tipoModelo === "em_breve"}
          >
            <Download className="w-3 h-3 mr-1.5" />
            Baixar PDF
          </Button>
          <Button
            onClick={handlePrint}
            variant="outline"
            className="w-full h-8 text-sm border-[#d64d4d] text-[#d64d4d] hover:bg-[#d64d4d] hover:text-white"
            disabled={!pdfBytes || tipoModelo === "em_breve"}
          >
            <Printer className="w-3 h-3 mr-1.5" />
            Imprimir
          </Button>
        </div>
      </CardContent>
    </Card>

    {/* Preview */}
    {!isMobile && (
    <Card className="shadow-lg border-border/50 lg:col-span-6 flex flex-col">
      <style>{`
        .hand-container {
          --skin-color: #E4C560;
          --tap-speed: 0.6s;
          --tap-stagger: 0.1s;
          position: relative;
          width: 80px;
          height: 60px;
          margin: 0 auto;
        }

        .hand-container:before {
          content: '';
          display: block;
          width: 180%;
          height: 75%;
          position: absolute;
          top: 70%;
          right: 20%;
          background-color: black;
          border-radius: 40px 10px;
          filter: blur(10px);
          opacity: 0.3;
        }

        .palm {
          display: block;
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          background-color: var(--skin-color);
          border-radius: 10px 40px;
        }

        .thumb {
          position: absolute;
          width: 120%;
          height: 38px;
          background-color: var(--skin-color);
          bottom: -18%;
          right: 1%;
          transform-origin: calc(100% - 20px) 20px;
          transform: rotate(-20deg);
          border-radius: 30px 20px 20px 10px;
          border-bottom: 2px solid rgba(0, 0, 0, 0.1);
          border-left: 2px solid rgba(0, 0, 0, 0.1);
        }

        .thumb:after {
          width: 20%;
          height: 60%;
          content: '';
          background-color: rgba(255, 255, 255, 0.3);
          position: absolute;
          bottom: -8%;
          left: 5px;
          border-radius: 60% 10% 10% 30%;
          border-right: 2px solid rgba(0, 0, 0, 0.05);
        }

        .finger {
          position: absolute;
          width: 80%;
          height: 35px;
          background-color: var(--skin-color);
          bottom: 32%;
          right: 64%;
          transform-origin: 100% 20px;
          animation-duration: calc(var(--tap-speed) * 2);
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          transform: rotate(10deg);
        }

        .finger:before {
          content: '';
          position: absolute;
          width: 140%;
          height: 30px;
          background-color: var(--skin-color);
          bottom: 8%;
          right: 65%;
          transform-origin: calc(100% - 20px) 20px;
          transform: rotate(-60deg);
          border-radius: 20px;
        }

        .finger:nth-child(1) {
          animation-delay: 0;
          filter: brightness(70%);
          animation-name: tap-upper-1;
        }

        .finger:nth-child(2) {
          animation-delay: var(--tap-stagger);
          filter: brightness(80%);
          animation-name: tap-upper-2;
        }

        .finger:nth-child(3) {
          animation-delay: calc(var(--tap-stagger) * 2);
          filter: brightness(90%);
          animation-name: tap-upper-3;
        }

        .finger:nth-child(4) {
          animation-delay: calc(var(--tap-stagger) * 3);
          filter: brightness(100%);
          animation-name: tap-upper-4;
        }

        @keyframes tap-upper-1 {
          0%, 50%, 100% {
            transform: rotate(10deg) scale(0.4);
          }
          40% {
            transform: rotate(50deg) scale(0.4);
          }
        }

        @keyframes tap-upper-2 {
          0%, 50%, 100% {
            transform: rotate(10deg) scale(0.6);
          }
          40% {
            transform: rotate(50deg) scale(0.6);
          }
        }

        @keyframes tap-upper-3 {
          0%, 50%, 100% {
            transform: rotate(10deg) scale(0.8);
          }
          40% {
            transform: rotate(50deg) scale(0.8);
          }
        }

        @keyframes tap-upper-4 {
          0%, 50%, 100% {
            transform: rotate(10deg) scale(1);
          }
          40% {
            transform: rotate(50deg) scale(1);
          }
        }
      `}</style>
      <CardContent className="flex-1 min-h-0 flex flex-col pt-6">
        {tipoModelo === "em_breve" ? (
          <div className="flex items-center justify-center flex-1 border rounded-lg bg-muted/30">
            <div className="text-center space-y-10 max-w-md p-10">
              <div className="hand-container">
                <div className="finger"></div>
                <div className="finger"></div>
                <div className="finger"></div>
                <div className="finger"></div>
                <div className="palm"></div>
                <div className="thumb"></div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Modelos em breve
                </h3>
                <p className="text-sm text-muted-foreground">
                  Estamos aguardando a qualidade informar os novos modelos de termos.
                </p>
              </div>
            </div>
          </div>
        ) : previewPdfUrl ? (
          <div className="border rounded-lg overflow-hidden bg-white flex-1 flex flex-col min-h-[400px] md:min-h-[600px]">
            <iframe
              key={pdfVersion}
              src={`${previewPdfUrl}#page=2&toolbar=0&t=${pdfVersion}`}
              className="w-full flex-1 border-0 min-h-[400px] md:min-h-[600px]"
              title="Preview do Termo - Página 2"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center flex-1 border rounded-lg bg-muted/30">
            <div className="text-center space-y-2">
              <Eye className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                {pdfBytes 
                  ? 'Carregando preview...'
                  : 'Carregando template do termo...'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    )}

    {/* Card de Ações Rápidas */}
    {!isMobile && (
    <Card className="shadow-lg border-border/50 lg:col-span-3 flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
        {/* Botões de Acesso Rápido */}
        <div className="space-y-3">


          <div className="grid grid-cols-2 gap-2">
            <Button
              asChild
              variant="outline"
              className="h-auto p-3 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border-green-300 hover:border-green-400 bg-gradient-to-br from-green-50 to-green-100/50 hover:from-green-100 hover:to-green-200 dark:from-green-950/30 dark:to-green-900/20 dark:border-green-800 dark:hover:border-green-700"
            >
              <a
                href={linkModeloPC}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center"
              >
                <Laptop className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="font-semibold text-xs text-green-700 dark:text-green-300">
                <b> Modelo</b> 
                <br />Computadores
                <br />e Periféricos
                </span>
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-auto p-3 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border-purple-300 hover:border-purple-400 bg-gradient-to-br from-purple-50 to-purple-100/50 hover:from-purple-100 hover:to-purple-200 dark:from-purple-950/30 dark:to-purple-900/20 dark:border-purple-800 dark:hover:border-purple-700"
            >
              <a
                href={linkModeloCelular}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center"
              >
                <Smartphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="font-semibold text-xs text-purple-700 dark:text-purple-300">
                <b> Modelo</b> 
                <br />Smartphone e Tablet
                </span>
              </a>
            </Button>
          </div>

          <Button
            asChild
            variant="outline"
            className="w-full h-auto p-4 flex flex-col items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-blue-300 hover:border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200 dark:from-blue-950/30 dark:to-blue-900/20 dark:border-blue-800 dark:hover:border-blue-700"
          >
            <a
              href={linkPastaDrive}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center"
            >
              <Cloud className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-1" />
              <span className="font-semibold text-sm text-blue-700 dark:text-blue-300">
                <b> Pastas</b> 
                <br />Google Drive
              </span>
              <span className="text-xs text-blue-600/70 dark:text-blue-400/70 block mt-1">
              4.Termos de Responsabilidade
              </span>
            </a>
          </Button>

          <div className="space-y-2 pt-2 border-t">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pastas do Drive
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-auto p-2.5 flex flex-col items-center justify-center gap-1 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
              >
                <a
                  href={linkDriveComputador}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center"
                >
                  <Laptop className="w-4 h-4" />
                  <span className="text-xs font-medium"><b>1.Notebooks</b> </span>
                </a>
              </Button>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-auto p-2.5 flex flex-col items-center justify-center gap-1 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
              >
                <a
                  href={linkDriveSmartphone}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center"
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="text-xs font-medium"><b>2.Telefonia Móvel</b> </span>
                </a>
              </Button>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-auto p-2.5 flex flex-col items-center justify-center gap-1 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
              >
                <a
                  href={linkDriveTablets}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center"
                >
                  <Tablet className="w-4 h-4" />
                  <span className="text-xs font-medium"><b>3.Tablets</b> </span>
                </a>
              </Button>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-auto p-2.5 flex flex-col items-center justify-center gap-1 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
              >
                <a
                  href={linkDriveMonitores}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center"
                >
                  <Monitor className="w-4 h-4" />
                  <span className="text-xs font-medium"><b>6.Monitores</b> </span>
                </a>
              </Button>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-auto p-2.5 flex flex-col items-center justify-center gap-1 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 col-span-2"
              >
                <a
                  href={linkDriveBastaoRonda}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center"
                >
                  <Radio className="w-4 h-4" />
                  <span className="text-xs font-medium"><b>4.Bastão de Ronda</b> </span>
                </a>
              </Button>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Políticas
            </h3>
            <div className="grid grid-cols-1 gap-2">
              
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-auto p-3 flex items-center justify-start gap-2 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border-amber-300 hover:border-amber-400 bg-gradient-to-r from-amber-50 to-amber-100/50 hover:from-amber-100 hover:to-amber-200 dark:from-amber-950/30 dark:to-amber-900/20 dark:border-amber-800 dark:hover:border-amber-700"
              >
                <a
                  href={linkPoliticaComputadores}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full"
                >
                  <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                    Política de Computadores
                  </span>
                  <ExternalLink className="w-3 h-3 ml-auto text-amber-600/70 dark:text-amber-400/70" />
                </a>
              </Button>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-auto p-3 flex items-center justify-start gap-2 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border-amber-300 hover:border-amber-400 bg-gradient-to-r from-amber-50 to-amber-100/50 hover:from-amber-100 hover:to-amber-200 dark:from-amber-950/30 dark:to-amber-900/20 dark:border-amber-800 dark:hover:border-amber-700"
              >
                <a
                  href={linkPoliticaSmartphones}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full"
                >
                  <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                    Política de Smartphones
                  </span>
                  <ExternalLink className="w-3 h-3 ml-auto text-amber-600/70 dark:text-amber-400/70" />
                </a>
              </Button>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-auto p-3 flex items-center justify-start gap-2 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border-amber-300 hover:border-amber-400 bg-gradient-to-r from-amber-50 to-amber-100/50 hover:from-amber-100 hover:to-amber-200 dark:from-amber-950/30 dark:to-amber-900/20 dark:border-amber-800 dark:hover:border-amber-700"
              >
                <a
                  href={linkPoliticaGerais}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full"
                >
                  <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                    Política Gerais
                  </span>
                  <ExternalLink className="w-3 h-3 ml-auto text-amber-600/70 dark:text-amber-400/70" />
                </a>
              </Button>

            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    )}

    </div>
  );
}