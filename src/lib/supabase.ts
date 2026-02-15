import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://yayizdcyodtgrytwqneb.supabase.co"
const supabaseKey = "sb_publishable_M39zF9CLJCIo6siRh4OGGQ_9UCS4Sdr"

export const supabase = createClient(supabaseUrl, supabaseKey)
