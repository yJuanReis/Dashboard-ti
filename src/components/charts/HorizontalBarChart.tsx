import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface HorizontalBarChartData {
  empresa: string;
  valor: number;
}

interface HorizontalBarChartProps {
  data: HorizontalBarChartData[];
  title?: string;
  showLegend?: boolean;
  className?: string;
  maxBars?: number;
}

// Gradiente para as barras (azul → roxo)
const gradientId = "horizontalBarGradient";

// Cores do gradiente
const gradientColors = {
  start: "#3b82f6", // azul-500
  end: "#a855f7", // roxo-500
};

// Componente de Label customizado para mostrar valores dentro da barra
const CustomLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  const formattedValue = value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

  // Verificar se a barra é grande o suficiente para mostrar o texto
  const minWidthForLabel = 80; // largura mínima em pixels para mostrar o label

  if (width < minWidthForLabel) {
    return null; // Não mostrar label se a barra for muito pequena
  }

  return (
    <text
      x={x + 8}
      y={y + (height || 20) / 2}
      fill="white"
      className="text-xs font-semibold"
      textAnchor="start"
      dominantBaseline="middle"
    >
      {formattedValue}
    </text>
  );
};

export function HorizontalBarChart({
  data,
  title,
  showLegend = false,
  className,
  maxBars = 5,
}: HorizontalBarChartProps) {
  // Ordenar e limitar dados
  const sortedData = [...data]
    .sort((a, b) => b.valor - a.valor)
    .slice(0, maxBars);

  // Calcular valor máximo para normalização
  const maxValor = sortedData[0]?.valor || 1;

  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardHeader className="pb-3">
        {title && (
          <CardTitle className="text-base font-semibold text-foreground">
            {title}
          </CardTitle>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="w-full h-[300px] md:h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedData}
              layout="vertical"
              margin={{ top: 5, right: 20, bottom: 5, left: 20 }}
              barCategoryGap="12%"
            >
              {/* Definir gradiente SVG */}
              <defs>
                <linearGradient
                  id={gradientId}
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                  spreadMethod="reflect"
                >
                  <stop offset="0%" stopColor={gradientColors.start} />
                  <stop offset="100%" stopColor={gradientColors.end} />
                </linearGradient>
              </defs>

              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickFormatter={(value) =>
                  value.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    maximumFractionDigits: 0,
                    notation: "compact",
                  })
                }
              />
              <YAxis
                type="category"
                dataKey="empresa"
                width={100}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                className="text-foreground"
              />
              <Bar
                dataKey="valor"
                radius={[0, 8, 8, 0]}
                minPointSize={20}
              >
                {sortedData.map((entry, index) => {
                  // Aplicar gradiente com variação baseada na posição
                  const gradientIntensity = 1 - index / sortedData.length;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={`url(#${gradientId})`}
                      opacity={0.8 + gradientIntensity * 0.2}
                    />
                  );
                })}
                <LabelList
                  content={<CustomLabel />}
                  position="right"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {showLegend && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{
                    background: `linear-gradient(to right, ${gradientColors.start}, ${gradientColors.end})`,
                  }}
                />
                <span>Valor Total por Empresa</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

