"use client"
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner"
import { checkCalenderConnectionStatus } from "@/lib/calender";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

export default function ConnectButton() {
  const [loading, setLoading] = useState(false);

  const init = async () =>{
    setLoading(true);
    const isConnected = await checkCalenderConnectionStatus();
    setLoading(false);

    if(isConnected){
      redirect("/classical?type=future&limit=1")
    }
  }

  useEffect(()=>{
    init()
  },[])

  return (
    <Button size="sm" variant="outline" disabled={loading}>
       { loading && <Spinner /> }
        Connect to my Google Calender
     </Button>

  );
}
