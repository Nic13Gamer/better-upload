'use client';

import { useUploadFiles } from '@better-upload/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { UploadDropzone } from '@/components/ui/upload-dropzone';

const formSchema = z.object({
  folderName: z.string().min(1, 'Folder name is required.'),
  objectKeys: z.array(z.string()).min(1, 'Upload at least one file.'),
});

export function FormUploader() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      folderName: '',
      objectKeys: [],
    },
  });

  const uploader = useUploadFiles({
    route: 'form',
    onUploadComplete: ({ files }) => {
      form.setValue(
        'objectKeys',
        files.map((file) => file.objectInfo.key)
      );
    },
    onError: (error) => {
      form.setError('objectKeys', {
        message: error.message || 'An error occurred.',
      });
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    // call your API here
    console.log(data);
  }

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Form Uploader</CardTitle>
        <CardDescription>Upload files to a specific folder.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="folderName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-folderName">
                    Folder name
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-rhf-demo-folderName"
                    aria-invalid={fieldState.invalid}
                    placeholder="my-folder"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="objectKeys"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-objectKeys">
                    Files
                  </FieldLabel>
                  {field.value.length > 0 ? (
                    <div className="flex flex-col">
                      {uploader.uploadedFiles.map((file) => (
                        <span key={file.objectInfo.key} className="text-sm">
                          {file.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <UploadDropzone
                      id="form-rhf-demo-objectKeys"
                      control={uploader.control}
                      description={{
                        maxFiles: 5,
                        maxFileSize: '5MB',
                      }}
                    />
                  )}
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              uploader.reset();
            }}
          >
            Reset
          </Button>
          <Button
            type="submit"
            form="form-rhf-demo"
            disabled={uploader.isPending}
          >
            Submit
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
