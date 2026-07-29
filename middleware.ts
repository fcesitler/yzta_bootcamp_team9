import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() her istekte Supabase'e ağ isteği atıyordu — navigasyon, prefetch ve
  // RSC çağrılarının hepsine bir gidiş-dönüş biniyordu. getClaims() imzayı JWKS ile
  // yerel doğrular (asimetrik anahtarlarda ağ isteği yok), aynı güvenlik garantisi.
  const {
    data: claims,
  } = await supabase.auth.getClaims();
  const user = claims?.claims ?? null;

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");

  // Oturum tazelenirken yazılan çerezleri her yanıta taşımalıyız; aksi hâlde
  // redirect/rewrite bunları düşürür ve kullanıcı çıkmış görünür.
  const withCookies = (res: NextResponse) => {
    supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  // /landing dahili hedeftir — tanıtım sayfasının herkese açık adresi "/" kalsın.
  if (pathname === "/landing") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return withCookies(NextResponse.redirect(url));
  }

  // Giriş yapmamış ziyaretçi kök adreste tanıtım sayfasını görür (URL "/" kalır);
  // giriş yapmış kullanıcı aynı adreste uygulamayı görmeye devam eder.
  if (!user && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/landing";
    return withCookies(NextResponse.rewrite(url));
  }

  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return withCookies(NextResponse.redirect(url));
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return withCookies(NextResponse.redirect(url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
