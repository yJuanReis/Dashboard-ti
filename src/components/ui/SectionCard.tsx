import { Card } from "@/components/ui/card";

export function SectionCard({
  title,
  icon,
  count,
  onClick,
}: {
  title: string;
  icon: React.ReactNode;
  count?: number;
  onClick: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      className="p-3 cursor-pointer border hover:shadow-md hover:border-primary/50 transition-all rounded-lg bg-card/70 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
          {icon}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-semibold text-sm truncate">{title}</span>
          {count !== undefined && (
            <span className="text-xs text-muted-foreground">
              {count} {count === 1 ? 'item' : 'itens'}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

