"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useApiKey } from "@/contexts/ApiKeyContext";

interface Booking {
  id: string;
  title: string;
  time: string;
  duration: string;
  attendees: string[];
  description?: string;
}

function FixedContent() {
  const searchParams = useSearchParams();
  const type: "future" | "past" = (searchParams.get("type") || "future") as "future" | "past";
  const { apiKey } = useApiKey(); // Get API key from context
  const [numBookings, setNumBookings] = useState<number>(5);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFetch = () => {
    if (!apiKey) {
      alert("Please enter your OpenAI API key in the header");
      return;
    }
    
    setLoading(true);
    
    
    setTimeout(() => {
      setBookings([
        {
          id: "1",
          title: "Team Meeting",
          time: "2024-01-15 10:00 AM",
          duration: "1 hour",
          attendees: ["John Doe", "Jane Smith"],
          description: "Weekly team sync"
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  const heading = type === "future" ? "Upcoming Bookings" : "Past Bookings";

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-center">{heading}</h1>
      
      <div className="flex w-full justify-center gap-5 mb-8">
        <Input 
          type="number" 
          placeholder="5" 
          className="w-40" 
          value={numBookings}
          onChange={(e) => setNumBookings(Number(e.target.value))}
          min="1"
          max="20"
        />
        <Button 
          variant="outline" 
          className="w-32" 
          onClick={handleFetch}
          disabled={loading}
        >
          {loading ? "Loading..." : "Fetch"}
        </Button>
      </div>

      {bookings.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Title</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Time</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Duration</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Attendees</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Description</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3">{booking.title}</td>
                  <td className="border border-gray-300 px-4 py-3">{booking.time}</td>
                  <td className="border border-gray-300 px-4 py-3">{booking.duration}</td>
                  <td className="border border-gray-300 px-4 py-3">
                    {booking.attendees.join(", ")}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    {booking.description || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {bookings.length === 0 && !loading && (
        <div className="text-center text-gray-500 mt-8">
          No bookings found. Click "Fetch" to load {numBookings} {type === "future" ? "upcoming" : "past"} bookings.
        </div>
      )}
    </div>
  );
}

export default function Fixed() {
  return (
    <Suspense fallback={<div className="container mx-auto p-8 text-center">Loading...</div>}>
      <FixedContent />
    </Suspense>
  );
}
