"use client"
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner"
import { checkCalenderConnectionStatus } from "@/lib/calender";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ConnectButtonProps {
  autoCheck?: boolean; // If true, auto-check connection on mount and redirect
}

export default function ConnectButton({ autoCheck = false }: ConnectButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      if (!autoCheck) return;
      
      setLoading(true);
      const isConnected = await checkCalenderConnectionStatus();
      setLoading(false);

      if(isConnected){
        router.push("/classical?type=future&limit=1");
      }
    };

    init();
  }, [autoCheck, router]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/connect");
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate connection");
      }

      // Redirect to OAuth URL
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        throw new Error("No redirect URL received");
      }
    } catch (error: any) {
      console.error("Connection error:", error);
      alert(`Failed to connect: ${error.message || "Unknown error"}`);
      setLoading(false);
    }
  };

  return (
    <Button 
      size="sm" 
      variant="outline" 
      disabled={loading}
      onClick={handleConnect}
    >
      {loading && <Spinner />}
      Connect to my Google Calender
    </Button>
  );
}
