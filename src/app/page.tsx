
"use client";

import { useState, useEffect } from 'react';
import { FileUpload } from '@/components/custom/file-upload';
import { PassPreview } from '@/components/custom/pass-preview';
import { parsePkpassFile } from '@/lib/pkpass-parser';
import type { PassData, PkpassParserResult } from '@/interfaces/pass-data';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2, Download, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function HomePage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [passData, setPassData] = useState<PassData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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

  const handleDownloadPdf = async () => {
    if (!passData) return;

    const passPreviewElement = document.getElementById('pass-preview-area');
    if (!passPreviewElement) {
      toast({
        title: "Error",
        description: "Could not find pass preview element to capture.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPdf(true);

    try {
      const canvas = await html2canvas(passPreviewElement, {
        scale: 2, // Higher scale for better resolution
        useCORS: true, // For external images like placeholders
        logging: false,
        backgroundColor: null, // Make canvas background transparent if element has no bg
      });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      const pdfPageWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      const pageMargin = 20; // Margin around the image on the PDF page

      const canvasAspectRatio = canvas.width / canvas.height;
      
      let imgPdfWidth = pdfPageWidth - (pageMargin * 2);
      let imgPdfHeight = imgPdfWidth / canvasAspectRatio;

      // If height exceeds page height with margin, then fit by height
      if (imgPdfHeight > pdfPageHeight - (pageMargin * 2)) {
        imgPdfHeight = pdfPageHeight - (pageMargin * 2);
        imgPdfWidth = imgPdfHeight * canvasAspectRatio;
      }
      
      const x = (pdfPageWidth - imgPdfWidth) / 2; // Center the image
      const y = (pdfPageHeight - imgPdfHeight) / 2; // Center the image

      pdf.addImage(imgData, 'PNG', x, y, imgPdfWidth, imgPdfHeight);
      pdf.save(`${passData.organizationName.replace(/ /g, '_')}_pass.pdf`);

      toast({
        title: "PDF Generated",
        description: "Your pass PDF has been downloaded.",
      });
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error creating the PDF. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

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
        <FileUpload onFileSelect={handleFileSelect} disabled={isLoading || isGeneratingPdf} />

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
            <div id="pass-preview-area">
              <PassPreview passData={passData} />
            </div>
            <Button 
              onClick={handleDownloadPdf} 
              className="w-full transition-all hover:shadow-md" 
              variant="outline"
              disabled={isGeneratingPdf || !passData}
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download as PDF
                </>
              )}
            </Button>
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
