function requestForPath(request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  return new Request(url, request);
}

function routeCandidates(pathname) {
  if (pathname === "/") {
    return ["/", "/index.html"];
  }

  if (pathname.endsWith("/")) {
    return [pathname, `${pathname}index.html`];
  }

  const lastSegment = pathname.slice(pathname.lastIndexOf("/") + 1);
  if (!lastSegment.includes(".")) {
    return [pathname, `${pathname}/index.html`];
  }

  return [pathname];
}

const worker = {
  async fetch(request, env) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return env.ASSETS.fetch(request);
    }

    const { pathname } = new URL(request.url);
    for (const candidate of routeCandidates(pathname)) {
      const response = await env.ASSETS.fetch(
        requestForPath(request, candidate),
      );
      if (response.status !== 404) {
        return response;
      }
    }

    if (pathname.endsWith(".glb")) {
      const compressed = await env.ASSETS.fetch(
        requestForPath(request, `${pathname}.gz`),
      );
      if (compressed.status !== 404) {
        const headers = new Headers(compressed.headers);
        headers.set("content-encoding", "gzip");
        headers.set("content-type", "model/gltf-binary");
        headers.append("vary", "Accept-Encoding");
        return new Response(compressed.body, {
          status: compressed.status,
          statusText: compressed.statusText,
          headers,
        });
      }
    }

    const fallback = await env.ASSETS.fetch(requestForPath(request, "/404.html"));
    return new Response(fallback.body, {
      status: 404,
      statusText: "Not Found",
      headers: fallback.headers,
    });
  },
};

export default worker;
