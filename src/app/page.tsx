
"use client";

import { useState, useEffect } from 'react';
import { FileUpload } from '@/components/custom/file-upload';
import { PassPreview } from '@/components/custom/pass-preview';
import { parsePkpassFile } from '@/lib/pkpass-parser';
import type { PassData, PkpassParserResult } from '@/interfaces/pass-data';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function HomePage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [passData, setPassData] = useState<PassData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File | null) => {
    setUploadedFile(file);
    if (!file) {
      setPassData(null);
      setError(null);
    }
  };

  useEffect(() => {
    if (!uploadedFile) {
      return;
    }

    const processFile = async () => {
      setIsLoading(true);
      setError(null);
      setPassData(null); 

      try {
        const result: PkpassParserResult = await parsePkpassFile(uploadedFile);
        if (result.success) {
          setPassData(result.data);
        } else {
          setError(result.error);
        }
      } catch (e) {
        console.error("Parsing error:", e);
        setError('An unexpected error occurred while parsing the file.');
      } finally {
        setIsLoading(false);
      }
    };

    processFile();
  }, [uploadedFile]);

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-background text-foreground font-body selection:bg-primary/30 selection:text-primary-foreground">
      <header className="my-8 sm:my-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-headline font-bold" style={{ color: 'hsl(var(--primary-foreground))' }}>
          Pass Prevue
        </h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Upload a .pkpass file to see a preview of your pass.
        </p>
      </header>

      <div className="w-full flex flex-col items-center space-y-8">
        <FileUpload onFileSelect={handleFileSelect} disabled={isLoading} />

        {isLoading && (
          <div className="w-full max-w-sm space-y-4 animate-pulse-subtle">
            <Skeleton className="h-[60px] w-full rounded-xl" />
            <Skeleton className="h-[450px] w-full rounded-xl" />
            <Skeleton className="h-[80px] w-full rounded-xl" />
          </div>
        )}

        {error && !isLoading && (
          <Alert variant="destructive" className="w-full max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && passData && (
          <div className="w-full max-w-sm space-y-4">
            <PassPreview passData={passData} />
          </div>
        )}
        
        {!isLoading && !error && !passData && uploadedFile && (
             <Alert variant="default" className="w-full max-w-lg bg-accent text-accent-foreground">
               <CheckCircle2 className="h-4 w-4" />
               <AlertTitle>Processing Complete</AlertTitle>
               <AlertDescription>File processed. If preview is not visible and there's no error, please try re-uploading.</AlertDescription>
             </Alert>
        )}

        {!isLoading && !passData && !error && !uploadedFile && (
          <div className="text-center p-8 border-2 border-dashed border-border/50 rounded-lg max-w-sm w-full mt-4">
            <h2 className="text-xl font-semibold text-muted-foreground">Pass Preview Area</h2>
            <p className="text-sm text-muted-foreground">Your pass preview will appear here once you upload a file.</p>
          </div>
        )}
      </div>
      <footer className="mt-16 mb-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Pass Prevue. For demonstration purposes.</p>
      </footer>
    </main>
  );
}
