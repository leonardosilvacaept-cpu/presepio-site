"use strict";

(() => {
    const SUPABASE_URL =
        "COLOCA_AQUI_O_PROJECT_URL";

    const SUPABASE_PUBLIC_KEY =
        "COLOCA_AQUI_A_PUBLISHABLE_OU_ANON_KEY";

    if (!window.supabase) {
        console.error(
            "A biblioteca do Supabase não foi carregada."
        );

        return;
    }

    window.supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLIC_KEY,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            }
        );
})();