import { useState } from "react";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Calendar, CreditCard, Phone, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface PersonalInfoFormProps {
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
}

export const PersonalInfoForm = ({ data, onUpdate, onNext }: PersonalInfoFormProps) => {
  const [formData, setFormData] = useState({
    name: data.name || '',
    dateOfBirth: data.dateOfBirth || '',
    idNumber: data.idNumber || '',
    emergencyContact: data.emergencyContact || '',
    tripDetails: {
      startDate: data.tripDetails?.startDate || '',
      endDate: data.tripDetails?.endDate || '',
      location: data.tripDetails?.location || '',
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 18 || age > 100) {
        newErrors.dateOfBirth = "Age must be between 18 and 100 years";
      }
    }

    if (!formData.idNumber.trim()) {
      newErrors.idNumber = "Aadhaar number is required";
    } else if (!/^\d{12}$/.test(formData.idNumber.replace(/\s/g, ''))) {
      newErrors.idNumber = "Aadhaar number must be 12 digits";
    }

    if (!formData.emergencyContact.trim()) {
      newErrors.emergencyContact = "Emergency contact is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.emergencyContact.replace(/\s/g, ''))) {
      newErrors.emergencyContact = "Please enter a valid 10-digit mobile number";
    }

    if (!formData.tripDetails.location.trim()) {
      newErrors.location = "Travel destination is required";
    }

    if (!formData.tripDetails.startDate) {
      newErrors.startDate = "Travel start date is required";
    }

    if (!formData.tripDetails.endDate) {
      newErrors.endDate = "Travel end date is required";
    } else if (new Date(formData.tripDetails.endDate) <= new Date(formData.tripDetails.startDate)) {
      newErrors.endDate = "End date must be after start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as object,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatAadhaarNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3').trim();
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.length <= 10 ? digits : digits.slice(0, 10);
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Format data before updating
      const formattedData = {
        ...formData,
        idNumber: formData.idNumber.replace(/\s/g, ''),
        emergencyContact: formData.emergencyContact.replace(/\s/g, ''),
      };
      
      onUpdate(formattedData);
      onNext();
      
      toast({
        title: "Information Saved",
        description: "Personal information has been validated and saved.",
      });
    } else {
      toast({
        title: "Validation Error",
        description: "Please correct the highlighted fields.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5 text-primary" />
          <span>Personal Information</span>
        </CardTitle>
        <CardDescription>
          Please provide your personal details for identity verification
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Personal Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Full Name (as on Aadhaar)</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter your full name"
                className={cn(
                  "transition-smooth",
                  errors.name && "border-destructive focus:ring-destructive"
                )}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Date of Birth</span>
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                className={cn(
                  "transition-smooth",
                  errors.dateOfBirth && "border-destructive focus:ring-destructive"
                )}
              />
              {errors.dateOfBirth && (
                <p className="text-sm text-destructive">{errors.dateOfBirth}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="idNumber" className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4" />
                <span>Aadhaar Number</span>
              </Label>
              <Input
                id="idNumber"
                value={formatAadhaarNumber(formData.idNumber)}
                onChange={(e) => handleChange('idNumber', e.target.value.replace(/\s/g, ''))}
                placeholder="1234 5678 9012"
                maxLength={14}
                className={cn(
                  "transition-smooth font-mono",
                  errors.idNumber && "border-destructive focus:ring-destructive"
                )}
              />
              {errors.idNumber && (
                <p className="text-sm text-destructive">{errors.idNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContact" className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>Mobile Number</span>
              </Label>
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => handleChange('emergencyContact', formatPhoneNumber(e.target.value))}
                placeholder="9876543210"
                maxLength={10}
                className={cn(
                  "transition-smooth font-mono",
                  errors.emergencyContact && "border-destructive focus:ring-destructive"
                )}
              />
              {errors.emergencyContact && (
                <p className="text-sm text-destructive">{errors.emergencyContact}</p>
              )}
            </div>
          </div>
        </div>

        {/* Travel Details */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-semibold text-foreground">Travel Information</h3>
          
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Destination</span>
            </Label>
            <Input
              id="location"
              value={formData.tripDetails.location}
              onChange={(e) => handleChange('tripDetails.location', e.target.value)}
              placeholder="Enter travel destination"
              className={cn(
                "transition-smooth",
                errors.location && "border-destructive focus:ring-destructive"
              )}
            />
            {errors.location && (
              <p className="text-sm text-destructive">{errors.location}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Start Date</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.tripDetails.startDate}
                onChange={(e) => handleChange('tripDetails.startDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={cn(
                  "transition-smooth",
                  errors.startDate && "border-destructive focus:ring-destructive"
                )}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>End Date</span>
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.tripDetails.endDate}
                onChange={(e) => handleChange('tripDetails.endDate', e.target.value)}
                min={formData.tripDetails.startDate || new Date().toISOString().split('T')[0]}
                className={cn(
                  "transition-smooth",
                  errors.endDate && "border-destructive focus:ring-destructive"
                )}
              />
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <Button 
            onClick={handleSubmit}
            className="bg-gradient-primary hover:opacity-90 transition-smooth shadow-glow"
            size="lg"
          >
            Continue to Document Upload
          </Button>
        </div>
      </CardContent>
    </>
  );
};