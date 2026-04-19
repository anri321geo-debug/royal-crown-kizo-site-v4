const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const jsonResponse = (statusCode, payload) => ({
  statusCode,
  headers: {
    ...CORS_HEADERS,
    'Content-Type': 'application/json; charset=utf-8'
  },
  body: JSON.stringify(payload)
});

const safeString = (value, max = 4000) => String(value || '').trim().slice(0, max);

const upsertDeviceToken = async ({
  supabaseUrl,
  serviceRoleKey,
  table,
  payload
}) => {
  const endpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/${table}?on_conflict=fcm_token`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify([payload])
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase upsert failed: ${text}`);
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

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const table = process.env.DEVICE_TOKENS_TABLE || 'device_tokens';

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(500, {
      ok: false,
      error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (_error) {
    return jsonResponse(400, { ok: false, error: 'Invalid JSON body' });
  }

  const fcmToken = safeString(body.fcmToken, 1000);
  const appInstanceId = safeString(body.appInstanceId, 200);
  const platform = safeString(body.platform || 'android', 40) || 'android';
  const appVersion = safeString(body.appVersion, 50);
  const deviceName = safeString(body.deviceName, 120);

  if (!fcmToken || fcmToken.length < 80) {
    return jsonResponse(400, { ok: false, error: 'Invalid FCM token' });
  }

  const payload = {
    fcm_token: fcmToken,
    app_instance_id: appInstanceId || null,
    platform,
    app_version: appVersion || null,
    device_name: deviceName || null,
    is_active: true,
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    await upsertDeviceToken({
      supabaseUrl,
      serviceRoleKey,
      table,
      payload
    });

    return jsonResponse(200, {
      ok: true,
      registered: true
    });
  } catch (error) {
    return jsonResponse(500, {
      ok: false,
      error: 'Failed to register device token',
      details: String(error.message || error)
    });
  }
};
