import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(30);

  const handleVerify = () => {
    if (otp.length !== 6) {
      toast.error("Please enter the complete OTP");
      return;
    }
    // TODO: Implement OTP verification
    toast.success("Phone verified successfully!");
    navigate("/passenger/home");
  };

  const handleResend = () => {
    setCountdown(30);
    toast.success("OTP resent to your phone");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-gradient-primary text-white p-6">
        <div className="flex items-center gap-2">
          <Car className="w-8 h-8" />
          <h1 className="text-2xl font-bold">VahanGo</h1>
        </div>
      </div>

      {/* OTP Verification */}
      <div className="flex-1 px-6 py-12 flex items-center">
        <div className="max-w-md mx-auto text-center w-full">
          <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>

          <h2 className="text-3xl font-bold mb-2">Verify Phone Number</h2>
          <p className="text-muted-foreground mb-8">
            We've sent a 6-digit code to<br />
            <span className="font-semibold text-foreground">+91 98765 43210</span>
          </p>

          {/* OTP Input */}
          <div className="mb-8 flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => setOtp(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="h-14 w-12 text-lg" />
                <InputOTPSlot index={1} className="h-14 w-12 text-lg" />
                <InputOTPSlot index={2} className="h-14 w-12 text-lg" />
                <InputOTPSlot index={3} className="h-14 w-12 text-lg" />
                <InputOTPSlot index={4} className="h-14 w-12 text-lg" />
                <InputOTPSlot index={5} className="h-14 w-12 text-lg" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {/* Verify Button */}
          <Button
            onClick={handleVerify}
            className="w-full h-12 text-lg font-semibold bg-gradient-primary mb-4"
          >
            Verify OTP
          </Button>

          {/* Resend OTP */}
          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-muted-foreground">
                Resend code in <span className="font-semibold text-primary">{countdown}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="text-primary font-semibold hover:underline"
              >
                Resend OTP
              </button>
            )}
          </div>

          {/* Change Number */}
          <button
            onClick={() => navigate("/signup")}
            className="text-sm text-muted-foreground hover:text-foreground mt-4"
          >
            Change phone number
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
