import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Download, ExternalLink, QrCode, Calendar, CreditCard, MapPin, CheckCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface DigitalIDCardProps {
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
  digitalId: {
    userHash: string;
    issuedAt: string;
    validUntil: string;
    transactionHash: string;
  };
}

export const DigitalIDCard = ({ data, digitalId }: DigitalIDCardProps) => {
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatAadhaarNumber = (aadhaar: string) => {
    return aadhaar.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
  };

  const handleDownload = () => {
    toast({
      title: "Download Started",
      description: "Your Digital ID card is being prepared for download.",
    });
    // In a real implementation, this would generate and download a PDF or image
  };

  const handleViewOnBlockchain = () => {
    toast({
      title: "Opening Blockchain Explorer",
      description: "Redirecting to view your transaction on the blockchain.",
    });
    // In a real implementation, this would open a blockchain explorer
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: `${label} has been copied to your clipboard.`,
    });
  };

  return (
    <>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary shadow-glow animate-pulse">
              <Shield className="h-10 w-10 text-primary-foreground" />
            </div>
            <div className="absolute -top-1 -right-1">
              <CheckCircle className="h-6 w-6 text-success bg-background rounded-full" />
            </div>
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-foreground flex items-center justify-center space-x-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span>Digital ID Issued Successfully!</span>
        </CardTitle>
        <CardDescription className="text-base">
          Your blockchain-based Digital Identity has been created and is ready for use
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Success Alert */}
        <Alert className="border-success bg-success/5">
          <CheckCircle className="h-4 w-4 text-success" />
          <AlertDescription>
            <strong>Verification Complete!</strong> Your identity has been successfully verified and your Digital ID has been issued on the blockchain.
          </AlertDescription>
        </Alert>

        {/* Digital ID Card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-primary p-6 text-primary-foreground shadow-elegant">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white"></div>
            <div className="absolute -left-16 -bottom-16 h-32 w-32 rounded-full bg-white"></div>
          </div>
          
          {/* Card Content */}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Digital Travel ID</h3>
                <p className="text-sm opacity-90">Blockchain Verified</p>
              </div>
              <div className="text-right">
                <QrCode className="h-8 w-8 opacity-80" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm opacity-75">Full Name</p>
                <p className="text-xl font-bold">{data.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm opacity-75">Date of Birth</p>
                  <p className="font-semibold">{formatDate(data.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-sm opacity-75">Valid Until</p>
                  <p className="font-semibold">{formatDate(digitalId.validUntil)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm opacity-75">ID Number</p>
                <p className="font-mono font-semibold tracking-wider">
                  {formatAadhaarNumber(data.idNumber)}
                </p>
              </div>

              {data.tripDetails && (
                <div>
                  <p className="text-sm opacity-75">Travel Destination</p>
                  <p className="font-semibold">{data.tripDetails.location}</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/20">
              <p className="text-xs opacity-75">Digital ID Hash</p>
              <p className="font-mono text-sm break-all">{digitalId.userHash.slice(0, 32)}...</p>
            </div>
          </div>
        </div>

        {/* Trip Information */}
        {data.tripDetails && (
          <div className="p-4 rounded-lg bg-gradient-card border">
            <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2 mb-4">
              <MapPin className="h-5 w-5 text-primary" />
              <span>Travel Information</span>
            </h3>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-3 rounded-lg bg-background/50">
                <MapPin className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Destination</p>
                <p className="font-semibold">{data.tripDetails.location}</p>
              </div>
              
              <div className="text-center p-3 rounded-lg bg-background/50">
                <Calendar className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-semibold">{formatDate(data.tripDetails.startDate)}</p>
              </div>
              
              <div className="text-center p-3 rounded-lg bg-background/50">
                <Calendar className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="font-semibold">{formatDate(data.tripDetails.endDate)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Blockchain Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Blockchain Details</span>
          </h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-gradient-card border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Digital ID Hash</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(digitalId.userHash, 'Digital ID Hash')}
                  className="h-6 w-6 p-0"
                >
                  <CreditCard className="h-3 w-3" />
                </Button>
              </div>
              <p className="font-mono text-sm break-all text-foreground">{digitalId.userHash}</p>
            </div>

            <div className="p-4 rounded-lg bg-gradient-card border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Transaction Hash</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(digitalId.transactionHash, 'Transaction Hash')}
                  className="h-6 w-6 p-0"
                >
                  <CreditCard className="h-3 w-3" />
                </Button>
              </div>
              <p className="font-mono text-sm break-all text-foreground">{digitalId.transactionHash}</p>
            </div>

            <div className="p-4 rounded-lg bg-gradient-card border">
              <span className="text-sm font-medium text-muted-foreground">Issued At</span>
              <p className="text-sm text-foreground mt-1">{formatDate(digitalId.issuedAt)}</p>
            </div>

            <div className="p-4 rounded-lg bg-gradient-card border">
              <span className="text-sm font-medium text-muted-foreground">Valid Until</span>
              <p className="text-sm text-foreground mt-1">{formatDate(digitalId.validUntil)}</p>
              <Badge className="mt-2 bg-success text-success-foreground">Active</Badge>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6">
          <Button
            onClick={handleDownload}
            className="flex-1 bg-gradient-primary hover:opacity-90 transition-smooth shadow-glow"
            size="lg"
          >
            <Download className="h-5 w-5 mr-2" />
            Download Digital ID
          </Button>
          
          <Button
            variant="outline"
            onClick={handleViewOnBlockchain}
            className="flex-1 transition-smooth"
            size="lg"
          >
            <ExternalLink className="h-5 w-5 mr-2" />
            View on Blockchain
          </Button>
        </div>

        {/* Footer Note */}
        <Alert className="border-accent bg-accent/5">
          <Shield className="h-4 w-4 text-accent" />
          <AlertDescription>
            <strong>Important:</strong> Your Digital ID is now active and can be used for secure identity verification. 
            Keep your Digital ID hash safe as it serves as your unique blockchain-based identity.
          </AlertDescription>
        </Alert>
      </CardContent>
    </>
  );
};