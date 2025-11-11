
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Plus,
  HardDrive,
  Camera
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
// Removed unused Select imports
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// Removed unused Table imports, as plain HTML table is used
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";

// Dados fictícios - matching com Evolução HDs
const mockNVRs = [
  {
    id: 1,
    responsavel: "BR Marinas",
    marina: "Boa Vista",
    numeracao: "02",
    modelo: "INVO 6232 (6 slots)",
    cameras: 31,
    slots: [
      { status: "active", size: 14 },
      { status: "active", size: 18 },
      { status: "active", size: 6 },
      { status: "active", size: 4 },
      { status: "empty", size: 0 },
      { status: "empty", size: 0 },
    ],
    observacoes: "15 - Câmera IP\n1 - Câmera IP c/ áudio"
  },
  {
    id: 2,
    responsavel: "Tele Litorânea",
    marina: "Buzios",
    numeracao: "01",
    modelo: "NVD 3332 (4 slots)",
    cameras: 12,
    slots: [
      { status: "active", size: 4 },
      { status: "active", size: 14 },
      { status: "empty", size: 0 },
      { status: "inactive", size: 4 },
    ],
    observacoes: "12 - Câmera IP\n2 - Câmera IP c/ áudio\n1 - Câmera analógica"
  },
  {
    id: 3,
    responsavel: "Tele Litorânea",
    marina: "Glória",
    numeracao: "03",
    modelo: "INVO 9332 (4 slots)",
    cameras: 32,
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
    modelo: "INVO 9332 (4 slots)",
    cameras: 32,
    slots: [
      { status: "active", size: 14 },
      { status: "active", size: 6 },
      { status: "active", size: 14 },
      { status: "active", size: 14 },
    ],
    observacoes: "18 - Câmera IP"
  },
  {
    id: 5,
    responsavel: "Tele Litorânea",
    marina: "Glória",
    numeracao: "01",
    modelo: "INVO 9332 (4 slots)",
    cameras: 32,
    slots: [
      { status: "active", size: 14 },
      { status: "active", size: 6 },
      { status: "active", size: 14 },
      { status: "empty", size: 0 },
    ],
    observacoes: "32 câmeras IP"
  },
  {
    id: 6,
    responsavel: "Tele Litorânea",
    marina: "Glória",
    numeracao: "04",
    modelo: "INVO 9332 (4 slots)",
    cameras: 32,
    slots: [
      { status: "active", size: 14 },
      { status: "active", size: 6 },
      { status: "active", size: 14 },
      { status: "active", size: 14 },
    ],
    observacoes: "32 câmeras IP"
  },
  {
    id: 7,
    responsavel: "Tele Litorânea",
    marina: "Itacuruçá",
    numeracao: "01",
    modelo: "INVO 9332 (4 slots)",
    cameras: 31,
    slots: [
      { status: "active", size: 14 },
      { status: "active", size: 14 },
      { status: "active", size: 14 },
      { status: "empty", size: 0 },
    ],
    observacoes: "31 câmeras IP"
  },
];

const getSlotColor = (size) => {
  if (size === 0) return "#6b7280"; // gray-500
  if (size <= 3) return "#ef4444"; // red-500
  if (size === 4) return "#f97316"; // orange-500
  if (size === 6) return "#eab308"; // yellow-600 (was yellow-700)
  if (size === 12) return "#facc15"; // yellow-400
  if (size === 14) return "#84cc16"; // lime-500
  if (size >= 18) return "#06b6d4"; // cyan-500
  return "#6b7280"; // Default gray-500
};

