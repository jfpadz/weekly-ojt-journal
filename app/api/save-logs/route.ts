import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);

const formatTime = (isoStr: string) => {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseKey) {
       return NextResponse.json({ success: false, error: "Missing Supabase Keys" }, { status: 500 });
    }

    const body = await request.json();
    const { dateKey, amIn, amOut, pmIn, pmOut, activity, accomplished } = body;

    // Supabase Save (We know this works)
    const { data: existingRow } = await supabase
      .from('logs')
      .select('*')
      .eq('date_key', dateKey)
      .single();

    const finalData = {
      date_key: dateKey,
      am_in: amIn !== undefined ? amIn : existingRow?.am_in,
      am_out: amOut !== undefined ? amOut : existingRow?.am_out,
      pm_in: pmIn !== undefined ? pmIn : existingRow?.pm_in,
      pm_out: pmOut !== undefined ? pmOut : existingRow?.pm_out,
      activity: activity !== undefined ? activity : existingRow?.activity,
      accomplished: accomplished !== undefined ? accomplished : existingRow?.accomplished,
    };

    const { error: dbError } = await supabase
      .from('logs')
      .upsert(finalData, { onConflict: 'date_key' });

    if (dbError) throw new Error("Database save failed: " + dbError.message);

    // --- GOOGLE SHEETS DEBUG SECTION ---
    if (finalData.activity || finalData.accomplished || finalData.am_in || finalData.pm_out) {
      const dateObj = new Date(dateKey);
      const formattedDateForScript = dateObj.toLocaleDateString('en-CA'); // YYYY-MM-DD

      const sheetData = {
        dateKey: formattedDateForScript,
        amIn: formatTime(finalData.am_in),
        amOut: formatTime(finalData.am_out),
        pmIn: formatTime(finalData.pm_in),
        pmOut: formatTime(finalData.pm_out),
        activity: finalData.activity || '',
        accomplished: finalData.accomplished || ''
      };

      if (process.env.GOOGLE_SCRIPT_URL) {
        console.log("🚀 Sending to Google...", sheetData.dateKey);
        
        const googleRes = await fetch(process.env.GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sheetData),
        });
        
        const googleJson = await googleRes.json();
        
        // --- PRINT DEBUG LOGS TO TERMINAL ---
        console.log("--- GOOGLE SHEET RESPONSE ---");
        console.log("Result:", googleJson.result);
        if (googleJson.logs) {
            console.log("Logs from Script:");
            googleJson.logs.forEach((log: string) => console.log("  > " + log));
        }
        console.log("-----------------------------");

        if (googleJson.result === 'not_found') {
          console.warn(`⚠️ Date ${formattedDateForScript} NOT FOUND in Sheet.`);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}