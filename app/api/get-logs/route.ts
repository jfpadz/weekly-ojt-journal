import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase safely on the server
// We use the "fallback" empty strings to prevent build errors if keys are missing during build,
// but we check for them inside the function.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // 1. Check keys
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase keys missing on server" }, { status: 500 });
    }

    // 2. Fetch all logs
    const { data, error } = await supabase
      .from('logs')
      .select('*');

    if (error) {
      console.error("Supabase Fetch Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Return data to frontend
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}