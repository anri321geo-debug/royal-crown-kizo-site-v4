const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-kizo-app-key',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

const jsonResponse = (statusCode, payload) => ({
  statusCode,
  headers: {
    ...CORS_HEADERS,
    'Content-Type': 'application/json; charset=utf-8'
  },
  body: JSON.stringify(payload)
});

const safeString = (value, max = 300) => String(value || '').trim().slice(0, max);

const parseLimit = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 50;
  return Math.max(1, Math.min(200, Math.floor(n)));
};

const fetchMessages = async ({ supabaseUrl, serviceRoleKey, table, limit }) => {
  const endpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/${table}?select=id,name,phone,email,message,language,created_at&order=created_at.desc&limit=${limit}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase fetch failed: ${text}`);
  }

  return response.json();
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { ok: false, error: 'Method not allowed' });
  }

  const appApiKey = safeString(event.headers['x-kizo-app-key'] || event.headers['X-KIZO-APP-KEY'] || '', 200);
  const expectedApiKey = safeString(process.env.APP_MESSAGES_API_KEY || '', 200);

  if (!expectedApiKey) {
    return jsonResponse(500, {
      ok: false,
      error: 'APP_MESSAGES_API_KEY is not configured'
    });
  }

  if (!appApiKey || appApiKey !== expectedApiKey) {
    return jsonResponse(401, {
      ok: false,
      error: 'Unauthorized'
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const table = process.env.CONTACT_MESSAGES_TABLE || 'contact_messages';
  const limit = parseLimit(event.queryStringParameters?.limit || 50);

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(500, {
      ok: false,
      error: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing'
    });
  }

  try {
    const data = await fetchMessages({
      supabaseUrl,
      serviceRoleKey,
      table,
      limit
    });

    return jsonResponse(200, {
      ok: true,
      messages: data || []
    });
  } catch (error) {
    return jsonResponse(500, {
      ok: false,
      error: 'Failed to fetch messages',
      details: String(error.message || error)
    });
  }
};
