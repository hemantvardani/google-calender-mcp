"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter, redirect } from "next/navigation";
import { useApiKey } from "@/contexts/ApiKeyContext";
import { checkCalenderConnectionStatus } from "@/lib/calender";

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
  const router = useRouter();
  const type: "future" | "past" = (searchParams.get("type") || "future") as "future" | "past";
  const { apiKey } = useApiKey();
  const [numBookings, setNumBookings] = useState<number>(5);
  const [bookings, setBookings] = useState<Booking[]| null>(null);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check connection status on mount
  useEffect(() => {
    // Check for OAuth callback success/error
    const connected = searchParams.get('connected');
    const errorParam = searchParams.get('error');
    if (connected === 'true') {
      setError(null);
      // Clean URL
      router.replace('/fixed?type=' + type);
    }
    if (errorParam || connected == 'false') {
      redirect("/")
    }
  }, [searchParams, router, type]);

  const handleFetch = async () => {
    setBookings([]);
 
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/bookings?type=${type}&limit=${numBookings}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch bookings');
      }
      
      setBookings(data.bookings || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const heading = type === "future" ? "Upcoming Bookings" : "Past Bookings";

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-center">{heading}</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
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
          disabled={loading }
        >
          {loading ? "Loading..." : "Fetch"}
        </Button>
      </div>

      {bookings && bookings.length > 0 && (
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

      {bookings && bookings.length === 0 && !loading && (
        <div className="text-center text-gray-500 mt-8">
          No bookings found.
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
