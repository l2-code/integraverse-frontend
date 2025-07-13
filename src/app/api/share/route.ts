import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Client } from '@langchain/langgraph-sdk';
import { getApiKey } from '@/lib/api-key';

export async function POST(request: NextRequest) {
  try {
    const { threadId, apiUrl, assistantId } = await request.json();

    if (!threadId || !apiUrl || !assistantId) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Missing required parameters',
          message: 'threadId, apiUrl, and assistantId are required'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Get the authorization token from the incoming request headers
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    console.log('🔐 Share API Auth Debug:', {
      hasAuthHeader: !!authHeader,
      hasToken: !!bearerToken,
      tokenLength: bearerToken?.length || 0,
      method: 'POST',
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

    // Create client to fetch thread data with bearer token
    const client = new Client({
      apiKey: getApiKey() ?? undefined,
      apiUrl,
      defaultHeaders: {
        'Authorization': `Bearer ${bearerToken}`,
      },
    });
    
    // Fetch the thread with all its messages
    const thread = await client.threads.get(threadId);
    
    console.log('🔍 Thread data debug:', {
      threadId,
      hasThread: !!thread,
      threadKeys: thread ? Object.keys(thread) : [],
      hasValues: (thread as any)?.values ? true : false,
      hasMessages: (thread as any)?.values?.messages ? true : false,
      messageCount: (thread as any)?.values?.messages?.length || 0,
      threadStructure: JSON.stringify(thread, null, 2).substring(0, 500) + '...'
    });
    
    if (!thread) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Thread not found',
          message: 'The specified thread could not be found'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Create a unique share ID
    const shareId = crypto.randomUUID();
    
    // Store the thread snapshot in Supabase
    const { data, error } = await supabase
      .from('shared_threads')
      .insert({
        share_id: shareId,
        thread_id: threadId,
        thread_data: thread,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      });

    if (error) {
      console.error('Error storing shared thread:', error);
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to create share',
          message: 'Could not store the thread snapshot'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Return the share URL
    const shareUrl = `${request.nextUrl.origin}/shared/${shareId}`;
    
    return new NextResponse(
      JSON.stringify({ 
        shareId,
        shareUrl,
        message: 'Thread shared successfully'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Share API error:', error);
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('shareId');

    if (!shareId) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Share ID required',
          message: 'Please provide a share ID'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Fetch the shared thread from Supabase
    const { data, error } = await supabase
      .from('shared_threads')
      .select('*')
      .eq('share_id', shareId)
      .single();

    if (error || !data) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Share not found',
          message: 'The shared thread could not be found or has expired'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Check if the share has expired
    if (new Date(data.expires_at) < new Date()) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Share expired',
          message: 'This shared thread has expired'
        }),
        {
          status: 410,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new NextResponse(
      JSON.stringify({ 
        thread: data.thread_data,
        shareId: data.share_id,
        createdAt: data.created_at,
        expiresAt: data.expires_at
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Get shared thread error:', error);
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