import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";

const DriverRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    licenseNumber: "",
    licenseExpiry: "",
    aadharNumber: "",
    bankAccount: "",
    bankIfsc: "",
    vehicleType: "auto" as "bike" | "auto" | "car",
    vehicleModel: "",
    vehicleYear: "",
    vehicleColor: "",
    registrationNumber: "",
    insuranceExpiry: "",
    capacity: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const { user } = await getCurrentUser();
      
      if (!user) {
        toast.error("Please login to continue");
        navigate("/login");
        return;
      }

      // Create driver profile
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .insert({
          user_id: user.id,
          license_number: formData.licenseNumber,
          license_expiry: formData.licenseExpiry,
          aadhar_number: formData.aadharNumber,
          bank_account: formData.bankAccount,
          bank_ifsc: formData.bankIfsc,
          status: 'pending',
        })
        .select()
        .single();

      if (driverError) throw driverError;

      // Create vehicle
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .insert({
          driver_id: driver.id,
          vehicle_type: formData.vehicleType,
          model: formData.vehicleModel,
          year: parseInt(formData.vehicleYear),
          color: formData.vehicleColor,
          registration_number: formData.registrationNumber,
          insurance_expiry: formData.insuranceExpiry,
          capacity: formData.capacity,
          is_active: true,
        });

      if (vehicleError) throw vehicleError;

      toast.success("Registration submitted! Awaiting verification.");
      navigate("/driver/home");
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || "Failed to submit registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-primary text-white p-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold">Driver Registration</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Personal Documents */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Personal Documents</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="license">Driving License Number</Label>
              <Input
                id="license"
                required
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                placeholder="DL-1234567890"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="licenseExpiry">License Expiry Date</Label>
              <Input
                id="licenseExpiry"
                type="date"
                required
                value={formData.licenseExpiry}
                onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="aadhar">Aadhar Number</Label>
              <Input
                id="aadhar"
                required
                value={formData.aadharNumber}
                onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })}
                placeholder="1234 5678 9012"
                maxLength={12}
                className="mt-2"
              />
            </div>
          </div>
        </Card>

        {/* Bank Details */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Bank Details</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="bankAccount">Account Number</Label>
              <Input
                id="bankAccount"
                required
                value={formData.bankAccount}
                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                placeholder="1234567890"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="ifsc">IFSC Code</Label>
              <Input
                id="ifsc"
                required
                value={formData.bankIfsc}
                onChange={(e) => setFormData({ ...formData, bankIfsc: e.target.value })}
                placeholder="SBIN0001234"
                className="mt-2"
              />
            </div>
          </div>
        </Card>

        {/* Vehicle Details */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Vehicle Information</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="vehicleType">Vehicle Type</Label>
              <Select
                value={formData.vehicleType}
                onValueChange={(value: "bike" | "auto" | "car") => 
                  setFormData({ 
                    ...formData, 
                    vehicleType: value,
                    capacity: value === 'bike' ? 1 : value === 'auto' ? 3 : 4
                  })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bike">Bike</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="car">Car</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  required
                  value={formData.vehicleModel}
                  onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                  placeholder="Honda Activa"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  required
                  value={formData.vehicleYear}
                  onChange={(e) => setFormData({ ...formData, vehicleYear: e.target.value })}
                  placeholder="2023"
                  min="2000"
                  max={new Date().getFullYear()}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                required
                value={formData.vehicleColor}
                onChange={(e) => setFormData({ ...formData, vehicleColor: e.target.value })}
                placeholder="Black"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="registration">Registration Number</Label>
              <Input
                id="registration"
                required
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value.toUpperCase() })}
                placeholder="KA01AB1234"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="insurance">Insurance Expiry</Label>
              <Input
                id="insurance"
                type="date"
                required
                value={formData.insuranceExpiry}
                onChange={(e) => setFormData({ ...formData, insuranceExpiry: e.target.value })}
                className="mt-2"
              />
            </div>
          </div>
        </Card>

        {/* Submit */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-gradient-primary"
        >
          {loading ? "Submitting..." : "Submit for Verification"}
        </Button>
      </form>
    </div>
  );
};

export default DriverRegister;
