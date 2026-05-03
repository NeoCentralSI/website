import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExitSurveyFormPreviewPanelProps {
  form: any;
}

const ExitSurveyFormPreviewPanel = ({ form }: ExitSurveyFormPreviewPanelProps) => (
  <div className="flex flex-col items-center justify-center h-[400px] bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center space-y-4">
    <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
      <Eye className="h-8 w-8" />
    </div>
    <div className="space-y-1">
      <h3 className="text-xl font-bold">Pratinjau Formulir</h3>
      <p className="text-muted-foreground max-w-sm">
        Fitur pratinjau sedang dikembangkan. Di sini Anda akan melihat bagaimana mahasiswa melihat formulir ini.
      </p>
    </div>
    <Button variant="outline" className="rounded-xl px-6">
      Pelajari Lebih Lanjut
    </Button>
  </div>
);

export default ExitSurveyFormPreviewPanel;
