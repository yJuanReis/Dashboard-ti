import { useState, useEffect } from "react";
import { fetchRamais, type Ramal } from "@/lib/ramaisService";
import { fetchImpressoras, type Impressora } from "@/lib/impressorasService";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Printer, Loader2, Database, Activity } from "lucide-react";
import { logger } from "@/lib/logger";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { SectionCard } from "@/components/ui/SectionCard";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Home() {
  const [ramais, setRamais] = useState<Ramal[]>([]);
  const [loading, setLoading] = useState(true);
  const [impressoras, setImpressoras] = useState<Impressora[]>([]);
  const [loadingImpressoras, setLoadingImpressoras] = useState(true);
  const [openRamais, setOpenRamais] = useState(false);
  const [openImpressoras, setOpenImpressoras] = useState(false);
  const [openCard3, setOpenCard3] = useState(false);
  const [openCard4, setOpenCard4] = useState(false);

  useEffect(() => {
    loadRamais();
    loadImpressoras();
  }, []);

  const loadRamais = async () => {
    try {
      setLoading(true);
      const data = await fetchRamais();
      setRamais(data);
    } catch (error) {
      logger.error("Erro ao carregar ramais:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadImpressoras = async () => {
    try {
      setLoadingImpressoras(true);
      const data = await fetchImpressoras();
      setImpressoras(data);
    } catch (error) {
      logger.error("Erro ao carregar impressoras:", error);
    } finally {
      setLoadingImpressoras(false);
    }
  };

  const parseRamais = (ramaisString?: string): string[] =>
    !ramaisString
      ? []
      : ramaisString.split(/[,;\s\/]+/).filter((r) => r.trim().length > 0);

  const groupImpressorasByMarina = (
    impressoras: Impressora[]
  ): Record<string, Impressora[]> =>
    impressoras.reduce((acc, imp) => {
      const marina = imp.marina || "Sem marina";
      if (!acc[marina]) acc[marina] = [];
      acc[marina].push(imp);
      return acc;
    }, {} as Record<string, Impressora[]>);

  // Função para extrair marina do ramal
  const extractMarinaFromRamal = (ramal: Ramal): string => {
    // Primeiro, verifica se o ramal já tem o campo marina (prioridade máxima)
    if (ramal.marina && ramal.marina.trim()) {
      const marina = ramal.marina.trim();
      // Normaliza o nome da marina
      const marinaLower = marina.toLowerCase();
      if (marinaLower.includes("verolme")) return "Verolme";
      if (marinaLower.includes("bracuhy") || marinaLower.includes("braçuhy")) return "Bracuhy";
      if (marinaLower.includes("boa vista") || marinaLower.includes("boavista")) return "Boa Vista";
      return marina; // Retorna o nome original se não reconhecer
    }
    
    // Se não tiver campo marina, tenta extrair do nome_local
    const nomeLocal = ramal.nome_local;
    if (!nomeLocal) return "Verolme"; // Padrão: Verolme
    
    const nomeLower = nomeLocal.toLowerCase().trim();
    
    // Verifica padrões específicos (ordem de prioridade)
    // Verolme - várias formas de escrita
    if (nomeLower.includes("verolme") || nomeLower.includes("verol") || nomeLower.includes("vlme")) return "Verolme";
    
    // Bracuhy - várias formas
    if (nomeLower.includes("bracuhy") || nomeLower.includes("braçuhy") || nomeLower.includes("bracuhi")) return "Bracuhy";
    
    // Boa Vista
    if (nomeLower.includes("boa vista") || nomeLower.includes("boavista")) return "Boa Vista";
    if ((nomeLower.includes(" bv ") || nomeLower.endsWith(" bv")) && !nomeLower.includes("verolme")) return "Boa Vista";
    
    // Se nada foi encontrado, assume Verolme como padrão (já que a maioria é Verolme)
    return "Verolme";
  };

  // Função para agrupar ramais por marina
  const groupRamaisByMarina = (
    ramais: Ramal[]
  ): Record<string, Ramal[]> =>
    ramais.reduce((acc, ramal) => {
      const marina = extractMarinaFromRamal(ramal);
      if (!acc[marina]) acc[marina] = [];
      acc[marina].push(ramal);
      return acc;
    }, {} as Record<string, Ramal[]>);

  // Função para copiar IP da impressora
  const handleCopyIP = (ip: string, local: string) => {
    navigator.clipboard.writeText(ip);
    toast.success(`IP ${ip} copiado! (${local})`);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="aurora-background"></div>

      <main className="max-w-10xl mx-auto px-3 md:px-4 lg:px-6 py-4 md:py-6 lg:py-8 relative z-10">
        {/* -------- CARDS RESUMIDOS -------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {/* CARD RAMAIS */}
          <SectionCard
            title="Ramais"
            icon={<Phone className="w-4 h-4" />}
            count={ramais.length}
            onClick={() => setOpenRamais(true)}
          />

          {/* CARD IMPRESSORAS */}
          <SectionCard
            title="Impressoras"
            icon={<Printer className="w-4 h-4" />}
            count={impressoras.length}
            onClick={() => setOpenImpressoras(true)}
          />

          {/* CARD 3 */}
          <SectionCard
            title="Card 3"
            icon={<Database className="w-4 h-4" />}
            count={0}
            onClick={() => setOpenCard3(true)}
          />

          {/* CARD 4 */}
          <SectionCard
            title="Card 4"
            icon={<Activity className="w-4 h-4" />}
            count={0}
            onClick={() => setOpenCard4(true)}
          />
        </div>

        {/* -------- ÁREAS DE CONTEÚDO -------- */}
        <div className="home-content-areas">
          {/* Top Row - Areas 1 and 2 side by side */}
          <div className="home-content-top-row">
            {/* Content Area 1 */}
            <div className="home-section-content home-section-content-large">
              <div className="home-content-placeholder">
                <h3 className="text-xl font-semibold text-foreground mb-4">Área de Conteúdo 1</h3>
                <p className="text-muted-foreground">EM DESENVOLVIMENTO</p>
              </div>
            </div>

            {/* Content Area 2 */}
            <div className="home-section-content home-section-content-large">
              <div className="home-content-placeholder">
                <h3 className="text-xl font-semibold text-foreground mb-4">Área de Conteúdo 2</h3>
                <p className="text-muted-foreground">EM DESENVOLVIMENTO</p>
              </div>
            </div>
          </div>

          {/* Middle Row - Areas 3 and 4 side by side */}
          <div className="home-content-top-row mt-6">
            {/* Content Area 3 */}
            <div className="home-section-content home-section-content-large">
              <div className="home-content-placeholder">
                <h3 className="text-xl font-semibold text-foreground mb-4">Área de Conteúdo 3</h3>
                <p className="text-muted-foreground">EM DESENVOLVIMENTO</p>
              </div>
            </div>

            {/* Content Area 4 */}
            <div className="home-section-content home-section-content-large">
              <div className="home-content-placeholder">
                <h3 className="text-xl font-semibold text-foreground mb-4">Área de Conteúdo 4</h3>
                <p className="text-muted-foreground">EM DESENVOLVIMENTO</p>
              </div>
            </div>
          </div>
        </div>

        {/* -------- MODAL RAMAIS -------- */}
        <SimpleModal
          open={openRamais}
          onOpenChange={setOpenRamais}
          title="Lista de Ramais"
          maxWidth="7xl"
        >
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : (() => {
            const marinasOrdenadas = Object.entries(groupRamaisByMarina(ramais))
              .sort(([a], [b]) => {
                if (a === "Outros") return 1;
                if (b === "Outros") return -1;
                return a.localeCompare(b);
              });
            
            const marinasCol1 = marinasOrdenadas.filter((_, index) => index % 2 === 0);
            const marinasCol2 = marinasOrdenadas.filter((_, index) => index % 2 === 1);

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Accordion type="multiple" className="w-full space-y-3" defaultValue={[]}>
                  {marinasCol1.map(([marina, itens]) => (
                    <AccordionItem 
                      key={marina} 
                      value={marina} 
                      className="border rounded-lg px-4 bg-card hover:bg-accent/50 transition-colors"
                    >
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-base">
                            {marina}
                          </span>
                          <span className="text-muted-foreground text-sm font-normal">
                            ({itens.length} {itens.length === 1 ? 'ramal' : 'ramais'})
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {itens.map((ramal) => {
                            const ramaisList = parseRamais(ramal.ramais);
                            return (
                              <Card key={ramal.id} className="p-2">
                                <div className="text-xs font-semibold text-center">
                                  {ramal.nome_local}
                                </div>
                                <div className="flex flex-wrap justify-center mt-1 gap-1">
                                  {ramaisList.map((n, i) => (
                                    <span
                                      key={i}
                                      className="px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 rounded text-[10px] font-mono"
                                    >
                                      {n}
                                    </span>
                                  ))}
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                <Accordion type="multiple" className="w-full space-y-3" defaultValue={[]}>
                  {marinasCol2.map(([marina, itens]) => (
                    <AccordionItem 
                      key={marina} 
                      value={marina} 
                      className="border rounded-lg px-4 bg-card hover:bg-accent/50 transition-colors"
                    >
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-base">
                            {marina}
                          </span>
                          <span className="text-muted-foreground text-sm font-normal">
                            ({itens.length} {itens.length === 1 ? 'ramal' : 'ramais'})
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {itens.map((ramal) => {
                            const ramaisList = parseRamais(ramal.ramais);
                            return (
                              <Card key={ramal.id} className="p-2">
                                <div className="text-xs font-semibold text-center">
                                  {ramal.nome_local}
                                </div>
                                <div className="flex flex-wrap justify-center mt-1 gap-1">
                                  {ramaisList.map((n, i) => (
                                    <span
                                      key={i}
                                      className="px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 rounded text-[10px] font-mono"
                                    >
                                      {n}
                                    </span>
                                  ))}
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            );
          })()}
        </SimpleModal>

        {/* -------- MODAL IMPRESSORAS -------- */}
        <SimpleModal
          open={openImpressoras}
          onOpenChange={setOpenImpressoras}
          title="Lista de Impressoras"
          maxWidth="7xl"
        >
          {loadingImpressoras ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : (() => {
            const marinasOrdenadas = Object.entries(groupImpressorasByMarina(impressoras))
              .sort(([a], [b]) => a.localeCompare(b));
            
            const marinasCol1 = marinasOrdenadas.filter((_, index) => index % 2 === 0);
            const marinasCol2 = marinasOrdenadas.filter((_, index) => index % 2 === 1);

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Accordion type="multiple" className="w-full space-y-3" defaultValue={[]}>
                  {marinasCol1.map(([marina, itens]) => (
                    <AccordionItem 
                      key={marina} 
                      value={marina} 
                      className="border rounded-lg px-4 bg-card hover:bg-accent/50 transition-colors"
                    >
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-base">
                            {marina}
                          </span>
                          <span className="text-muted-foreground text-sm font-normal">
                            ({itens.length} {itens.length === 1 ? 'impressora' : 'impressoras'})
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {itens.map((imp) => (
                            <Card
                              key={imp.id}
                              className={`p-2 ${
                                imp.ip
                                  ? "cursor-pointer hover:shadow-md hover:border-purple-400 dark:hover:border-purple-600 transition-all"
                                  : ""
                              }`}
                              onClick={() =>
                                imp.ip && handleCopyIP(imp.ip, imp.local || "Impressora")
                              }
                            >
                              <div className="text-xs font-semibold text-center">
                                {imp.local}
                              </div>
                              {imp.ip ? (
                                <div className="mt-1 text-center px-1.5 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200 rounded text-[10px] font-mono">
                                  {imp.ip}
                                </div>
                              ) : (
                                <div className="text-[10px] text-muted-foreground text-center mt-1 italic">
                                  Sem IP
                                </div>
                              )}
                            </Card>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                <Accordion type="multiple" className="w-full space-y-3" defaultValue={[]}>
                  {marinasCol2.map(([marina, itens]) => (
                    <AccordionItem 
                      key={marina} 
                      value={marina} 
                      className="border rounded-lg px-4 bg-card hover:bg-accent/50 transition-colors"
                    >
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-base">
                            {marina}
                          </span>
                          <span className="text-muted-foreground text-sm font-normal">
                            ({itens.length} {itens.length === 1 ? 'impressora' : 'impressoras'})
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {itens.map((imp) => (
                            <Card
                              key={imp.id}
                              className={`p-2 ${
                                imp.ip
                                  ? "cursor-pointer hover:shadow-md hover:border-purple-400 dark:hover:border-purple-600 transition-all"
                                  : ""
                              }`}
                              onClick={() =>
                                imp.ip && handleCopyIP(imp.ip, imp.local || "Impressora")
                              }
                            >
                              <div className="text-xs font-semibold text-center">
                                {imp.local}
                              </div>
                              {imp.ip ? (
                                <div className="mt-1 text-center px-1.5 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200 rounded text-[10px] font-mono">
                                  {imp.ip}
                                </div>
                              ) : (
                                <div className="text-[10px] text-muted-foreground text-center mt-1 italic">
                                  Sem IP
                                </div>
                              )}
                            </Card>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            );
          })()}
        </SimpleModal>

        {/* -------- MODAL CARD 3 -------- */}
        <SimpleModal
          open={openCard3}
          onOpenChange={setOpenCard3}
          title="Card 3"
        >
          <div className="flex items-center justify-center py-6">
            <p className="text-muted-foreground">Conteúdo em desenvolvimento</p>
          </div>
        </SimpleModal>

        {/* -------- MODAL CARD 4 -------- */}
        <SimpleModal
          open={openCard4}
          onOpenChange={setOpenCard4}
          title="Card 4"
        >
          <div className="flex items-center justify-center py-6">
            <p className="text-muted-foreground">Conteúdo em desenvolvimento</p>
          </div>
        </SimpleModal>

        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            Sistema desenvolvido pela equipe de TI - BR Marinas
          </p>
        </div>
      </main>
    </div>
  );
}
