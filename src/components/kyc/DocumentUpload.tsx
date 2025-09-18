import { useState } from "react";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, Camera, FileText, CheckCircle, XCircle, AlertCircle, Shield, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import Tesseract from "tesseract.js";
import {
  findNameInText,
  findPhoneInText,
  findDateInText,
  findAadhaarInText,
  isAadhaarDocument,
} from "@/lib/textMatching";

interface DocumentUploadProps {
  data: {
    name: string;
    dateOfBirth: string;
    idNumber: string;
    emergencyContact: string;
    photo: File | null;
    idDocument: File | null;
  };
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

interface ValidationResult {
  status: 'pending' | 'validating' | 'valid' | 'invalid' | 'warning';
  extractedData?: {
    name?: string;
    idNumber?: string;
    dateOfBirth?: string;
    phone?: string;
  };
  validationResults?: {
    [key: string]: {
      found: boolean;
      confidence: number;
      message: string;
      status: 'success' | 'warning' | 'error';
    };
  };
  ocrText?: string;
  progress?: number;
}

export const DocumentUpload = ({ data, onUpdate, onNext, onBack }: DocumentUploadProps) => {
  const [documentValidation, setDocumentValidation] = useState<ValidationResult>({ status: 'pending' });

  const validateDocumentData = async (file: File) => {
    setDocumentValidation({ status: 'validating', progress: 0 });

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setDocumentValidation({
          status: 'invalid',
          validationResults: {
            fileType: {
              found: false,
              confidence: 0,
              message: 'Document must be an image (JPG, PNG, etc.)',
              status: 'error'
            }
          }
        });
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a clear image of your Aadhaar card.',
          variant: 'destructive',
        });
        return;
      }

      // Perform OCR with progress tracking
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setDocumentValidation(prev => ({
              ...prev,
              progress: Math.round(m.progress * 100)
            }));
          }
        }
      });

      const rawText = result?.data?.text || '';
      console.log('OCR Text:', rawText); // For debugging

      setDocumentValidation(prev => ({ ...prev, progress: 100 }));

      // Check if document is Aadhaar
      const aadhaarCheck = isAadhaarDocument(rawText);
      
      if (!aadhaarCheck.isAadhaar) {
        setDocumentValidation({
          status: 'invalid',
          ocrText: rawText,
          validationResults: {
            documentType: {
              found: false,
              confidence: aadhaarCheck.confidence,
              message: 'Document does not appear to be an Aadhaar card',
              status: 'error'
            }
          }
        });
        toast({
          title: 'Invalid Document',
          description: 'Please upload a clear image of your Aadhaar card.',
          variant: 'destructive',
        });
        return;
      }

      // Validate individual fields
      const validationResults: ValidationResult['validationResults'] = {};

      // Name validation
      const nameResult = findNameInText(data.name, rawText);
      validationResults.name = {
        found: nameResult.found,
        confidence: nameResult.confidence,
        message: nameResult.found 
          ? `Name found with ${Math.round(nameResult.confidence * 100)}% confidence`
          : 'Name not found in document. Please ensure the document is clear and matches your input.',
        status: nameResult.found 
          ? (nameResult.confidence >= 0.8 ? 'success' : 'warning')
          : 'error'
      };

      // Aadhaar number validation
      const aadhaarResult = findAadhaarInText(data.idNumber, rawText);
      validationResults.idNumber = {
        found: aadhaarResult.found,
        confidence: aadhaarResult.confidence,
        message: aadhaarResult.found 
          ? `Aadhaar number verified with ${Math.round(aadhaarResult.confidence * 100)}% confidence`
          : 'Aadhaar number not found. Please check if the document is clear and complete.',
        status: aadhaarResult.found 
          ? (aadhaarResult.confidence >= 0.9 ? 'success' : 'warning')
          : 'error'
      };

      // Date of birth validation
      const dobResult = findDateInText(data.dateOfBirth, rawText);
      validationResults.dateOfBirth = {
        found: dobResult.found,
        confidence: dobResult.confidence,
        message: dobResult.found 
          ? `Date of birth found with ${Math.round(dobResult.confidence * 100)}% confidence`
          : 'Date of birth not clearly visible. This might be due to document quality or format.',
        status: dobResult.found 
          ? (dobResult.confidence >= 0.7 ? 'success' : 'warning')
          : 'warning' // DOB is often hard to extract, so we make it a warning
      };

      // Phone number validation
      const phoneResult = findPhoneInText(data.emergencyContact, rawText);
      validationResults.phone = {
        found: phoneResult.found,
        confidence: phoneResult.confidence,
        message: phoneResult.found 
          ? `Phone number found with ${Math.round(phoneResult.confidence * 100)}% confidence`
          : 'Phone number not visible in document. This is optional and doesn\'t affect verification.',
        status: phoneResult.found 
          ? 'success' 
          : 'warning' // Phone is often not visible on Aadhaar, so warning only
      };

      // Determine overall status
      const criticalFields = ['name', 'idNumber'];
      const criticalErrors = criticalFields.some(field => 
        validationResults[field] && validationResults[field].status === 'error'
      );

      const hasWarnings = Object.values(validationResults).some(result => 
        result.status === 'warning'
      );

      let overallStatus: ValidationResult['status'];
      if (criticalErrors) {
        overallStatus = 'invalid';
      } else if (hasWarnings) {
        overallStatus = 'warning';
      } else {
        overallStatus = 'valid';
      }

      setDocumentValidation({
        status: overallStatus,
        extractedData: {
          name: nameResult.extractedName,
          idNumber: aadhaarResult.extractedAadhaar,
          dateOfBirth: dobResult.extractedDate,
          phone: phoneResult.extractedPhone,
        },
        validationResults,
        ocrText: rawText
      });

      // Show appropriate toast
      if (overallStatus === 'valid') {
        toast({
          title: 'Document Verified Successfully',
          description: 'All required information has been validated.',
        });
      } else if (overallStatus === 'warning') {
        toast({
          title: 'Document Verified with Warnings',
          description: 'Core information verified. Some optional fields may need attention.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Document Validation Failed',
          description: 'Critical information could not be verified. Please upload a clearer image.',
          variant: 'destructive',
        });
      }

    } catch (err) {
      console.error('OCR error:', err);
      setDocumentValidation({
        status: 'invalid',
        validationResults: {
          ocr: {
            found: false,
            confidence: 0,
            message: 'Unable to process document. Please try a clearer image.',
            status: 'error'
          }
        }
      });
      toast({
        title: 'Processing Error',
        description: 'Unable to read document. Please upload a clearer image.',
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = (type: 'photo' | 'idDocument') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: `Please upload a valid image file for your ${type === 'photo' ? 'photo' : 'Aadhaar card'}.`,
          variant: "destructive"
        });
        return;
      }

      onUpdate({ [type]: file });

      if (type === 'idDocument') {
        validateDocumentData(file);
        toast({
          title: "Document Uploaded",
          description: "Processing document for validation...",
        });
      } else {
        toast({
          title: "Photo Uploaded",
          description: "Photo uploaded successfully.",
        });
      }
    }
  };

  const retryValidation = () => {
    if (data.idDocument) {
      validateDocumentData(data.idDocument);
    }
  };

  const canProceed = data.photo && data.idDocument && 
    (documentValidation.status === 'valid' || documentValidation.status === 'warning');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: ValidationResult['status']) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-success text-success-foreground">Verified</Badge>;
      case 'warning':
        return <Badge className="bg-warning text-warning-foreground">Verified with Warnings</Badge>;
      case 'invalid':
        return <Badge variant="destructive">Validation Failed</Badge>;
      case 'validating':
        return <Badge variant="outline" className="animate-pulse">Validating...</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5 text-primary" />
          <span>Document Upload</span>
        </CardTitle>
        <CardDescription>
          Upload a clear photo of yourself and your Aadhaar card for verification
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Photo Upload */}
          <div className="space-y-3">
            <Label className="flex items-center space-x-2">
              <Camera className="h-4 w-4" />
              <span>Personal Photo</span>
            </Label>
            <div className={cn(
              "relative rounded-lg border-2 border-dashed p-6 text-center transition-smooth",
              data.photo
                ? "border-success bg-success/5 text-success-foreground"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5"
            )}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload('photo')}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              {data.photo ? (
                <div className="flex flex-col items-center space-y-2">
                  <CheckCircle className="h-8 w-8 text-success" />
                  <p className="text-sm font-medium">Photo Uploaded</p>
                  <p className="text-xs text-muted-foreground">{data.photo.name}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Upload Photo</p>
                  <p className="text-xs text-muted-foreground">Click to select image</p>
                </div>
              )}
            </div>
          </div>

          {/* ID Document Upload */}
          <div className="space-y-3">
            <Label className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Aadhaar Card</span>
            </Label>
            <div className={cn(
              "relative rounded-lg border-2 border-dashed p-6 text-center transition-smooth",
              data.idDocument
                ? documentValidation.status === 'valid' 
                  ? "border-success bg-success/5"
                  : documentValidation.status === 'warning'
                  ? "border-warning bg-warning/5"
                  : documentValidation.status === 'invalid'
                  ? "border-destructive bg-destructive/5"
                  : "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5"
            )}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload('idDocument')}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              {data.idDocument ? (
                <div className="flex flex-col items-center space-y-2">
                  {documentValidation.status === 'validating' ? (
                    <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                  ) : documentValidation.status === 'valid' ? (
                    <CheckCircle className="h-8 w-8 text-success" />
                  ) : documentValidation.status === 'warning' ? (
                    <AlertCircle className="h-8 w-8 text-warning" />
                  ) : documentValidation.status === 'invalid' ? (
                    <XCircle className="h-8 w-8 text-destructive" />
                  ) : (
                    <FileText className="h-8 w-8 text-primary" />
                  )}
                  <p className="text-sm font-medium">Aadhaar Card Uploaded</p>
                  <p className="text-xs text-muted-foreground">{data.idDocument.name}</p>
                  {getStatusBadge(documentValidation.status)}
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Upload Aadhaar Card</p>
                  <p className="text-xs text-muted-foreground">Click to select image</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Validation Progress */}
        {documentValidation.status === 'validating' && documentValidation.progress !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing document...</span>
              <span>{documentValidation.progress}%</span>
            </div>
            <Progress value={documentValidation.progress} className="w-full" />
          </div>
        )}

        {/* Validation Results */}
        {documentValidation.validationResults && (
          <div className="space-y-4 rounded-lg border p-4 bg-gradient-card">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>Validation Results</span>
              </h3>
              {documentValidation.status === 'invalid' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retryValidation}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Retry</span>
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {Object.entries(documentValidation.validationResults).map(([field, result]) => (
                <div key={field} className="flex items-start space-x-3 p-3 rounded-lg bg-background/50">
                  {getStatusIcon(result.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium capitalize">
                        {field === 'idNumber' ? 'Aadhaar Number' : field.replace(/([A-Z])/g, ' $1')}
                      </p>
                      <Badge 
                        variant={result.status === 'success' ? 'default' : result.status === 'warning' ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {Math.round(result.confidence * 100)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{result.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {(documentValidation.status === 'invalid' || documentValidation.status === 'warning') && (
              <Alert className={documentValidation.status === 'invalid' ? 'border-destructive' : 'border-warning'}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {documentValidation.status === 'invalid' 
                    ? "Some critical information could not be verified. Please ensure your document is clear, well-lit, and completely visible."
                    : "Core information has been verified successfully. Some optional fields may need attention, but you can proceed with the application."
                  }
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button 
            onClick={onNext}
            disabled={!canProceed}
            className={cn(
              "transition-smooth",
              canProceed 
                ? "bg-gradient-primary hover:opacity-90 shadow-glow" 
                : "opacity-50 cursor-not-allowed"
            )}
            size="lg"
          >
            Continue to Review
          </Button>
        </div>
      </CardContent>
    </>
  );
};