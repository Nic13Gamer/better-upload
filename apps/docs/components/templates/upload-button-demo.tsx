import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

export function UploadButtonDemo() {
  return (
    <Button className="relative">
      <Upload className="mr-2 size-4" />
      Upload file
    </Button>
  );
}
