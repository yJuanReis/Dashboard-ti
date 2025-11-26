import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface MobileTableProps {
  children: React.ReactNode;
  className?: string;
  mobileView?: React.ReactNode;
}

/**
 * Componente que renderiza uma tabela em desktop e cards em mobile
 */
export function MobileTable({ children, className, mobileView }: MobileTableProps) {
  const isMobile = useIsMobile();

  if (isMobile && mobileView) {
    return <div className={cn("space-y-3", className)}>{mobileView}</div>;
  }

  return <div className={className}>{children}</div>;
}

interface MobileCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Card para exibir dados de tabela em mobile
 */
export function MobileCard({ title, subtitle, children, className, onClick }: MobileCardProps) {
  return (
    <Card 
      className={cn("hover:shadow-md transition-shadow", onClick && "cursor-pointer", className)}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-2">
        {(title || subtitle) && (
          <div className="border-b pb-2 mb-2">
            {title && <h3 className="font-semibold text-sm">{title}</h3>}
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        )}
        <div className="space-y-2">{children}</div>
      </CardContent>
    </Card>
  );
}

interface MobileCardRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

/**
 * Linha de informação dentro de um MobileCard
 */
export function MobileCardRow({ label, value, className }: MobileCardRowProps) {
  return (
    <div className={cn("flex justify-between items-start gap-2", className)}>
      <span className="text-xs font-medium text-muted-foreground flex-shrink-0">{label}:</span>
      <span className="text-xs text-foreground text-right flex-1 break-words">{value}</span>
    </div>
  );
}



