import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Shield, FileText, Upload, Clock, ExternalLink } from "lucide-react";
import { PersonalInfoForm } from "./kyc/PersonalInfoForm";
import { DocumentUpload } from "./kyc/DocumentUpload";
import { ReviewSubmission } from "./kyc/ReviewSubmission";
import { DigitalIDCard } from "./kyc/DigitalIDCard";
import { cn } from "@/lib/utils";

interface KYCData {
  name: string;
  dateOfBirth: string;
  idNumber: string;
  emergencyContact: string;
  photo: File | null;
  idDocument: File | null;
  tripDetails?: {
    startDate: string;
    endDate: string;
    location: string;
  };
}

type KYCStep = 'personal' | 'documents' | 'review' | 'processing' | 'complete';

const steps = [
  { id: 'personal', title: 'Personal Information', icon: FileText },
  { id: 'documents', title: 'Document Upload', icon: Upload },
  { id: 'review', title: 'Review & Submit', icon: CheckCircle },
  { id: 'processing', title: 'Processing', icon: Clock },
  { id: 'complete', title: 'Digital ID Issued', icon: Shield },
];

export const KYCVerification = () => {
  const [currentStep, setCurrentStep] = useState<KYCStep>('personal');
  const [kycData, setKycData] = useState<KYCData>({
    name: '',
    dateOfBirth: '',
    idNumber: '',
    emergencyContact: '',
    photo: null,
    idDocument: null,
    tripDetails: {
      startDate: '',
      endDate: '',
      location: ''
    },
  });
  
  const [digitalId, setDigitalId] = useState<{
    userHash: string;
    issuedAt: string;
    validUntil: string;
    transactionHash: string;
  } | null>(null);

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = () => {
    const stepOrder: KYCStep[] = ['personal', 'documents', 'review', 'processing', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      if (currentStep === 'review') {
        // Simulate processing
        setTimeout(() => {
          // Generate mock digital ID
          const mockDigitalId = {
            userHash: '0x' + Math.random().toString(16).substr(2, 64),
            issuedAt: new Date().toISOString(),
            validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
          };
          setDigitalId(mockDigitalId);
          setCurrentStep('complete');
        }, 3000);
        setCurrentStep('processing');
      } else {
        setCurrentStep(stepOrder[currentIndex + 1]);
      }
    }
  };

  const handleBack = () => {
    const stepOrder: KYCStep[] = ['personal', 'documents', 'review', 'processing', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const updateKycData = (data: Partial<KYCData>) => {
    setKycData(prev => ({ ...prev, ...data }));
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-foreground">Digital Identity Verification</h1>
          <p className="text-muted-foreground">Secure KYC verification with blockchain-based Digital ID</p>
        </div>

        {/* Progress Steps */}
        <Card className="mb-8 shadow-card">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Progress</span>
              <span className="text-sm font-medium text-primary">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="mb-6" />
            <div className="flex justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <div key={step.id} className="flex flex-col items-center space-y-2">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-smooth",
                        isCompleted && "border-success bg-success text-success-foreground",
                        isCurrent && "border-primary bg-primary text-primary-foreground shadow-glow",
                        !isCompleted && !isCurrent && "border-muted bg-background text-muted-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-center">
                      <p className={cn(
                        "text-xs font-medium",
                        (isCompleted || isCurrent) && "text-foreground",
                        !isCompleted && !isCurrent && "text-muted-foreground"
                      )}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card className="mb-8 shadow-elegant">
          {currentStep === 'personal' && (
            <PersonalInfoForm
              data={kycData}
              onUpdate={updateKycData}
              onNext={handleNext}
            />
          )}

          {currentStep === 'documents' && (
            <DocumentUpload
              data={kycData}
              onUpdate={updateKycData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 'review' && (
            <ReviewSubmission
              data={kycData}
              onUpdate={updateKycData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 'processing' && (
            <div className="p-8 text-center">
              <CardHeader>
                <CardTitle className="flex items-center justify-center space-x-2">
                  <Clock className="h-6 w-6 animate-spin text-primary" />
                  <span>Processing Your Verification</span>
                </CardTitle>
                <CardDescription>
                  Please wait while we verify your information and issue your Digital ID on the blockchain
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Badge variant="outline" className="animate-pulse">
                      Validating KYC Data
                    </Badge>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <Badge variant="outline" className="animate-pulse">
                      Generating Blockchain Transaction
                    </Badge>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <Badge variant="outline" className="animate-pulse">
                      Creating Digital ID
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </div>
          )}

          {currentStep === 'complete' && digitalId && (
            <DigitalIDCard data={kycData} digitalId={digitalId} />
          )}
        </Card>
      </div>
    </div>
  );
};