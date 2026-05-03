import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExitSurveyFormResponsePanelProps {
  form: any;
}

const ExitSurveyFormResponsePanel = ({ form }: ExitSurveyFormResponsePanelProps) => (
  <div className="flex flex-col items-center justify-center h-[400px] bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center space-y-4">
    <div className="h-16 w-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shadow-sm">
      <MessageSquare className="h-8 w-8" />
    </div>
    <div className="space-y-1">
      <h3 className="text-xl font-bold">Respons & Analisis</h3>
      <p className="text-muted-foreground max-w-sm">
        Panel respons akan menampilkan ringkasan jawaban dan statistik dari mahasiswa yang telah mengisi survey.
      </p>
    </div>
    <Button variant="outline" className="rounded-xl px-6">
      Lihat Statistik
    </Button>
  </div>
);

export default ExitSurveyFormResponsePanel;
