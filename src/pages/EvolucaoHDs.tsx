
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  HardDrive, 
  Video,
  MessageSquare,
  ShoppingCart, // Added
  AlertTriangle, // Added
  CheckCircle2 // Added
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Preço por HD em TB
const PRECO_POR_HD = 2400;

// Dados fictícios baseados no Controle NVR
const mockNVRs = [
  {
    id: 1,
    responsavel: "BR Marinas",
    marina: "Boa Vista",
    numeracao: "02",
    modelo: "INVO 6232",
    slots: [
      { status: "active", size: 14 },
      { status: "active", size: 18 },
      { status: "active", size: 6 },
      { status: "active", size: 4 },
    ],
    observacoes: "15 - Câmera IP\n1 - Câmera IP c/ áudio"
  },
  {
    id: 2,
    responsavel: "Tele Litorânea",
    marina: "Buzios",
    numeracao: "01",
    modelo: "NVD 3332",
    slots: [
      { status: "active", size: 4 },
      { status: "empty", size: 0 },
      { status: "active", size: 14 },
      { status: "empty", size: 0 },
    ],
    observacoes: "12 - Câmera IP\n2 - Câmera IP c/ áudio\n1 - Câmera analógica"
  },
  {
    id: 3,
    responsavel: "Tele Litorânea",
    marina: "Glória",
    numeracao: "03",
    modelo: "INVO 9332",
    slots: [
      { status: "active", size: 14 },
      { status: "active", size: 6 },
      { status: "active", size: 14 },
      { status: "active", size: 14 },
    ],
    observacoes: "20 - Câmera IP\n3 - Câmera IP c/ áudio"
  },
  {
    id: 4,
    responsavel: "Tele Litorânea",
    marina: "Glória",
    numeracao: "02",
    modelo: "INVO 9332",
    slots: [
      { status: "active", size: 14 },
      { status: "active", size: 6 },
      { status: "active", size: 14 },
      { status: "active", size: 14 },
    ],
    observacoes: "18 - Câmera IP"
  },
];

// New function to determine slot button styles, text, and icons
const getSlotButtonStyle = (slot) => {
  if (slot.status === "empty") {
    return {
      bg: "#991b1b", // Red-800
      border: "#ef4444", // Red-500
      text: "Comprar",
      icon: ShoppingCart,
      hoverBg: "#b91c1c" // Red-700
    };
  }
  if (slot.size < 12 && slot.size > 0) {
    return {
      bg: "#9a3412", // Orange-800
      border: "#fb923c", // Orange-400
      text: "Substituir",
      icon: AlertTriangle,
      hoverBg: "#c2410c" // Orange-700
    };
  }
  return {
    bg: "#166534", // Green-800
    border: "#22c55e", // Green-500
    text: `${slot.size} TB`,
    icon: CheckCircle2,
    hoverBg: "#166534" // Green-800 (no change on hover for 'ok' slots)
  };
};

