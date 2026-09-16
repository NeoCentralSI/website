import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { KbkLoadAggregation, KbkLoadOutlier } from '@/services/supervisionQuota.service';
import { toTitleCaseName } from '@/lib/text';
import { cn } from '@/lib/utils';

interface KbkLoadSummaryCardProps {
  aggregation: KbkLoadAggregation | undefined;
}

const LOAD_CHART_CONFIG = {
  aktif: { label: 'Aktif', color: '#0f766e' },
  booking: { label: 'Booking', color: '#6366f1' },
} satisfies ChartConfig;

const STATUS_CHART_CONFIG = {
  available: { label: 'Tersedia', color: '#10b981' },
  near: { label: 'Hampir Penuh', color: '#f59e0b' },
  full: { label: 'Penuh', color: '#ef4444' },
} satisfies ChartConfig;

const Y_AXIS_WIDTH = 168;
const LABEL_CHARS_PER_LINE = 22;

function wrapKbKLabel(label: string, maxChars = LABEL_CHARS_PER_LINE, maxLines = 2): string[] {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return ['—'];

  const lines: string[] = [];
  let current = '';
  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    if (lines.length === maxLines - 1) {
      const rest = words.slice(i).join(' ');
      lines.push(rest.length > maxChars ? `${rest.slice(0, maxChars - 1)}…` : rest);
      return lines;
    }
    current = word.length > maxChars ? `${word.slice(0, maxChars - 1)}…` : word;
  }
  if (current) lines.push(current);
  return lines;
}

function KbkYAxisTick({
  x = 0,
  y = 0,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string };
}) {
  const lines = wrapKbKLabel(payload?.value ?? '');
  const lineHeight = 12;
  const offsetY = -((lines.length - 1) * lineHeight) / 2;

  return (
    <text
      x={x}
      y={y}
      textAnchor="end"
      fontSize={11}
      className="fill-muted-foreground"
    >
      {lines.map((line, index) => (
        <tspan key={`${line}-${index}`} x={x} dy={index === 0 ? offsetY : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function outlierLabel(row: KbkLoadOutlier) {
  return `${toTitleCaseName(row.fullName)} (${row.load})`;
}

/**
 * Chart labels are the stored science_groups.name. Do not invent or strip
 * names; "Sistem Informasi" is the department, not a kelompok keilmuan.
 */
export function displayKelompokKeilmuanName(stored: string | null | undefined): string {
  const raw = (stored ?? '').trim();
  if (!raw || raw === 'Belum terpetakan') return 'Tanpa kelompok keilmuan';
  return raw;
}

function chartHeightClass(groupCount: number) {
  if (groupCount <= 3) return 'h-64';
  if (groupCount <= 5) return 'h-80';
  if (groupCount <= 7) return 'h-96';
  return 'h-[28rem]';
}

export function KbkLoadSummaryCard({ aggregation }: KbkLoadSummaryCardProps) {
  if (!aggregation || aggregation.groups.length === 0) return null;

  const barData = aggregation.groups.map((group) => {
    const aktif = group.activeCount ?? 0;
    const booking = group.bookingCount ?? 0;
    return {
      name: displayKelompokKeilmuanName(group.scienceGroupName),
      aktif,
      booking,
      total: aktif + booking,
    };
  });

  const statusData = [
    {
      key: 'available',
      name: 'Tersedia',
      count: aggregation.overall.availableCount ?? 0,
      fill: STATUS_CHART_CONFIG.available.color,
    },
    {
      key: 'near',
      name: 'Hampir Penuh',
      count: aggregation.overall.nearLimitCount ?? 0,
      fill: STATUS_CHART_CONFIG.near.color,
    },
    {
      key: 'full',
      name: 'Penuh',
      count: aggregation.overall.fullCount ?? 0,
      fill: STATUS_CHART_CONFIG.full.color,
    },
  ].filter((row) => row.count > 0);

  const aboveAverage = aggregation.groups.flatMap((group) => group.aboveAverage);
  const belowAverage = aggregation.groups.flatMap((group) => group.belowAverage);
  const statusTotal = statusData.reduce((sum, row) => sum + row.count, 0);

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-sm font-medium">Sebaran beban per kelompok keilmuan</CardTitle>
        <CardDescription>
          {aggregation.overall.lecturerCount} dosen, total {aggregation.overall.totalLoad} mahasiswa,
          rata-rata {aggregation.overall.averageLoad} per dosen.
        </CardDescription>
        <p className="text-xs text-muted-foreground">
          Setiap batang adalah jumlah mahasiswa pada dosen yang terdaftar di kelompok keilmuan
          itu, kolom yang sama dengan tabel di bawah. Aktif = bimbingan resmi. Booking =
          reservasi yang sudah disetujui. Bukan beban pasca-proposal di Monitoring Tugas Akhir.
          Dosen tanpa kelompok tampil sebagai Tanpa kelompok keilmuan; pemetaan dosen hanya
          dapat diubah Admin di Master Data, Data Dosen.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <ChartContainer
            config={LOAD_CHART_CONFIG}
            className={cn('aspect-auto w-full', chartHeightClass(barData.length))}
          >
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ top: 8, right: 36, left: 4, bottom: 8 }}
              barCategoryGap={12}
            >
              <CartesianGrid horizontal={false} />
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={Y_AXIS_WIDTH}
                interval={0}
                tickLine={false}
                axisLine={false}
                tick={<KbkYAxisTick />}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelKey="name"
                    formatter={(value, name) => (
                      <span>
                        {name}: {value}
                      </span>
                    )}
                  />
                }
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
              <Bar
                dataKey="aktif"
                name="Aktif"
                stackId="load"
                fill="var(--color-aktif)"
                maxBarSize={22}
              />
              <Bar
                dataKey="booking"
                name="Booking"
                stackId="load"
                fill="var(--color-booking)"
                radius={[0, 4, 4, 0]}
                maxBarSize={22}
              >
                <LabelList
                  dataKey="total"
                  position="right"
                  className="fill-foreground"
                  fontSize={11}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-2">
            <p className="text-sm font-medium">Status kuota dosen</p>
            <p className="text-xs text-muted-foreground">
              Terhadap kuota maksimum pada periode yang sama.
            </p>
            {statusData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada data status kuota.</p>
            ) : (
              <ChartContainer config={STATUS_CHART_CONFIG} className="aspect-auto h-56 w-full">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => (
                          <span>
                            {name}: {value} dosen
                            {statusTotal > 0
                              ? ` (${Math.round((Number(value) / statusTotal) * 100)}%)`
                              : ''}
                          </span>
                        )}
                      />
                    }
                  />
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="46%"
                    innerRadius={46}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.key} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                  />
                </PieChart>
              </ChartContainer>
            )}
          </div>

          <div className="lg:col-span-3 grid gap-4 sm:grid-cols-2 content-start">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Di atas rata-rata + 1 SD</p>
              {aboveAverage.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {aboveAverage.map((row) => (
                    <Badge key={row.lecturerId} variant="secondary" className="font-normal">
                      {outlierLabel(row)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Tidak ada dosen di atas ambang.</p>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Di bawah rata-rata − 1 SD</p>
              {belowAverage.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {belowAverage.map((row) => (
                    <Badge key={row.lecturerId} variant="outline" className="font-normal">
                      {outlierLabel(row)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Tidak ada dosen di bawah ambang.</p>
              )}
            </div>
            <p className="sm:col-span-2 text-xs text-muted-foreground">{aggregation.methodLabel}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
