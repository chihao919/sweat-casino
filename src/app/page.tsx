"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Root landing page — acts as an authentication gate.
 * Authenticated users go to the dashboard; everyone else goes to login.
 */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }

    checkAuth();
  }, [router]);

  return null;
}
