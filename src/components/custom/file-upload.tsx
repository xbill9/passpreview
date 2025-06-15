
"use client";

import type * as React from 'react';
import { useState, useCallback } from 'react';
import { UploadCloud, FileText, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function FileUpload({ onFileSelect, disabled }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.pkpass') ) {
        setSelectedFile(file);
        onFileSelect(file);
      } else {
        toast({
          title: "Invalid File",
          description: "Please upload a valid .pkpass file.",
          variant: "destructive",
        });
        setSelectedFile(null);
        event.target.value = ''; // Reset input
      }
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    const file = event.dataTransfer.files?.[0];
    if (file) {
      if (file.name.endsWith('.pkpass') ) {
        setSelectedFile(file);
        onFileSelect(file);
      } else {
         toast({
          title: "Invalid File",
          description: "Please upload a valid .pkpass file.",
          variant: "destructive",
        });
        setSelectedFile(null);
      }
    }
  }, [onFileSelect, disabled, toast]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleRemoveFile = () => {
    setSelectedFile(null);
    // Create a dummy file to trigger onFileSelect(null) or similar if needed for parent state reset
    // For now, just clearing local state. Parent should handle absence of passData.
    // If parent needs explicit null, add `onFileRemove` prop or pass null to onFileSelect.
    // This example assumes parent will simply not receive new data and clear its existing data.
    const fileInput = document.getElementById('pkpass-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };
  
  const triggerFileInput = () => {
    document.getElementById('pkpass-upload')?.click();
  };

  return (
    <Card className="w-full max-w-lg shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Upload Pass</CardTitle>
        <CardDescription>Select or drag and drop your .pkpass file here.</CardDescription>
      </CardHeader>
      <CardContent>
        {selectedFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-md bg-accent/50">
              <div className="flex items-center space-x-2">
                <FileText className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium text-foreground truncate max-w-[200px] sm:max-w-xs">{selectedFile.name}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleRemoveFile} aria-label="Remove file">
                <XCircle className="h-5 w-5 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
            <Button onClick={triggerFileInput} className="w-full transition-all hover:shadow-md" disabled={disabled}>
              <UploadCloud className="mr-2 h-4 w-4" /> Change file
            </Button>
          </div>
        ) : (
          <div
            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer
                        hover:border-primary transition-colors duration-200 ease-in-out
                        ${isDragging ? 'border-primary bg-accent/50' : 'border-border'}
                        ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={disabled ? undefined : triggerFileInput}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { if (!disabled) triggerFileInput(); }}}
          >
            <UploadCloud className={`h-12 w-12 mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className={`text-center text-sm ${isDragging ? 'text-primary' : 'text-muted-foreground'}`}>
              Drag & drop a .pkpass file here, or click to select.
            </p>
            <input
              id="pkpass-upload"
              type="file"
              accept=".pkpass,application/vnd.apple.pkpass"
              onChange={handleFileChange}
              className="hidden"
              disabled={disabled}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
