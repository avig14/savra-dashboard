import { auth } from "@/lib/auth";

// Auth.js v5 middleware — protects /dashboard routes
// Must live at root level (NOT inside /app)
export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname.startsWith("/dashboard")) {
    return Response.redirect(new URL("/login", req.url));
  }
});

export const config = {
  // Protect all routes except: API, static files, favicon, login
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
};
