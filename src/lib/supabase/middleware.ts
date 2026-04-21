import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Define protected routes
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/candidate') || request.nextUrl.pathname.startsWith('/recruiter')
    const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup')

    // Redirect logic
    if (!user && isProtectedRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    if (user && isAuthRoute) {
        // Determine redirect based on role
        // Ideally user metadata or a fetch from profiles table would occur here,
        // but we can default route to candidate and let candidate dashboard redirect if they are a recruiter, or query it here.
        // querying profiles table here:
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        const url = request.nextUrl.clone()
        if (profile?.role === 'Recruiter') {
            url.pathname = '/recruiter/dashboard'
        } else {
            url.pathname = '/candidate/dashboard'
        }
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
