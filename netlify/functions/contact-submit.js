const crypto = require('crypto');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

const jsonResponse = (statusCode, payload) => ({
  statusCode,
  headers: {
    ...CORS_HEADERS,
    'Content-Type': 'application/json; charset=utf-8'
  },
  body: JSON.stringify(payload)
});

const safeString = (value, max = 4000) => String(value || '').trim().slice(0, max);

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const base64Url = (input) =>
  Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const createSignedJwt = ({ clientEmail, privateKey }) => {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };
  const payload = {
    iss: clientEmail,
    scope: FCM_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const unsigned = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();

  const signature = signer
    .sign(privateKey, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  return `${unsigned}.${signature}`;
};

let cachedAccessToken = '';
let cachedAccessTokenExp = 0;

const getGoogleAccessToken = async ({ clientEmail, privateKey }) => {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && cachedAccessTokenExp - 60 > now) {
    return cachedAccessToken;
  }

  const assertion = createSignedJwt({ clientEmail, privateKey });
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google OAuth failed: ${text}`);
  }

  const data = await response.json();
  cachedAccessToken = data.access_token || '';
  cachedAccessTokenExp = now + Number(data.expires_in || 3000);
  return cachedAccessToken;
};

const insertIntoSupabase = async (url, serviceKey, table, payload) => {
  const endpoint = `${url.replace(/\/$/, '')}/rest/v1/${table}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify([payload])
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase insert failed: ${text}`);
  }

  return response.json();
};

const getDeviceTokens = async (url, serviceKey, table) => {
  const endpoint = `${url.replace(/\/$/, '')}/rest/v1/${table}?select=fcm_token&is_active=eq.true`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Device token fetch failed: ${text}`);
  }

  const data = await response.json();
  return (data || []).map((row) => safeString(row.fcm_token, 300)).filter(Boolean);
};

const sendFcmMessage = async ({ projectId, accessToken, token, title, body }) => {
  const endpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const payload = {
    message: {
      token,
      notification: {
        title,
        body
      },
      data: {
        event: 'new_contact_message'
      },
      android: {
        priority: 'high',
        notification: {
          channel_id: 'kizo_messages'
        }
      }
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`FCM push failed for token ${token.slice(0, 24)}...: ${text}`);
  }
};

const sendPushNotifications = async ({
  supabaseUrl,
  supabaseServiceRole,
  deviceTokensTable,
  fcmProjectId,
  fcmClientEmail,
  fcmPrivateKey,
  title,
  body
}) => {
  const tokens = await getDeviceTokens(supabaseUrl, supabaseServiceRole, deviceTokensTable);
  if (!tokens.length) {
    return { sentCount: 0, failedCount: 0 };
  }

  const accessToken = await getGoogleAccessToken({
    clientEmail: fcmClientEmail,
    privateKey: fcmPrivateKey
  });

  const results = await Promise.allSettled(
    tokens.map((token) =>
      sendFcmMessage({
        projectId: fcmProjectId,
        accessToken,
        token,
        title,
        body
      })
    )
  );

  const sentCount = results.filter((result) => result.status === 'fulfilled').length;
  const failedCount = results.length - sentCount;
  return { sentCount, failedCount };
};

const sendTelegram = async (token, chatId, message) => {
  const endpoint = `https://api.telegram.org/bot${token}/sendMessage`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Telegram send failed: ${text}`);
  }
};

const sendWebhook = async (url, payload) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Webhook failed: ${text}`);
  }
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'Method not allowed' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (_error) {
    return jsonResponse(400, { ok: false, error: 'Invalid JSON body' });
  }

  const name = safeString(body.name, 120);
  const phone = safeString(body.phone, 80);
  const email = safeString(body.email, 180);
  const message = safeString(body.message, 3000);
  const language = safeString(body.language || 'ka', 10);
  const pageUrl = safeString(body.pageUrl, 400);

  if (!name || !phone || !message) {
    return jsonResponse(400, {
      ok: false,
      error: 'Name, phone, and message are required'
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const contactTable = process.env.CONTACT_MESSAGES_TABLE || 'contact_messages';
  const deviceTokensTable = process.env.DEVICE_TOKENS_TABLE || 'device_tokens';

  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || '';
  const telegramChatId = process.env.TELEGRAM_CHAT_ID || '';
  const notifyWebhookUrl = process.env.PHONE_NOTIFY_WEBHOOK_URL || '';

  const fcmProjectId = process.env.FCM_PROJECT_ID || '';
  const fcmClientEmail = process.env.FCM_CLIENT_EMAIL || '';
  const rawFcmPrivateKey = process.env.FCM_PRIVATE_KEY || '';
  const fcmPrivateKey = rawFcmPrivateKey.replace(/\\n/g, '\n');

  const payload = {
    name,
    phone,
    email: email || null,
    message,
    language,
    page_url: pageUrl || null,
    user_agent: safeString(event.headers['user-agent'] || '', 500),
    source: 'website'
  };

  let dbStored = false;
  let notifySent = false;
  const warnings = [];

  try {
    if (supabaseUrl && supabaseServiceRole) {
      await insertIntoSupabase(supabaseUrl, supabaseServiceRole, contactTable, payload);
      dbStored = true;
    }

    const telegramText = [
      '<b>New website message</b>',
      `Name: ${escapeHtml(name)}`,
      `Phone: ${escapeHtml(phone)}`,
      `Email: ${escapeHtml(email || '-')}`,
      `Language: ${escapeHtml(language || '-')}`,
      `Message: ${escapeHtml(message)}`,
      pageUrl ? `Page: ${escapeHtml(pageUrl)}` : null
    ]
      .filter(Boolean)
      .join('\n');

    if (telegramBotToken && telegramChatId) {
      try {
        await sendTelegram(telegramBotToken, telegramChatId, telegramText);
        notifySent = true;
      } catch (error) {
        warnings.push(`Telegram: ${error.message || error}`);
      }
    }

    if (notifyWebhookUrl) {
      try {
        await sendWebhook(notifyWebhookUrl, {
          event: 'new_contact_message',
          payload
        });
        notifySent = true;
      } catch (error) {
        warnings.push(`Webhook: ${error.message || error}`);
      }
    }

    if (supabaseUrl && supabaseServiceRole && fcmProjectId && fcmClientEmail && fcmPrivateKey) {
      try {
        const result = await sendPushNotifications({
          supabaseUrl,
          supabaseServiceRole,
          deviceTokensTable,
          fcmProjectId,
          fcmClientEmail,
          fcmPrivateKey,
          title: `New message from ${name}`,
          body: `${phone} | ${message.slice(0, 110)}`
        });

        if (result.sentCount > 0) {
          notifySent = true;
        }
      } catch (error) {
        warnings.push(`FCM: ${error.message || error}`);
      }
    }

    if (!dbStored && !notifySent) {
      return jsonResponse(500, {
        ok: false,
        error: 'Backend not configured. Set SUPABASE and notification env vars.',
        warnings
      });
    }

    return jsonResponse(200, {
      ok: true,
      stored: dbStored,
      notified: notifySent,
      warnings
    });
  } catch (error) {
    return jsonResponse(500, {
      ok: false,
      error: 'Failed to process contact request',
      details: String(error.message || error),
      warnings
    });
  }
};
