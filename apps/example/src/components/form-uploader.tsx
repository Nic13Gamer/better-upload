'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { UploadedFile } from 'better-upload/client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { UploadDropzone } from './ui/upload-dropzone';

const formSchema = z.object({
  folderName: z.string().min(1),
  objectKeys: z.array(z.string()).min(1),
});

export function FormUploader() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      folderName: '',
      objectKeys: [],
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    // call your API here
    console.log(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="folderName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Folder name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {uploadedFiles.length > 0 ? (
          <div className="flex flex-col">
            {uploadedFiles.map((file) => (
              <p key={file.objectKey}>{file.name}</p>
            ))}
          </div>
        ) : (
          <FormField
            control={form.control}
            name="objectKeys"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Files</FormLabel>
                <FormControl>
                  <UploadDropzone
                    route="form"
                    onUploadComplete={({ files }) => {
                      field.onChange(files.map((file) => file.objectKey));
                      setUploadedFiles(files);
                    }}
                    onUploadError={(error) => {
                      form.setError('objectKeys', {
                        message: error.message || 'An error occurred',
                      });
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