export default function ControleNVR() {
  const [nvrs, setNvrs] = useState(mockNVRs);
  const [showDialog, setShowDialog] = useState(false);
  const [editingNVR, setEditingNVR] = useState(null);
  const [formData, setFormData] = useState({
    responsavel: "",
    marina: "",
    numeracao: "",
    modelo: "",
    cameras: 0,
    observacoes: ""
  });

  const handleOpenDialog = (nvr = null) => {
    if (nvr) {
      setEditingNVR(nvr);
      setFormData({
        responsavel: nvr.responsavel,
        marina: nvr.marina,
        numeracao: nvr.numeracao,
        modelo: nvr.modelo,
        cameras: nvr.cameras,
        observacoes: nvr.observacoes || ""
      });
    } else {
      setEditingNVR(null);
      setFormData({
        responsavel: "",
        marina: "",
        numeracao: "",
        modelo: "",
        cameras: 0,
        observacoes: ""
      });
    }
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editingNVR) {
      setNvrs(nvrs.map(n => n.id === editingNVR.id ? { ...n, ...formData } : n));
    } else {
      const newNVR = {
        id: Math.max(...nvrs.map(n => n.id)) + 1,
        ...formData,
        slots: [
          { status: "empty", size: 0 },
          { status: "empty", size: 0 },
          { status: "empty", size: 0 },
          { status: "empty", size: 0 },
        ]
      };
      setNvrs([...nvrs, newNVR]);
    }
    setShowDialog(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Home")}>
              <Button variant="outline" size="icon" className="bg-slate-800/50 border-slate-700/50 text-white hover:bg-slate-700/50 backdrop-blur-sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Controle de NVR</h1>
              <p className="text-slate-400">Gerencie gravadores de vídeo e HDs</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("EvolucaoHDs")}>
              <Button variant="outline" className="gap-2 bg-slate-800/50 border-slate-700/50 text-white hover:bg-slate-700/50 backdrop-blur-sm">
                <HardDrive className="w-4 h-4" />
                Evolução
              </Button>
            </Link>
            <Button 
              onClick={() => handleOpenDialog()} 
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Novo NVR
            </Button>
          </div>
        </div>

        {/* Legend */}
        <Card className="bg-slate-800/50 border-slate-700/50 mb-6 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white mr-2">Legenda:</span>
              {[
                { size: "3TB", color: "#ef4444" },
                { size: "4TB", color: "#f97316" },
                { size: "6TB", color: "#eab308" },
                { size: "12TB", color: "#facc15" },
                { size: "14TB", color: "#84cc16" },
                { size: "18TB", color: "#06b6d4" },
                { size: "Vazio", color: "#6b7280" },
                { size: "Inativo", color: "#78350f" }, // Using a specific amber hex color
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
                <th className="bg-slate-800/90 backdrop-blur-sm text-slate-300 font-semibold py-4 px-5 text-center" style={{width: "20%"}}>Marina / Numeração</th>
                <th className="bg-slate-800/90 backdrop-blur-sm text-slate-300 font-semibold py-4 px-5 text-center" style={{width: "15%"}}>Modelo</th>
                <th className="bg-slate-800/90 backdrop-blur-sm text-slate-300 font-semibold py-4 px-5 text-center">Câmeras</th>
                <th className="bg-slate-800/90 backdrop-blur-sm text-slate-300 font-semibold py-4 px-5 text-center" colSpan={6}>Status dos Slots</th>
                <th className="bg-slate-800/90 backdrop-blur-sm text-slate-300 font-semibold py-4 px-5 text-center" style={{width: "10%"}}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {nvrs.map((nvr, rowIndex) => (
                <tr 
                  key={nvr.id} 
                  className={`border-b border-slate-700/50 transition-colors hover:bg-blue-900/20 ${
                    rowIndex % 2 === 0 ? 'bg-slate-800/40' : 'bg-slate-900/40'
                  }`}
                >
                  <td className="py-4 px-5 text-white font-medium text-center">{nvr.responsavel}</td>
                  <td className="py-4 px-5 text-white text-center">{nvr.marina} / {nvr.numeracao}</td>
                  <td className="py-4 px-5 text-white text-center">{nvr.modelo}</td>
                  <td className="py-4 px-5 text-center">
                    <div className="flex items-center justify-center gap-1 text-white">
                      <Camera className="w-4 h-4" />
                      <span className="font-medium">{nvr.cameras}</span>
                    </div>
                  </td>
                  {nvr.slots.map((slot, index) => (
                    <td key={index} className="py-4 px-2">
                      {slot.status !== "inactive" ? (
                        <div className="flex justify-center">
                          <div 
                            className="w-11 h-11 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 transition-all"
                            style={{ 
                              backgroundColor: getSlotColor(slot.size),
                              borderColor: slot.size === 0 ? '#4b5563' : 'rgba(255, 255, 255, 0.2)', // gray-600 for empty border, lighter for others
                              opacity: slot.size === 0 ? 0.6 : 1
                            }}
                          >
                            {slot.size > 0 && `${slot.size}TB`}
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <div className="w-11 h-11 rounded-lg bg-amber-900/50 border-2 border-amber-700/50 flex items-center justify-center text-amber-400 text-xs font-bold shadow-lg opacity-50">
                            --
                          </div>
                        </div>
                      )}
                    </td>
                  ))}
                  {Array.from({ length: 6 - nvr.slots.length }).map((_, index) => (
                    <td key={`empty-${index}`} className="py-4 px-2">
                      <div className="w-11 h-11"></div>
                    </td>
                  ))}
                  <td className="py-4 px-5 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(nvr)}
                      className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600/50 backdrop-blur-sm"
                    >
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl">{editingNVR ? "Editar NVR" : "Novo NVR"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="responsavel" className="text-slate-300">Responsável *</Label>
                  <Input
                    id="responsavel"
                    value={formData.responsavel}
                    onChange={(e) => setFormData({...formData, responsavel: e.target.value})}
                    placeholder="Ex: BR Marinas"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marina" className="text-slate-300">Marina *</Label>
                  <Input
                    id="marina"
                    value={formData.marina}
                    onChange={(e) => setFormData({...formData, marina: e.target.value})}
                    placeholder="Ex: Glória"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numeracao" className="text-slate-300">Numeração *</Label>
                  <Input
                    id="numeracao"
                    value={formData.numeracao}
                    onChange={(e) => setFormData({...formData, numeracao: e.target.value})}
                    placeholder="Ex: 01"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cameras" className="text-slate-300">Nº de Câmeras</Label>
                  <Input
                    id="cameras"
                    type="number"
                    value={formData.cameras}
                    onChange={(e) => setFormData({...formData, cameras: parseInt(e.target.value) || 0})}
                    placeholder="Ex: 32"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelo" className="text-slate-300">Modelo *</Label>
                <Input
                  id="modelo"
                  value={formData.modelo}
                  onChange={(e) => setFormData({...formData, modelo: e.target.value})}
                  placeholder="Ex: INVO 9332 (4 slots)"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes" className="text-slate-300">Observações</Label>
                <textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  placeholder="Ex: 32 câmeras IP\n2 câmeras c/ áudio"
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)} className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!formData.responsavel || !formData.marina || !formData.numeracao || !formData.modelo}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
