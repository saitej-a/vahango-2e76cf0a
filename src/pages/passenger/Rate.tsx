import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";

const FEEDBACK_CATEGORIES = [
  "Cleanliness",
  "Professional Behavior",
  "Safe Driving",
  "On Time",
  "Friendly",
  "Navigation Skills",
];

const Rate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { rideId } = location.state || {};
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    try {
      setLoading(true);
      const { user } = await getCurrentUser();

      // Get ride details to find driver
      const { data: ride } = await supabase
        .from('rides')
        .select('driver_id, passenger_id')
        .eq('id', rideId)
        .single();

      if (!ride) throw new Error('Ride not found');

      // Get driver's user_id
      const { data: driver } = await supabase
        .from('drivers')
        .select('user_id')
        .eq('id', ride.driver_id)
        .single();

      // Submit rating
      const { error } = await supabase
        .from('ratings')
        .insert({
          ride_id: rideId,
          rated_by: user!.id,
          rated_user: driver!.user_id,
          rating,
          comment,
          feedback_categories: selectedCategories,
        });

      if (error) throw error;

      toast.success("Thank you for your feedback!");
      navigate("/passenger/home");
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      toast.error("Failed to submit rating");
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-primary text-white p-6">
        <h1 className="text-2xl font-bold">Rate Your Ride</h1>
        <p className="text-white/90 mt-1">How was your experience?</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Star Rating */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-center mb-4">
            Rate the Driver
          </h2>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-12 h-12 ${
                    star <= (hoveredRating || rating)
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center mt-4 text-muted-foreground">
              {rating === 5 && "Excellent!"}
              {rating === 4 && "Great!"}
              {rating === 3 && "Good"}
              {rating === 2 && "Could be better"}
              {rating === 1 && "Poor"}
            </p>
          )}
        </Card>

        {/* Feedback Categories */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">What went well?</h2>
          <div className="grid grid-cols-2 gap-2">
            {FEEDBACK_CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={selectedCategories.includes(category) ? "default" : "outline"}
                onClick={() => toggleCategory(category)}
                className="h-auto py-3"
              >
                {category}
              </Button>
            ))}
          </div>
        </Card>

        {/* Comment */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Additional Comments</h2>
          <Textarea
            placeholder="Share more details about your ride (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px]"
          />
        </Card>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={loading || rating === 0}
          className="w-full h-12 bg-gradient-primary"
        >
          {loading ? "Submitting..." : "Submit Rating"}
        </Button>

        {/* Skip Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/passenger/home")}
          className="w-full"
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
};

export default Rate;
