export async function onRequest(context) {
  const { request, env, next } = context;

  // 環境変数から取得（コード内でのパスワード等のハードコードは行わない）
  const adminUser = env.BASIC_AUTH_ADMIN_USER;
  const adminPass = env.BASIC_AUTH_ADMIN_PASS;
  const userUser = env.BASIC_AUTH_USER_USER;
  const userPass = env.BASIC_AUTH_USER_PASS;

  // 環境変数に設定漏れがある場合は安全のため500エラーとする
  if (!adminUser || !adminPass || !userUser || !userPass) {
    return new Response("Configuration Error: Basic auth credentials are not configured in Pages settings.", {
      status: 500
    });
  }

  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="WOS Battle Simulator"',
      },
    });
  }

  const [scheme, encoded] = authHeader.split(" ");
  if (scheme.toLowerCase() !== "basic") {
    return new Response("Bad Request", { status: 400 });
  }

  try {
    const decoded = atob(encoded);
    const [username, password] = decoded.split(":");

    // admin または user の組み合わせに一致するかチェック
    const isAdminMatch = username === adminUser && password === adminPass;
    const isUserMatch = username === userUser && password === userPass;

    if (!isAdminMatch && !isUserMatch) {
      return new Response("Unauthorized", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="WOS Battle Simulator"',
        },
      });
    }
  } catch (e) {
    return new Response("Bad Request", { status: 400 });
  }

  // 認証が成功した場合、次のミドルウェアまたは静的ファイル配信に進む
  return next();
}
