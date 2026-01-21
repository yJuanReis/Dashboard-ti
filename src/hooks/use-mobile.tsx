import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const update = () => {
      // Verificar se é dispositivo móvel real
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // Se é mobile real, sempre tratar como mobile
      if (isMobileDevice) {
        setIsMobile(true);
        return;
      }

      // Para desktop: NUNCA ativar modo mobile, independente do zoom
      // Isso garante que a sidebar nunca desapareça em desktop
      setIsMobile(false);
    };

    update();
    // Remover listener de resize para evitar mudanças dinâmicas
    // window.addEventListener("resize", update);

    return () => {
      // window.removeEventListener("resize", update);
    };
  }, []);

  return !!isMobile;
}

// Detecta quando o dispositivo é mobile (largura < MOBILE_BREAKPOINT)
// e está em orientação landscape. Útil para adaptar layout em celulares deitados.
export function useIsLandscapeMobile() {
  const [isLandscapeMobile, setIsLandscapeMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const update = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const pixelRatio = window.devicePixelRatio || 1;

      // Verificar se é dispositivo móvel real
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // Se é mobile real, usar lógica normal
      if (isMobileDevice) {
        const isMobileSize = width < MOBILE_BREAKPOINT || height < MOBILE_BREAKPOINT;
        const isLandscape = width > height;
        setIsLandscapeMobile(isMobileSize && isLandscape);
        return;
      }

      // Para desktop: lógica mais permissiva para detectar zoom
      const isLikelyZoomed = pixelRatio > 1.1 && width < (MOBILE_BREAKPOINT + 100);
      const isVeryZoomed = height < (MOBILE_BREAKPOINT - 50);
      const isZoomedDesktop = isLikelyZoomed || isVeryZoomed;

      const isActuallyMobile = (width < MOBILE_BREAKPOINT || height < MOBILE_BREAKPOINT) && !isZoomedDesktop;
      const isLandscape = width > height;

      setIsLandscapeMobile(isActuallyMobile && isLandscape);
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return isLandscapeMobile;
}