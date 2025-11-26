import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // Considera como "mobile" quando a largura OU a altura forem menores que o breakpoint.
    // Isso garante que celulares em landscape continuem sendo tratados como mobile,
    // evitando que a sidebar fique com comportamento de desktop.
    const mediaQuery = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px), (max-height: ${MOBILE_BREAKPOINT - 1}px)`,
    );

    const update = () => {
      setIsMobile(mediaQuery.matches);
    };

    update();
    mediaQuery.addEventListener("change", update);

    return () => {
      mediaQuery.removeEventListener("change", update);
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

    const mediaQuery = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px) and (orientation: landscape)`,
    );

    const update = () => {
      setIsLandscapeMobile(mediaQuery.matches);
    };

    // Verifica também manualmente pela largura e altura
    const checkOrientation = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobileSize = width < MOBILE_BREAKPOINT || height < MOBILE_BREAKPOINT;
      const isLandscape = width > height;
      setIsLandscapeMobile(isMobileSize && isLandscape);
    };

    update();
    checkOrientation();
    
    mediaQuery.addEventListener("change", update);
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      mediaQuery.removeEventListener("change", update);
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  return isLandscapeMobile;
}