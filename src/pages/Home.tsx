export default function Home() {

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background Container */}
      <div className="aurora-background"></div>
      
      {/* Main Content */}
      <main className="max-w-10xl mx-auto px-3 md:px-4 lg:px-6 py-4 md:py-6 lg:py-8 relative z-10">
        {/* Welcome Section */}
        <div className="mb-4 md:mb-6 lg:mb-8 justify-center items-center flex flex-col">

          <button className="button-animated" data-text="TI BR MARINAS">
            <span className="actual-text">
              &nbsp;
              <span style={{ fontWeight: 800, letterSpacing: '0.5px', fontSize: '1em', color: 'hsl(var(--primary))', textShadow: '0 2px 8px hsla(var(--primary),0.35)' }}>
                TI
              </span>
              &nbsp;BR MARINAS&nbsp;
            </span>
            <span aria-hidden="true" className="hover-text">
              &nbsp;
              <span style={{ fontWeight: 800, letterSpacing: '0.5px', fontSize: '1em', color: 'hsl(var(--primary))', textShadow: '0 2px 8px hsla(var(--primary),0.35)' }}>
                TI
              </span>
              &nbsp;BR MARINAS&nbsp;
            </span>
          </button>
        </div>

        {/* Content Areas */}
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

            {/* Bottom Row - Area 5 full width */}
            <div className="home-content-bottom-row mt-6">
              {/* Content Area 5 */}
              <div className="home-section-content home-section-content-full">
                <div className="home-content-placeholder">
                  <h3 className="text-xl font-semibold text-foreground mb-4">Área de Conteúdo 5</h3>
                  <p className="text-muted-foreground">EM DESENVOLVIMENTO</p>
                </div>
              </div>
            </div>
        </div>



        {/* Footer Info */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            Sistema desenvolvido pela equipe de TI - BR Marinas
          </p>
        </div>
      </main>
    </div>
  );
}
