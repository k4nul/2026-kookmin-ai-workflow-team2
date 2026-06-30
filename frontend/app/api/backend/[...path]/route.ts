const BACKEND_INTERNAL_BASE_URL = (
  process.env.BACKEND_INTERNAL_BASE_URL ??
  "http://localhost:8081"
).replace(/\/$/, "")

type RouteContext = {
  params: Promise<{
    path: string[]
  }>
}

async function proxyToBackend(request: Request, context: RouteContext): Promise<Response> {
  const { path } = await context.params
  const requestUrl = new URL(request.url)
  const targetUrl = `${BACKEND_INTERNAL_BASE_URL}/${path.join("/")}${requestUrl.search}`
  const headers = new Headers(request.headers)

  headers.delete("host")
  headers.delete("connection")
  headers.delete("content-length")

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
    cache: "no-store",
    redirect: "manual",
  })
  const responseHeaders = new Headers(response.headers)

  responseHeaders.delete("content-encoding")
  responseHeaders.delete("transfer-encoding")

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  })
}

export const GET = proxyToBackend
export const POST = proxyToBackend
export const PUT = proxyToBackend
export const PATCH = proxyToBackend
export const DELETE = proxyToBackend
