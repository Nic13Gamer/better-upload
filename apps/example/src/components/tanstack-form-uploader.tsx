'use client';

import { useUploadFiles } from '@better-upload/client';
import { useForm } from '@tanstack/react-form';
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
  const form = useForm({
    defaultValues: {
      folderName: '',
      objectKeys: [] as string[],
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: ({ value }) => {
      // call your API here
      console.log(value);
    },
  });

  const uploader = useUploadFiles({
    route: 'form',
    onUploadComplete: ({ files }) => {
      form.setFieldValue(
        'objectKeys',
        files.map((file) => file.objectInfo.key)
      );
    },
  });

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Form Uploader</CardTitle>
        <CardDescription>Upload files to a specific folder.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="uploader-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field
              name="folderName"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Folder name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="my-folder"
                      autoComplete="off"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
            <form.Field
              name="objectKeys"
              children={(field) => {
                const isInvalid =
                  (field.state.meta.isTouched && !field.state.meta.isValid) ||
                  uploader.isError;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Folder name</FieldLabel>
                    {field.state.value.length > 0 ? (
                      <div className="flex flex-col">
                        {uploader.uploadedFiles.map((file) => (
                          <span key={file.objectInfo.key} className="text-sm">
                            {file.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <UploadDropzone
                        id={field.name}
                        control={uploader.control}
                        description={{
                          maxFiles: 5,
                          maxFileSize: '5MB',
                        }}
                      />
                    )}
                    {isInvalid && (
                      <FieldError
                        errors={
                          uploader.error
                            ? [{ message: uploader.error.message }]
                            : field.state.meta.errors
                        }
                      />
                    )}
                  </Field>
                );
              }}
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
            form="uploader-form"
            disabled={uploader.isPending}
          >
            Submit
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
