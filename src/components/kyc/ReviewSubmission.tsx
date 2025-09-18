import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, User, CreditCard, Calendar, Phone, MapPin, Clock, FileText, Camera, Shield, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface ReviewSubmissionProps {
  data: {
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
  };
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export const ReviewSubmission = ({ data, onUpdate, onNext, onBack }: ReviewSubmissionProps) => {
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not provided';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatAadhaarNumber = (aadhaar: string) => {
    if (!aadhaar) return 'Not provided';
    return aadhaar.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return 'Not provided';
    return phone.replace(/(\d{5})(\d{5})/, '$1 $2');
  };

  const handleSubmit = () => {
    // Validate all required fields are present
    const requiredFields = ['name', 'dateOfBirth', 'idNumber', 'emergencyContact', 'photo', 'idDocument'];
    const missingFields = requiredFields.filter(field => !data[field as keyof typeof data]);

    if (missingFields.length > 0) {
      toast({
        title: "Missing Information",
        description: `Please complete: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    // Show confirmation
    toast({
      title: "Submitting Application",
      description: "Your KYC verification is being processed...",
    });

    onNext();
  };

  const isComplete = data.name && data.dateOfBirth && data.idNumber && 
                   data.emergencyContact && data.photo && data.idDocument &&
                   data.tripDetails?.location && data.tripDetails?.startDate && 
                   data.tripDetails?.endDate;

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          <span>Review & Submit</span>
        </CardTitle>
        <CardDescription>
          Please review your information before submitting for verification
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Completion Status */}
        <Alert className={isComplete ? "border-success bg-success/5" : "border-warning bg-warning/5"}>
          {isComplete ? (
            <CheckCircle className="h-4 w-4 text-success" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-warning" />
          )}
          <AlertDescription>
            {isComplete 
              ? "All required information has been provided. Ready for submission!"
              : "Please ensure all required fields are completed before submitting."
            }
          </AlertDescription>
        </Alert>

        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
            <User className="h-5 w-5 text-primary" />
            <span>Personal Information</span>
          </h3>
          
          <div className="grid gap-4 md:grid-cols-2 p-4 rounded-lg bg-gradient-card border">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Full Name</span>
              </div>
              <p className="text-base font-medium">{data.name || 'Not provided'}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Date of Birth</span>
              </div>
              <p className="text-base font-medium">{formatDate(data.dateOfBirth)}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Aadhaar Number</span>
              </div>
              <p className="text-base font-medium font-mono">{formatAadhaarNumber(data.idNumber)}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Mobile Number</span>
              </div>
              <p className="text-base font-medium font-mono">{formatPhoneNumber(data.emergencyContact)}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Travel Information */}
        {data.tripDetails && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span>Travel Information</span>
            </h3>
            
            <div className="grid gap-4 md:grid-cols-3 p-4 rounded-lg bg-gradient-card border">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Destination</span>
                </div>
                <p className="text-base font-medium">{data.tripDetails.location || 'Not provided'}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Start Date</span>
                </div>
                <p className="text-base font-medium">{formatDate(data.tripDetails.startDate)}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">End Date</span>
                </div>
                <p className="text-base font-medium">{formatDate(data.tripDetails.endDate)}</p>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Uploaded Documents */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>Uploaded Documents</span>
          </h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            {/* Personal Photo */}
            <div className="p-4 rounded-lg bg-gradient-card border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Personal Photo</span>
                </div>
                {data.photo ? (
                  <Badge className="bg-success text-success-foreground">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Uploaded
                  </Badge>
                ) : (
                  <Badge variant="destructive">Missing</Badge>
                )}
              </div>
              {data.photo && (
                <div className="space-y-1">
                  <p className="text-sm text-foreground">{data.photo.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(data.photo.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>

            {/* ID Document */}
            <div className="p-4 rounded-lg bg-gradient-card border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Aadhaar Card</span>
                </div>
                {data.idDocument ? (
                  <Badge className="bg-success text-success-foreground">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Uploaded & Verified
                  </Badge>
                ) : (
                  <Badge variant="destructive">Missing</Badge>
                )}
              </div>
              {data.idDocument && (
                <div className="space-y-1">
                  <p className="text-sm text-foreground">{data.idDocument.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(data.idDocument.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <Alert className="border-accent bg-accent/5">
          <Shield className="h-4 w-4 text-accent" />
          <AlertDescription>
            <strong>Privacy & Security:</strong> Your personal information and documents are encrypted and stored securely. 
            This data will only be used for identity verification and will be processed according to our privacy policy.
          </AlertDescription>
        </Alert>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={onBack}>
            Back to Documents
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!isComplete}
            className={cn(
              "transition-smooth",
              isComplete 
                ? "bg-gradient-primary hover:opacity-90 shadow-glow" 
                : "opacity-50 cursor-not-allowed"
            )}
            size="lg"
          >
            Submit for Verification
          </Button>
        </div>
      </CardContent>
    </>
  );
};