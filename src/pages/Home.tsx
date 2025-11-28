import { useState, useEffect } from "react";
import { fetchRamais, type Ramal } from "@/lib/ramaisService";
import { fetchImpressoras, type Impressora } from "@/lib/impressorasService";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Printer, Loader2, Database, Activity } from "lucide-react";
import { logger } from "@/lib/logger";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { SectionCard } from "@/components/ui/SectionCard";

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
        >
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {ramais.map((ramal) => {
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
          )}
        </SimpleModal>

        {/* -------- MODAL IMPRESSORAS -------- */}
        <SimpleModal
          open={openImpressoras}
          onOpenChange={setOpenImpressoras}
          title="Lista de Impressoras"
        >
          {loadingImpressoras ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : (
            Object.entries(groupImpressorasByMarina(impressoras))
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([marina, itens]) => (
                <div key={marina} className="mb-6">
                  <h4 className="font-semibold text-sm mb-2">
                    {marina}{" "}
                    <span className="text-muted-foreground text-xs">
                      ({itens.length})
                    </span>
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {itens.map((imp) => (
                      <Card key={imp.id} className="p-2">
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
                </div>
              ))
          )}
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
