import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleRequest(request, path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleRequest(request, path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleRequest(request, path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleRequest(request, path, 'DELETE');
}

async function handleRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // Get the authorization token from the incoming request headers
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    console.log('🔐 Auth Debug:', {
      hasAuthHeader: !!authHeader,
      hasToken: !!bearerToken,
      tokenLength: bearerToken?.length || 0,
      path: pathSegments.join('/'),
      method,
      allHeaders: Object.fromEntries(request.headers.entries())
    });

    // REQUIRE authorization token - throw error if missing
    if (!bearerToken) {
      console.error('❌ No authorization token found in request headers');
      return new NextResponse(
        JSON.stringify({ 
          error: 'Authorization token required',
          message: 'No authorization header found in request. Please ensure you are logged in.'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // Construct the target URL
    const path = pathSegments.join('/');
    const targetUrl = `http://localhost:2024/${path}`;

    // Prepare headers
    const headers: Record<string, string> = {};
    
    // Copy relevant headers from the original request
    const contentType = request.headers.get('content-type');
    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    // ALWAYS add authorization header (we know it exists now)
    headers['Authorization'] = `Bearer ${bearerToken}`;

    console.log('📤 Forwarding request:', {
      url: targetUrl,
      method,
      hasAuthHeader: !!headers['Authorization'],
      authHeaderLength: headers['Authorization']?.length || 0
    });

    // Get the request body if it's a POST/PUT request
    let body: string | undefined;
    if (method === 'POST' || method === 'PUT') {
      body = await request.text();
    }

    // Make the request to the LangGraph server
    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
    });

    console.log('📥 Response received:', {
      status: response.status,
      statusText: response.statusText,
      url: targetUrl
    });

    // Get the response data
    const responseData = await response.text();

    // Return the response with the same status and headers
    return new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        // Add CORS headers
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('❌ Proxy error:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 