
"use client";

import Image from 'next/image';
import type { PassData, PassField } from '@/interfaces/pass-data';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { QRCodeCanvas } from 'qrcode.react';

interface PassPreviewProps {
  passData: PassData | null;
}

const getAlignmentClass = (alignment?: PassField['textAlignment']): string => {
  switch (alignment) {
    case 'PKTextAlignmentLeft': return 'text-left';
    case 'PKTextAlignmentCenter': return 'text-center';
    case 'PKTextAlignmentRight': return 'text-right';
    case 'PKTextAlignmentNatural':
    default:
      return 'text-left'; // Or determine by locale if possible
  }
};

export function PassPreview({ passData }: PassPreviewProps) {
  if (!passData) {
    return null; // Or a placeholder like "No pass data to display"
  }

  const {
    effectivePassStructure: structure,
    effectiveColors: colors,
    effectiveImages: images,
    organizationName,
    logoText,
    barcode,
    barcodes
  } = passData;

  const displayBarcode = barcode || (barcodes && barcodes[0]);

  const passStyle: React.CSSProperties = {
    backgroundColor: colors.backgroundColor || 'hsl(var(--card))', // Fallback to card bg
    color: colors.foregroundColor || 'hsl(var(--card-foreground))', // Fallback to card fg
    minHeight: '450px', // Minimum height for a pass-like feel
  };
  
  const labelStyle: React.CSSProperties = { color: colors.labelColor || colors.foregroundColor };
  const valueStyle: React.CSSProperties = { color: colors.foregroundColor };
  
  const renderField = (field: PassField, type: 'primary' | 'secondary' | 'auxiliary' | 'header') => (
    <div key={field.key} className={cn("flex flex-col", getAlignmentClass(field.textAlignment))}>
      {field.label && (
        <span
          className={cn("text-xs uppercase tracking-wide opacity-80", {
            'font-semibold': type === 'header',
          })}
          style={labelStyle}
        >
          {field.label}
        </span>
      )}
      <span
        className={cn("font-medium", {
            'text-2xl': type === 'primary',
            'text-lg': type === 'secondary' || type === 'header',
            'text-base': type === 'auxiliary',
          })}
        style={valueStyle}
      >
        {String(field.value)}
      </span>
    </div>
  );

  return (
    <Card
      className="w-full max-w-sm rounded-xl shadow-2xl overflow-hidden my-8 transition-all duration-500 ease-in-out animate-in fade-in zoom-in-95"
      style={passStyle}
      aria-label={`Pass for ${organizationName}`}
    >
      {images.background && (
        <Image
          src={images.background.url}
          alt={images.background.alt}
          layout="fill"
          objectFit="cover"
          className="absolute inset-0 z-0 opacity-20"
          
        />
      )}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header Section */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {images.logo && (
              <Image src={images.logo.url} alt={images.logo.alt} width={100} height={30} className="object-contain h-8"  />
            )}
            {!images.logo && logoText && <span className="font-semibold text-lg" style={valueStyle}>{logoText}</span>}
            {!images.logo && !logoText && <span className="font-semibold text-lg" style={valueStyle}>{organizationName}</span>}
          </div>
          {images.icon && (
             <Image src={images.icon.url} alt={images.icon.alt} width={36} height={36} className="rounded-full"  />
          )}
        </div>

        {/* Strip Image (if any) */}
        {images.strip && (
          <div className="h-24 sm:h-28 md:h-32 w-full relative overflow-hidden" style={{ backgroundColor: colors.stripColor || 'transparent' }}>
            <Image src={images.strip.url} alt={images.strip.alt} layout="fill" objectFit="cover"  />
          </div>
        )}
        {!images.strip && colors.stripColor && (
          <div className="h-2 w-full" style={{ backgroundColor: colors.stripColor }} />
        )}


        {/* Main Content Area */}
        <CardContent className="flex-grow p-4 space-y-4">
          {structure.headerFields && structure.headerFields.length > 0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
              {structure.headerFields.map(field => renderField(field, 'header'))}
            </div>
          )}

          {structure.primaryFields && structure.primaryFields.length > 0 && (
            <div className="space-y-1">
              {structure.primaryFields.map(field => renderField(field, 'primary'))}
            </div>
          )}

          {(structure.secondaryFields && structure.secondaryFields.length > 0 || structure.auxiliaryFields && structure.auxiliaryFields.length > 0) && (
            <div className={`grid grid-cols-${Math.min(3, (structure.secondaryFields?.length || 0) + (structure.auxiliaryFields?.length || 0))} gap-x-4 gap-y-3 pt-3`}>
              {structure.secondaryFields?.map(field => renderField(field, 'secondary'))}
              {structure.auxiliaryFields?.map(field => renderField(field, 'auxiliary'))}
            </div>
          )}
        </CardContent>

        {/* Barcode Section */}
        {displayBarcode && (
          <div className="p-4 mt-auto bg-white dark:bg-neutral-100 rounded-lg m-4 shadow-inner flex flex-col items-center space-y-2">
            <QRCodeCanvas 
              value={displayBarcode.message} 
              size={128} // Adjust size as needed
              bgColor={"#ffffff"} // Standard white background for QR
              fgColor={"#000000"} // Standard black foreground
              level={"L"} // Error correction level
              includeMargin={true}
              className="rounded-md"
            />
            {displayBarcode.altText && <p className="text-xs text-center text-neutral-600">{displayBarcode.altText}</p>}
            <p className="text-xs text-center text-neutral-500 font-mono break-all max-w-full">{displayBarcode.message}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
