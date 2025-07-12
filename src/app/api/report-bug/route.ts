import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { threadId, threadTitle, messageHistory, userEmail } = body;

    if (!threadId || !threadTitle || !messageHistory) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create email content
    const subject = `[AGENT BUG] ${threadId} / ${userEmail || 'Unknown User'}`;
    const emailBody = `
Thread ID: ${threadId}
Thread Title: ${threadTitle}
User: ${userEmail || 'Unknown User'}

Message History:
${messageHistory}

---
This bug report was generated automatically from the Integraverse frontend.
    `.trim();

    // Try to send email using a webhook service
    // You can set up a webhook at https://webhook.site or use a service like Zapier
    const webhookUrl = process.env.BUG_REPORT_WEBHOOK_URL || process.env.NEXT_PUBLIC_BUG_REPORT_WEBHOOK_URL;
    
    console.log('Webhook URL configured:', !!webhookUrl);
    console.log('Webhook URL:', webhookUrl);
    
    if (webhookUrl) {
      try {
        console.log('Attempting to send webhook to:', webhookUrl);
        
        const webhookData = {
          to: 'leonardo@l2code.com.br',
          subject: subject,
          body: emailBody,
          threadId: threadId,
          userEmail: userEmail || 'Unknown User',
          timestamp: new Date().toISOString()
        };
        
        console.log('Webhook data:', webhookData);
        
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookData),
        });

        console.log('Webhook response status:', webhookResponse.status);
        console.log('Webhook response ok:', webhookResponse.ok);

        if (webhookResponse.ok) {
          console.log('Bug report sent via webhook successfully');
        } else {
          console.log('Webhook failed, falling back to console log');
          const responseText = await webhookResponse.text();
          console.log('Webhook error response:', responseText);
        }
      } catch (webhookError) {
        console.log('Webhook error, falling back to console log:', webhookError);
      }
    } else {
      console.log('No webhook URL configured, only logging to console');
    }

    // Always log the email content as a fallback
    console.log('=== BUG REPORT EMAIL ===');
    console.log('To: leonardo@l2code.com.br');
    console.log('Subject:', subject);
    console.log('Body:');
    console.log(emailBody);
    console.log('========================');

    return NextResponse.json({ 
      success: true,
      message: webhookUrl ? 'Bug report sent via webhook' : 'Bug report logged to console'
    });
  } catch (error) {
    console.error('Error sending bug report:', error);
    return NextResponse.json(
      { error: 'Failed to send bug report' },
      { status: 500 }
    );
  }
} 