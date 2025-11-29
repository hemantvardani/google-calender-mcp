// This function is now handled by the API route
// Keeping for backward compatibility if needed
export async function getClassicalCalenderData({
  type,
  count,
  query
}: {
  type: string;
  count: number;
  query: string;
}) {
  const response = await fetch(`/api/bookings?type=${type}&limit=${count}`);
  if (!response.ok) {
    throw new Error('Failed to fetch calendar data');
  }
  return response.json();
}

export async function checkCalenderConnectionStatus() {
  const response = await fetch("/api/auth/status");
  const body = await response.json();
  return body.status;

}