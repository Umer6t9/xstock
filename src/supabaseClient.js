import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://bwluwoyuwlzwtlgkhonu.supabase.co";
const supabaseAnonKey = "sb_publishable_khO0HBMhLtoAVqECwYViwA_9OQyFc1G";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