export default function EvolucaoHDs() {
  const [selectedObs, setSelectedObs] = useState(null);

  // Filtrar slots inativos e calcular estatísticas
  const activeNVRs = mockNVRs.map(nvr => ({
    ...nvr,
    slots: nvr.slots.filter(slot => slot.status !== "inactive")
  }));

  const totalSlots = activeNVRs.reduce((sum, nvr) => sum + nvr.slots.length, 0);
  const filledSlots = activeNVRs.reduce((sum, nvr) => 
    sum + nvr.slots.filter(slot => slot.size > 0).length, 0
  );
  const progressPercent = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

  const slotsToAction = activeNVRs.reduce((sum, nvr) => 
    sum + nvr.slots.filter(slot => slot.status === "empty" || (slot.size < 12 && slot.size > 0)).length, 0
  );

  const custoEstimado = slotsToAction * PRECO_POR_HD;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("Home")}>
            <Button variant="outline" size="icon" className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700/50 backdrop-blur-sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">Evolução de HDs</h1>
            <p className="text-slate-400">Acompanhe e planeje substituições de discos</p>
          </div>
          <Link to={createPageUrl("ControleNVR")}>
            <Button variant="outline" className="gap-2 bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700/50 backdrop-blur-sm">
              <Video className="w-4 h-4" />
              NVRs
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="text-sm text-slate-400 mb-2">Progresso Geral</div>
              <div className="text-4xl font-bold text-white mb-3">{progressPercent}%</div>
              <div className="w-full h-3 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600/50">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500 ease-out shadow-lg"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="text-xs text-slate-500 mt-2">{filledSlots} de {totalSlots} slots preenchidos</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="text-sm text-slate-400 mb-2">Slots com ação</div>
              <div className="text-4xl font-bold text-white">{slotsToAction}</div>
              <div className="text-xs text-slate-500 mt-2">Ação necessária</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="text-sm text-slate-400 mb-2">Custo Estimado</div>
              <div className="text-4xl font-bold text-green-400">
                R$ {custoEstimado.toLocaleString('pt-BR')}
              </div>
              <div className="text-xs text-slate-500 mt-2">Preço por HD (18TB): R$ {PRECO_POR_HD.toLocaleString('pt-BR')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Legend */}
        <Card className="bg-slate-800/50 border-slate-700/50 mb-6 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white mr-2">Legenda:</span>
              {[
                { size: "3TB", color: "#ef4444" }, // Red-500
                { size: "4TB", color: "#f97316" }, // Orange-500
                { size: "6TB", color: "#eab308" }, // Yellow-700
                { size: "12TB", color: "#facc15" }, // Yellow-400
                { size: "14TB", color: "#84cc16" }, // Lime-500
                { size: "18TB", color: "#22c55e" }, // Green-500
                { size: "Vazio", color: "#6b7280" }, // Gray-500
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <div className="w-8 h-6 rounded" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs text-slate-300 mr-3">{item.size}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full min-w-[800px] bg-slate-800/50 backdrop-blur-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b-2 border-slate-700">
                <th className="bg-slate-800/90 backdrop-blur-sm text-slate-300 font-semibold py-4 px-5 text-center" style={{width: "15%"}}>Responsável</th>
                <th className="bg-slate-800/90 backdrop-blur-sm text-slate-300 font-semibold py-4 px-5 text-center" style={{width: "25%"}}>Marina / Numeração</th>
                <th className="bg-slate-800/90 backdrop-blur-sm text-slate-300 font-semibold py-4 px-5 text-center" style={{width: "15%"}}>Modelo</th>
                <th className="bg-slate-800/90 backdrop-blur-sm text-slate-300 font-semibold py-4 px-5 text-center" style={{width: "35%"}} colSpan={4}>Status dos Slots</th>
                <th className="bg-slate-800/90 backdrop-blur-sm text-slate-300 font-semibold py-4 px-5 text-center" style={{width: "10%"}}>OBS</th>
              </tr>
            </thead>
            <tbody>
              {activeNVRs.map((nvr, rowIndex) => (
                <tr 
                  key={nvr.id}
                  className={`border-b border-slate-700/50 transition-colors hover:bg-blue-900/20 ${
                    rowIndex % 2 === 0 ? 'bg-slate-800/40' : 'bg-slate-900/40'
                  }`}
                >
                  <td className="py-5 px-5 text-white font-medium text-center">{nvr.responsavel}</td>
                  <td className="py-5 px-5 text-white text-center">{nvr.marina} / {nvr.numeracao}</td>
                  <td className="py-5 px-5 text-white text-center">{nvr.modelo}</td>
                  {nvr.slots.map((slot, index) => {
                    const style = getSlotButtonStyle(slot);
                    const Icon = style.icon;
                    const isOk = slot.size >= 12;
                    
                    return (
                      <td key={index} className="py-5 px-3">
                        <button
                          disabled={isOk}
                          className={`w-full min-w-[90px] h-20 rounded-xl flex flex-col items-center justify-center border-2 transition-all font-bold text-white ${
                            isOk ? 'cursor-default' : 'hover:shadow-lg hover:-translate-y-0.5'
                          }`}
                          style={{
                            backgroundColor: style.bg,
                            borderColor: style.border,
                          }}
                          onMouseEnter={(e) => {
                            if (!isOk) e.currentTarget.style.backgroundColor = style.hoverBg;
                          }}
                          onMouseLeave={(e) => {
                            if (!isOk) e.currentTarget.style.backgroundColor = style.bg;
                          }}
                        >
                          <Icon className="w-5 h-5 mb-1" />
                          <span className="text-base">{isOk ? `${slot.size} TB` : style.text}</span>
                          {!isOk && (
                            <span className="text-[10px] opacity-80 uppercase mt-0.5">
                              {slot.status === "empty" ? "Necessário" : "Upgrade"}
                            </span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                  {/* Preencher células vazias se houver menos de 4 slots */}
                  {Array.from({ length: 4 - nvr.slots.length }).map((_, index) => (
                    <td key={`empty-${index}`} className="py-5 px-3"></td>
                  ))}
                  <td className="py-5 px-5 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedObs(nvr)}
                      className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600/50 backdrop-blur-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Observações Dialog */}
        <Dialog open={selectedObs !== null} onOpenChange={() => setSelectedObs(null)}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl">
                Observações: {selectedObs?.marina} / {selectedObs?.numeracao}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {selectedObs?.observacoes ? (
                <div className="space-y-2 text-slate-300 whitespace-pre-line">
                  {selectedObs.observacoes}
                </div>
              ) : (
                <p className="text-slate-400 italic">Sem observações</p>
              )}
            </div>
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => setSelectedObs(null)}
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
