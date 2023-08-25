export async function onRequestPost(context) {
  try {
    const body = await context.request.text();
    const searchParams = new URLSearchParams(body);

    const response = JSON.stringify({
      ok: true,
      searchParams: searchParams,
    }, null, 2);

    return new Response(response, {
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
      },
    });
  } catch (err) {
    return new Response('Error', { status: 400 });
  }
}
