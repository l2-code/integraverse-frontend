import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization token from the incoming request headers
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    console.log('🔐 Test Auth Debug:', {
      hasAuthHeader: !!authHeader,
      hasToken: !!bearerToken,
      tokenLength: bearerToken?.length || 0,
      allHeaders: Object.fromEntries(request.headers.entries())
    });

    if (!bearerToken) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Authorization token required',
          message: 'No authorization header found in request. Please ensure you are logged in.'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(bearerToken);

    if (error || !user) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Invalid token',
          message: 'The provided token is invalid or expired'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new NextResponse(
      JSON.stringify({ 
        success: true,
        user: {
          id: user.id,
          email: user.email
        },
        message: 'Authentication successful'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Test auth error:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
} 