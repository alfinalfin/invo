export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const input = query.input as string;
  
  if (!input) {
    return [];
  }

  const apiKey = "AIzaSyBzXbQ4F2tJNFwQQeOY4mc2zcLzv_6A_1g";
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    input
  )}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.predictions || [];
  } catch (error) {
    console.error("Error fetching places API:", error);
    return [];
  }
});
