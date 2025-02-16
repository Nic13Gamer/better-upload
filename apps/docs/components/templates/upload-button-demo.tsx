import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

export function UploadButtonDemo() {
  return (
    <Button className="relative">
      <Upload className="size-4" />
      Upload file
    </Button>
  );
}
