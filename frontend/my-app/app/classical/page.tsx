"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter, redirect } from "next/navigation";
import { useApiKey } from "@/contexts/ApiKeyContext";
import { checkCalenderConnectionStatus } from "@/lib/calender";
import { toast } from "sonner";
import ConnectButton from "@/components/ConnectButton";

interface Booking {
  id: string;
  title: string;
  time: string;
  duration: string;
  attendees: string[];
  description?: string;
  summary?: string;
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
  const [generatingSummary, setGeneratingSummary] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Check connection status on mount
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await checkCalenderConnectionStatus();
      setIsConnected(connected);
      if (!connected) {
        setError("Please connect your Google Calendar first.");
      }
    };
    checkConnection();
  }, []);

  // Check for OAuth callback success/error
  useEffect(() => {
    const connected = searchParams.get('connected');
    const errorParam = searchParams.get('error');
    if (connected === 'true') {
      setError(null);
      setIsConnected(true);
      // Clean URL
      router.replace('/classical?type=' + type);
    }
    if (errorParam || connected == 'false') {
      setIsConnected(false);
      setError("Failed to connect Google Calendar. Please try again.");
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

  const handleGenerateSummary = async (booking: Booking) => {
    // Check if API key is provided
    if (!apiKey || apiKey.trim() === '') {
      toast.error('OpenAI API key required', {
        description: 'Please provide your OpenAI API key in the header to generate summaries.',
      });
      return;
    }

    setGeneratingSummary(booking.id);
    
    try {
      const response = await fetch('/api/bookings/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking: {
            title: booking.title,
            attendees: booking.attendees,
            duration: booking.duration,
            description: booking.description,
          },
          apiKey: apiKey,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      // Update the booking with the summary
      setBookings((prev) => 
        prev?.map((b) => 
          b.id === booking.id ? { ...b, summary: data.summary } : b
        ) || null
      );

      toast.success('Summary generated successfully');
    } catch (err: any) {
      toast.error('Failed to generate summary', {
        description: err.message || 'An error occurred while generating the summary.',
      });
    } finally {
      setGeneratingSummary(null);
    }
  };

  const heading = type === "future" ? "Upcoming Bookings" : "Past Bookings";

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl w-full overflow-x-hidden">
      <h1 className="text-3xl font-bold mb-8 text-center">{heading}</h1>


      {!isConnected && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between gap-4">
          <p className="text-yellow-800 text-sm">
            ⚠️ Please connect your Google Calendar first to fetch bookings.
          </p>
          <ConnectButton />
        </div>
      )}
      
      <div className="flex w-full justify-center gap-5 mb-8">
        <InputGroup className="w-40">
          <InputGroupInput
            type="number"
            placeholder="5"
            value={numBookings}
            onChange={(e) => setNumBookings(Number(e.target.value))}
            min="1"
            max="20"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <InputGroupAddon>
                <InputGroupButton
                  variant="ghost"
                  aria-label="Help"
                  size="icon-xs"
                >
                  <HelpCircle />
                </InputGroupButton>
              </InputGroupAddon>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Enter the number of bookings you want to fetch (1-20)</p>
            </TooltipContent>
          </Tooltip>
        </InputGroup>
        <Button 
          variant="outline" 
          className="w-32" 
          onClick={handleFetch}
          disabled={loading || !isConnected}
        >
          {loading ? "Loading..." : "Fetch"}
        </Button>
      </div>

          {bookings && bookings.length > 0 && (
            <div className="overflow-x-auto w-full">
              <table className="w-full border-collapse border border-gray-300 min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Title</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Time</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Duration</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Attendees</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Description</th>
                {type === 'past' && (
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">AI Summary</th>
                )}
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3">{booking.title}</td>
                  <td className="border border-gray-300 px-4 py-3">{booking.time}</td>
                  <td className="border border-gray-300 px-4 py-3">{booking.duration}</td>
                      <td className="border border-gray-300 px-4 py-3 max-w-xs break-words">
                        <div className="text-sm">
                          {booking.attendees.join(", ")}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-3 max-w-xs break-words">
                        <div className="text-sm truncate" title={booking.description || "-"}>
                          {booking.description || "-"}
                        </div>
                      </td>
                      {type === 'past' && (
                        <td className="border border-gray-300 px-4 py-3 max-w-md">
                          {booking.summary ? (
                            <div className="text-sm text-gray-700 break-words">
                              {booking.summary}
                            </div>
                          ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateSummary(booking)}
                          disabled={generatingSummary === booking.id}
                          className="text-xs"
                        >
                          {generatingSummary === booking.id ? 'Generating...' : 'Generate Summary'}
                        </Button>
                      )}
                    </td>
                  )}
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
