"use server";

export async function searchPlaces(input: string) {
  if (!input) return [];
  
  const apiKey = "AIzaSyBzXbQ4F2tJNFwQQeOY4mc2zcLzv_6A_1g";
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    input
  )}&key=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    return data.predictions || [];
  } catch (error) {
    console.error("Error fetching places:", error);
    return [];
  }
}
