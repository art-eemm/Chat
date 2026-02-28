import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Si las variables no están, devolvemos un error controlado en lugar de tumbar el servidor
  if (!url || !key) {
    return NextResponse.json(
      { error: "Configuración de Supabase faltante en .env.local" },
      { status: 500 }
    );
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  // Bloqueo de rutas protegidas
  if (!user && request.nextUrl.pathname.startsWith('/api') && !request.nextUrl.pathname.includes('/auth')) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return response;
}