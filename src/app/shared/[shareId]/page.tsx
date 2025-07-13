"use client";

import { useEffect, useState, use } from 'react';
import { Message } from '@langchain/langgraph-sdk';
import { LangGraphLogoSVG } from '@/components/icons/langgraph';
import { getContentString } from '@/components/thread/utils';
import { MarkdownText } from '@/components/thread/markdown-text';
import { MultimodalPreview } from '@/components/ui/MultimodalPreview';
import { cn } from '@/lib/utils';
import { LoaderCircle, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SharedThreadData {
  thread: {
    thread_id: string;
    messages?: Message[];
    values?: {
      messages: Message[];
    };
  };
  shareId: string;
  createdAt: string;
  expiresAt: string;
}

interface SharedMessageProps {
  message: Message;
}

function SharedHumanMessage({ message }: SharedMessageProps) {
  const contentString = getContentString(message.content);

  return (
    <div className="group ml-auto flex items-center gap-2">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2">
          {/* Render images and files if no text */}
          {Array.isArray(message.content) && message.content.length > 0 && (
            <div className="flex flex-col items-end gap-2">
              {message.content.reduce<React.ReactNode[]>(
                (acc, block, idx) => {
                  if (block.type === 'image_url' || (block as any).type === 'file') {
                    acc.push(
                      <MultimodalPreview
                        key={idx}
                        block={block as any}
                        size="md"
                      />,
                    );
                  }
                  return acc;
                },
                [],
              )}
            </div>
          )}
          {/* Render text if present */}
          {contentString ? (
            <p className="bg-muted ml-auto w-fit rounded-3xl px-4 py-2 text-right whitespace-pre-wrap">
              {contentString}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SharedAIMessage({ message }: SharedMessageProps) {
  const contentString = getContentString(message.content);

  return (
    <div className="group mr-auto flex items-start gap-2">
      <div className="flex flex-col gap-2">
        {contentString.length > 0 && (
          <div className="py-1">
            <MarkdownText>{contentString}</MarkdownText>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SharedThreadPage({ 
  params 
}: { 
  params: Promise<{ shareId: string }> 
}) {
  const resolvedParams = use(params);
  const [threadData, setThreadData] = useState<SharedThreadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchSharedThread = async () => {
      try {
        const response = await fetch(`/api/share?shareId=${resolvedParams.shareId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to load shared thread');
        }

        const data = await response.json();
        console.log('🔍 Shared thread data received:', {
          hasData: !!data,
          dataKeys: data ? Object.keys(data) : [],
          hasThread: !!data?.thread,
          threadKeys: data?.thread ? Object.keys(data.thread) : [],
          hasValues: data?.thread?.values ? true : false,
          hasMessages: data?.thread?.values?.messages ? true : false,
          messageCount: data?.thread?.values?.messages?.length || 0,
          fullData: data
        });
        setThreadData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedThread();
  }, [resolvedParams.shareId]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading shared thread...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-2xl font-semibold">Thread Not Found</h1>
          <p className="text-muted-foreground max-w-md">{error}</p>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!threadData) {
    return null;
  }

  const { thread, shareId: threadShareId, createdAt, expiresAt } = threadData;
  const messages = thread.values?.messages || thread.messages || [];

  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Header */}
      <div className="border-b bg-white p-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <LangGraphLogoSVG className="h-8" />
            <div>
              <h1 className="text-xl font-semibold">Shared Thread</h1>
              <p className="text-sm text-muted-foreground">
                Thread ID: {thread.thread_id.slice(0, 8)}...
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="flex items-center gap-2"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="mx-auto max-w-4xl p-4">
          <div className="space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No messages in this thread</p>
              </div>
            ) : (
              messages.map((message: Message, index: number) => (
                <div key={message.id || `${message.type}-${index}`}>
                  {message.type === 'human' ? (
                    <SharedHumanMessage message={message} />
                  ) : message.type === 'ai' ? (
                    <SharedAIMessage message={message} />
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-white p-4">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm text-muted-foreground">
            Shared on {new Date(createdAt).toLocaleDateString()} • 
            Expires on {new Date(expiresAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
} 