import React, { useMemo, useState } from 'react';
import { 
  Star, 
  Download, 
  Eye,
  Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { cn } from '@/lib/utils';
import type { ExitSurveyForm } from '@/types/exit-survey.types';

interface ExitSurveyFormResponsePanelProps {
  form: ExitSurveyForm;
}

// Mock Data for individual responses
const MOCK_INDIVIDUAL_RESPONSES = [
  {
    id: '1',
    name: 'Mustafa Fathur R.',
    nim: '2211522038',
    email: 'fathur@student.unand.ac.id',
    phone: '081234567890',
    submitTime: '03 Mei 2026, 10.22',
  },
  {
    id: '2',
    name: 'Ilham Ramadhan',
    nim: '2211522041',
    email: 'ilham@student.unand.ac.id',
    phone: '081234567891',
    submitTime: '02 Mei 2026, 14.10',
  },
  {
    id: '3',
    name: 'Siti Aminah',
    nim: '2211522045',
    email: 'siti@student.unand.ac.id',
    phone: '081234567892',
    submitTime: '01 Mei 2026, 09.15',
  },
  {
    id: '4',
    name: 'Budi Santoso',
    nim: '2211522050',
    email: 'budi@student.unand.ac.id',
    phone: '081234567893',
    submitTime: '30 Apr 2026, 16.45',
  },
];

const COLORS = ['#F7931E', '#f59e0b', '#fb923c', '#fdba74', '#ea580c', '#8b5cf6', '#10b981'];

const ExitSurveyFormResponsePanel = ({ form }: ExitSurveyFormResponsePanelProps) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const stats = {
    total: 24,
    completed: 22,
    incomplete: 2,
    avgRating: 4.3,
    avgTime: '4m'
  };

  const chartQuestions = useMemo(() => {
    const questions: any[] = [];
    form.sessions?.forEach(session => {
      session.questions?.forEach(q => {
        if (q.questionType === 'single_choice' || q.questionType === 'multiple_choice') {
          const data = q.options?.map((opt, idx) => ({
            name: opt.optionText,
            value: Math.floor(Math.random() * 20) + 1,
          })) || [];
          
          questions.push({
            ...q,
            data
          });
        }
      });
    });
    return questions;
  }, [form]);

  const tableColumns = useMemo<Column<any>[]>(
    () => [
      {
        key: 'no',
        header: 'No',
        width: 60,
        className: 'text-center',
        render: (_item, index) => <span>{(page - 1) * pageSize + index + 1}</span>,
      },
      {
        key: 'name',
        header: 'Nama Responden',
        render: (item) => <div className="font-medium">{item.name}</div>,
      },
      {
        key: 'nim',
        header: 'NIM',
        width: 130,
        render: (item) => <div className="text-muted-foreground">{item.nim}</div>,
      },
      {
        key: 'email',
        header: 'Email',
        width: 220,
        render: (item) => <div className="text-muted-foreground">{item.email}</div>,
      },
      {
        key: 'phone',
        header: 'Nomor Telepon',
        width: 150,
        render: (item) => <div className="text-muted-foreground">{item.phone}</div>,
      },
      {
        key: 'submitTime',
        header: 'Waktu Submit',
        width: 180,
        render: (item) => <div className="text-muted-foreground">{item.submitTime}</div>,
      },
      {
        key: 'actions',
        header: 'Aksi',
        width: 100,
        className: 'text-right',
        render: () => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Lihat Detail"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [page, pageSize]
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Action Header */}
      <div className="flex justify-end items-center gap-3">
        <Button variant="outline" size="sm" className="h-10 px-5 gap-2 border-gray-200 font-bold hover:bg-muted/30 shadow-sm transition-all active:scale-95">
          <Download className="h-4 w-4" />
          Unduh CSV
        </Button>
        <Button variant="outline" size="sm" className="h-10 px-5 gap-2 border-gray-200 font-bold hover:bg-muted/30 shadow-sm transition-all active:scale-95">
          <Download className="h-4 w-4" />
          Unduh PDF
        </Button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {chartQuestions.map((q) => (
          <Card key={q.id} className="border-gray-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all group">
            <CardHeader className="pb-2 bg-muted/5 border-b border-gray-100">
              <div className="flex justify-between items-start gap-4">
                 <div className="space-y-1">
                    <CardTitle className="text-sm font-black text-gray-800 leading-tight group-hover:text-primary transition-colors">
                      {q.question}
                    </CardTitle>
                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                       <span>{stats.total} respons</span>
                       <span className="text-border">•</span>
                       <span>{q.questionType === 'single_choice' ? 'Pilihan ganda' : 'Kotak centang'}</span>
                    </div>
                 </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 h-[300px]">
              {q.questionType === 'single_choice' ? (
                <div className="h-full flex items-center gap-4">
                  <div className="flex-1 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={q.data}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {q.data.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-40 space-y-2 max-h-full overflow-y-auto pr-2 custom-scrollbar">
                    {q.data.map((entry: any, index: number) => {
                       const percentage = Math.round((entry.value / stats.total) * 100);
                       return (
                        <div key={entry.name} className="flex flex-col gap-1">
                           <div className="flex items-center gap-2">
                             <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                             <span className="text-[10px] font-bold text-gray-700 truncate">{entry.name}</span>
                           </div>
                           <div className="flex items-center justify-between pl-4">
                              <span className="text-[10px] font-medium text-muted-foreground">{entry.value}</span>
                              <span className="text-[10px] font-black text-gray-900">{percentage}%</span>
                           </div>
                        </div>
                       );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-full space-y-4 pr-2 overflow-y-auto custom-scrollbar">
                  {q.data.map((entry: any, index: number) => {
                    const percentage = Math.round((entry.value / stats.total) * 100);
                    return (
                      <div key={entry.name} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs font-bold text-gray-700 truncate flex-1">{entry.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-medium text-muted-foreground">{entry.value}</span>
                            <span className="text-xs font-black text-gray-900">{percentage}%</span>
                          </div>
                        </div>
                        <div className="h-2.5 w-full bg-muted/30 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Individual Responses Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-gray-900 font-display px-1">Responden Individual</h3>
        
        <CustomTable 
          columns={tableColumns}
          data={MOCK_INDIVIDUAL_RESPONSES}
          total={MOCK_INDIVIDUAL_RESPONSES.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          enableColumnFilters
          emptyText="Belum ada responden untuk formulir ini"
          className="border-gray-200 shadow-sm rounded-2xl overflow-hidden"
        />
      </div>
    </div>
  );
};

export default ExitSurveyFormResponsePanel;
