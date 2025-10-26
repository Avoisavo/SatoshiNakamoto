// Telegram Bot API utilities

export interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups: boolean;
  can_read_all_group_messages: boolean;
  supports_inline_queries: boolean;
}

export interface TelegramMessage {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      type: string;
    };
    date: number;
    text?: string;
    photo?: Record<string, unknown>[];
    document?: Record<string, unknown>;
    video?: Record<string, unknown>;
    audio?: Record<string, unknown>;
    voice?: Record<string, unknown>;
  };
}

/**
 * Verify bot token by calling Telegram getMe API
 */
export async function verifyTelegramBot(botToken: string): Promise<{ success: boolean; data?: TelegramBotInfo; error?: string }> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const result = await response.json();

    if (result.ok) {
      return { success: true, data: result.result };
    } else {
      return { success: false, error: result.description || 'Invalid bot token' };
    }
  } catch (error) {
    return { success: false, error: 'Failed to connect to Telegram API' };
  }
}

/**
 * Set webhook for receiving messages
 */
export async function setWebhook(botToken: string, webhookUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
      }),
    });
    const result = await response.json();

    if (result.ok) {
      return { success: true };
    } else {
      return { success: false, error: result.description || 'Failed to set webhook' };
    }
  } catch (error) {
    return { success: false, error: 'Failed to set webhook' };
  }
}

/**
 * Get updates using long polling
 */
export async function getUpdates(botToken: string, offset?: number): Promise<{ success: boolean; data?: TelegramMessage[]; error?: string }> {
  try {
    const url = new URL(`https://api.telegram.org/bot${botToken}/getUpdates`);
    if (offset) {
      url.searchParams.append('offset', offset.toString());
    }
    url.searchParams.append('timeout', '30'); // Long polling timeout

    const response = await fetch(url.toString());
    const result = await response.json();

    if (result.ok) {
      return { success: true, data: result.result };
    } else {
      return { success: false, error: result.description || 'Failed to get updates' };
    }
  } catch (error) {
    return { success: false, error: 'Failed to get updates from Telegram' };
  }
}

/**
 * Delete webhook to enable polling
 */
export async function deleteWebhook(botToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`);
    const result = await response.json();

    if (result.ok) {
      return { success: true };
    } else {
      return { success: false, error: result.description || 'Failed to delete webhook' };
    }
  } catch (error) {
    return { success: false, error: 'Failed to delete webhook' };
  }
}

/**
 * Send message to a chat
 */
export async function sendMessage(botToken: string, chatId: number, text: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    });
    const result = await response.json();

    if (result.ok) {
      return { success: true };
    } else {
      return { success: false, error: result.description || 'Failed to send message' };
    }
  } catch (error) {
    return { success: false, error: 'Failed to send message' };
  }
}

