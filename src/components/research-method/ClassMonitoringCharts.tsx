import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, XAxis, YAxis } from 'recharts';

import { MONITORING_CARD_CLASS } from '@/components/monitoring/MonitoringListCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import EmptyState from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/spinner';
import type { ClassMonitoring } from '@/types/research-method.types';

type Summary = ClassMonitoring['summary'];

const FUNNEL_COLOR = '#3b82f6';
const RESULT_COLORS = { passed: '#22c55e', failed: '#ef4444', notFinalized: '#94a3b8' } as const;

/** The two charts of Monitoring Kelas: the stages in order, and the results of the class. */
export function buildClassCharts(summary: Summary | undefined) {
  const s = summary ?? { total: 0, withSupervisor: 0, assigned: 0, finalProposal: 0, finalized: 0, passed: 0, failed: 0, notFinalized: 0 };
  return {
    funnel: [
      { key: 'total', label: 'Peserta', count: s.total },
      { key: 'withSupervisor', label: 'Punya Pembimbing', count: s.withSupervisor },
      { key: 'assigned', label: 'Ditetapkan', count: s.assigned },
      { key: 'finalProposal', label: 'Proposal Final', count: s.finalProposal },
      { key: 'finalized', label: 'Dinilai', count: s.finalized },
      { key: 'passed', label: 'Mulai Penelitian', count: s.passed },
    ],
    results: [
      { key: 'passed', label: 'Mulai Penelitian', count: s.passed, color: RESULT_COLORS.passed },
      { key: 'failed', label: 'Tidak Lulus', count: s.failed, color: RESULT_COLORS.failed },
      { key: 'notFinalized', label: 'Belum Dinilai', count: s.notFinalized, color: RESULT_COLORS.notFinalized },
    ],
  };
}

function ChartCard({ title, isLoading, children }: { title: string; isLoading: boolean; children: React.ReactNode }) {
  return (
    <Card className={MONITORING_CARD_CLASS}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className={isLoading ? 'flex h-62.5 items-center justify-center' : undefined}>
        {isLoading ? <Loading size="md" text="Memuat..." /> : children}
      </CardContent>
    </Card>
  );
}

/**
 * Monitoring Kelas, drawn with the Monitoring charts: the class through the proposal stages (bars),
 * and the results (donut). The numbers are written on the charts, so nothing needs a hover.
 */
export function ClassMonitoringCharts({ summary, isLoading }: { summary: Summary | undefined; isLoading: boolean }) {
  const { funnel, results } = buildClassCharts(summary);
  const shownResults = results.filter((r) => r.count > 0);
  const total = results.reduce((sum, r) => sum + r.count, 0);
  const funnelConfig: ChartConfig = { count: { label: 'Mahasiswa', color: FUNNEL_COLOR } };
  const resultConfig: ChartConfig = Object.fromEntries(results.map((r) => [r.label, { label: r.label, color: r.color }]));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Tahapan Kelas" isLoading={isLoading}>
        {(summary?.total ?? 0) === 0 ? (
          <EmptyState size="sm" title="Tidak Ada Data" description="Belum ada peserta kelas pada semester ini" />
        ) : (
          <ChartContainer config={funnelConfig} className="h-62.5 w-full">
            <BarChart data={funnel} layout="vertical" margin={{ left: 8, right: 32 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} fontSize={11} />
              <YAxis type="category" dataKey="label" width={120} fontSize={11} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent formatter={(value, _name, item) => <span>{item.payload?.label}: {value} mahasiswa</span>} />} />
              <Bar dataKey="count" fill={FUNNEL_COLOR} radius={[0, 4, 4, 0]} barSize={18}>
                <LabelList dataKey="count" position="right" fontSize={11} className="fill-foreground" />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </ChartCard>

      <ChartCard title="Hasil Penilaian Proposal" isLoading={isLoading}>
        {total === 0 ? (
          <EmptyState size="sm" title="Tidak Ada Data" description="Belum ada peserta kelas pada semester ini" />
        ) : (
          <>
            <ChartContainer config={resultConfig} className="h-52 w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => <span>{name}: {value}</span>} />} />
                <Pie
                  data={shownResults}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={2}
                  label={({ value }) => value}
                  labelLine={false}
                  fontSize={12}
                >
                  {shownResults.map((entry) => <Cell key={entry.key} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ChartContainer>
            <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs" aria-label="Hasil penilaian proposal">
              {results.map((r) => (
                <li key={r.key} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: r.color }} aria-hidden="true" />
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="font-semibold text-foreground">{r.count}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </ChartCard>
    </div>
  );
}
