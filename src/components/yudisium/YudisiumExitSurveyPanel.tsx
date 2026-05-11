import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Settings2 } from 'lucide-react';
import { useExitSurveyForms } from '@/hooks/yudisium/useYudisiumExitSurvey';
import { Loading } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';

export function YudisiumExitSurveyPanel() {
  const { data: forms = [], isLoading } = useExitSurveyForms();

  if (isLoading) return <Loading text="Memuat formulir..." />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Manajemen Exit Survey</h2>
          <p className="text-sm text-muted-foreground">Kelola formulir survei kelulusan untuk mahasiswa.</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Buat Formulir Baru
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {forms.map((form: any) => (
          <Card key={form.id} className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{form.name}</CardTitle>
                  <CardDescription className="line-clamp-1">{form.description || 'Tidak ada deskripsi'}</CardDescription>
                </div>
                <Badge variant={form.isActive ? 'default' : 'secondary'}>
                  {form.isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {form.questions?.length || 0} Pertanyaan
                </span>
                <Button variant="ghost" size="sm" className="h-8">
                  <Settings2 className="h-4 w-4 mr-1" />
                  Kelola
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {forms.length === 0 && (
          <div className="col-span-full text-center p-8 border rounded-lg bg-muted/20">
            <p className="text-muted-foreground">Belum ada formulir exit survey yang dibuat.</p>
          </div>
        )}
      </div>
    </div>
  );
}
