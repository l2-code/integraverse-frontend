import { Message } from "@langchain/langgraph-sdk";

export interface BugReportData {
  threadId: string;
  threadTitle: string;
  messageHistory: string;
  userEmail?: string;
}

export function formatMessageHistory(messages: Message[]): string {
  return messages
    .map((message, index) => {
      const timestamp = new Date().toISOString(); // Use current time since Message doesn't have timestamp
      const role = message.type || 'unknown';
      const content = Array.isArray(message.content) 
        ? message.content.map(c => typeof c === 'string' ? c : JSON.stringify(c)).join('\n')
        : typeof message.content === 'string' 
          ? message.content 
          : JSON.stringify(message.content);
      
      return `[${index + 1}] ${timestamp} - ${role.toUpperCase()}:\n${content}\n`;
    })
    .join('\n---\n');
}

export async function sendBugReport(data: BugReportData): Promise<boolean> {
  try {
    const response = await fetch('/api/report-bug', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error sending bug report:', error);
    return false;
  }
} 