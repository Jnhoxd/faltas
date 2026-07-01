exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Allow': 'POST', 'Content-Type': 'text/plain' },
      body: 'Method Not Allowed'
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Invalid JSON payload.'
    };
  }

  const webhookUrl = process.env.TEAMS_WEBHOOK_URL || process.env.VITE_TEAMS_WEBHOOK_URL;
  if (!webhookUrl) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Teams webhook URL is not configured.'
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    return {
      statusCode: response.ok ? 200 : response.status,
      headers: { 'Content-Type': 'text/plain' },
      body: response.ok ? 'OK' : responseText || `Teams webhook error: ${response.status}`
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: `Request to Teams webhook failed: ${error.message}`
    };
  }
};