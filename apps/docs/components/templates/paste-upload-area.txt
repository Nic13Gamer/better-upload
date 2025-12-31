import type { UploadHookControl } from '@better-upload/client';

type PasteUploadAreaProps = {
  children: React.ReactNode;
  control: UploadHookControl<true>;
  metadata?: Record<string, unknown>;
  uploadOverride?: (
    ...args: Parameters<UploadHookControl<true>['upload']>
  ) => void;

  // Add any additional props you need.
};

export function PasteUploadArea({
  children,
  control: { upload, isPending },
  metadata,
  uploadOverride,
}: PasteUploadAreaProps) {
  return (
    <div
      onPasteCapture={(e) => {
        const files = e.clipboardData.files;
        if (files.length > 0 && !isPending) {
          if (uploadOverride) {
            uploadOverride(files, { metadata });
          } else {
            upload(files, { metadata });
          }
        }
      }}
    >
      {children}
    </div>
  );
}
