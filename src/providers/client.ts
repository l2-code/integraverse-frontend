import { Client } from "@langchain/langgraph-sdk";
import { supabase } from "@/lib/supabase";

export async function createClient(apiUrl: string, apiKey: string | undefined) {
  // Get the current session token from Supabase
  const { data: { session } } = await supabase.auth.getSession();
  const bearerToken = session?.access_token;
  
  // Create headers object
  const headers: Record<string, string> = {};
  
  // Add API key if provided
  if (apiKey) {
    headers["X-Api-Key"] = apiKey;
  }
  
  // Add bearer token if available
  if (bearerToken) {
    headers["Authorization"] = `Bearer ${bearerToken}`;
  }
  
  return new Client({
    apiKey,
    apiUrl,
    defaultHeaders: Object.keys(headers).length > 0 ? headers : undefined,
  });
}
