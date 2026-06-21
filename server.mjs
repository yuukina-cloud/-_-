import express from "express";
import http from "node:http";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT || 4173);
const SITE_PASSWORD = process.env.SITE_PASSWORD || "festival1234";
const COOKIE_SECRET = process.env.COOKIE_SECRET || "change-this-secret-before-production";
const COOKIE_NAME = "festival_auth";
const AUTH_MAX_AGE_MS = 12 * 60 * 60 * 1000;
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = SUPABASE_URL && SUPABASE_SECRET_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

function sign(value) {
  return crypto.createHmac("sha256", COOKIE_SECRET).update(value).digest("hex");
}

function makeAuthToken() {
  const value = `ok.${Date.now()}`;
  return `${value}.${sign(value)}`;
}

function parseCookies(header = "") {
  return Object.fromEntries(
    header.split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
      const index = part.indexOf("=");
      return index < 0
        ? [decodeURIComponent(part), ""]
        : [decodeURIComponent(part.slice(0, index)), decodeURIComponent(part.slice(index + 1))];
    })
  );
}

function isValidAuthToken(token = "") {
  const lastDot = token.lastIndexOf(".");
  if (lastDot < 0) return false;
  const value = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  const expected = sign(value);
  if (signature.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;

  const parts = value.split(".");
  const issuedAt = Number(parts[1]);
  return parts[0] === "ok" && Number.isFinite(issuedAt) && Date.now() - issuedAt >= 0 && Date.now() - issuedAt <= AUTH_MAX_AGE_MS;
}

function isAuthenticated(req) {
  return isValidAuthToken(parseCookies(req.headers.cookie)[COOKIE_NAME]);
}

function loginPage(error = "", next = "/") {
  const safeNext = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return `<!doctype html><html lang="ja"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>高専祭システム ログイン</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#f1f5f9;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#0f172a}.card{width:min(420px,100%);background:#fff;border:1px solid #e2e8f0;border-radius:24px;padding:32px;box-shadow:0 18px 60px rgba(15,23,42,.12)}h1{font-size:24px;margin:0 0 8px}p{color:#64748b;margin:0 0 24px;line-height:1.7}label{display:block;font-weight:700;margin-bottom:8px}input{width:100%;font-size:18px;padding:13px 14px;border:1px solid #cbd5e1;border-radius:14px;outline:none}input:focus{border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,.15)}button{width:100%;margin-top:16px;padding:13px;border:0;border-radius:14px;background:#0f172a;color:#fff;font-weight:700;font-size:16px;cursor:pointer}.error{margin:0 0 16px;padding:10px 12px;border-radius:12px;background:#fff1f2;color:#be123c;font-weight:600}</style></head><body><main class="card"><h1>高専祭システム</h1><p>担当者用パスワードを入力してください。</p>${error ? `<div class="error">${error}</div>` : ""}<form method="post" action="/login"><input type="hidden" name="next" value="${safeNext.replaceAll('"', '&quot;')}"/><label for="password">パスワード</label><input id="password" name="password" type="password" autocomplete="current-password" required autofocus/><button type="submit">ログイン</button></form></main></body></html>`;
}

app.get("/login", (req, res) => {
  if (isAuthenticated(req)) return res.redirect("/");
  res.type("html").send(loginPage("", req.query.next));
});

app.post("/login", (req, res) => {
  const next = typeof req.body.next === "string" && req.body.next.startsWith("/") && !req.body.next.startsWith("//") ? req.body.next : "/";
  if (req.body.password !== SITE_PASSWORD) return res.status(401).type("html").send(loginPage("パスワードが違います。", next));
  res.cookie(COOKIE_NAME, makeAuthToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: AUTH_MAX_AGE_MS,
  });
  res.redirect(next);
});

app.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.redirect("/login");
});

app.use((req, res, next) => {
  if (req.path === "/health") return next();
  if (isAuthenticated(req)) return next();
  return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl || "/")}`);
});

const io = new Server(server, { cors: { origin: true, credentials: true } });
io.use((socket, next) => {
  const cookies = parseCookies(socket.handshake.headers.cookie);
  if (isValidAuthToken(cookies[COOKIE_NAME])) return next();
  next(new Error("unauthorized"));
});

const emptyState = { orders: [], stopMap: {}, notifications: [] };
let state = structuredClone(emptyState);
let mutationChain = Promise.resolve();

function emitPersistence(status, message = "") {
  io.emit("persistence-status", { status, message, at: new Date().toISOString() });
}

async function readState() {
  if (!supabase) return state;
  const [ordersResult, stopsResult, notificationsResult] = await Promise.all([
    supabase.from("festival_orders").select("*").order("created_at", { ascending: true }),
    supabase.from("festival_menu_state").select("menu_key, stopped"),
    supabase.from("festival_notifications").select("*").order("created_at", { ascending: false }).limit(100),
  ]);
  for (const result of [ordersResult, stopsResult, notificationsResult]) {
    if (result.error) throw result.error;
  }
  return {
    orders: (ordersResult.data || []).map((o) => ({
      id: o.id,
      createdAt: o.created_at,
      stallId: o.stall_id,
      stallName: o.stall_name,
      menuId: o.menu_id,
      menuKey: o.menu_key,
      menuName: o.menu_name,
      price: Number(o.price),
      orderNumber: o.order_number,
      status: o.status,
      canceled: Boolean(o.canceled),
    })),
    stopMap: Object.fromEntries((stopsResult.data || []).map((row) => [row.menu_key, Boolean(row.stopped)])),
    notifications: (notificationsResult.data || []).map((n) => ({ id: n.id, message: n.message, createdAt: n.created_at })),
  };
}

async function refreshAndBroadcast() {
  state = await readState();
  io.emit("state", state);
}

function queueMutation(work, ack = () => {}) {
  emitPersistence("saving");
  mutationChain = mutationChain.then(async () => {
    try {
      const result = await work();
      await refreshAndBroadcast();
      emitPersistence("saved");
      ack({ ok: true, ...result });
    } catch (error) {
      console.error("Supabase操作に失敗しました:", error);
      emitPersistence("error", error?.message || "保存に失敗しました");
      ack({ ok: false, error: "保存に失敗しました。接続を確認して、もう一度操作してください。" });
    }
  });
}

const menuNames = {
  "A-1": ["こんばん屋", "カレー"],
  "A-2": ["こんばん屋", "うどん"],
  "B-1": ["わが屋", "パン"],
  "C-1": ["こんにち屋", "ホットケーキ（チョコ）"],
  "C-2": ["こんにち屋", "ホットケーキ（ストロベリー）"],
};

io.on("connection", (socket) => {
  socket.emit("state", state);
  socket.emit("persistence-status", { status: "saved", message: "", at: new Date().toISOString() });

  socket.on("create-orders", (cartItems, ack = () => {}) => {
    if (!Array.isArray(cartItems) || !cartItems.length) return ack({ ok: false, error: "注文が空です" });
    if (!supabase) return ack({ ok: false, error: "Supabaseが設定されていません" });
    const items = cartItems.map((item) => ({
      stall_id: String(item.stallId || ""),
      stall_name: String(item.stallName || ""),
      menu_id: String(item.menuId || ""),
      menu_key: String(item.menuKey || ""),
      menu_name: String(item.menuName || ""),
      price: Number(item.price),
    }));
    queueMutation(async () => {
      const { data, error } = await supabase.rpc("create_festival_orders", { items });
      if (error) throw error;
      const created = (data || []).map((o) => ({
        id: o.id, createdAt: o.created_at, stallId: o.stall_id, stallName: o.stall_name,
        menuId: o.menu_id, menuKey: o.menu_key, menuName: o.menu_name, price: Number(o.price),
        orderNumber: o.order_number, status: o.status, canceled: Boolean(o.canceled),
      }));
      return { created };
    }, ack);
  });

  socket.on("cancel-order", (id, ack = () => {}) => queueMutation(async () => {
    const { error } = await supabase.from("festival_orders").update({ canceled: true, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    return {};
  }, ack));

  socket.on("toggle-received", (id, ack = () => {}) => queueMutation(async () => {
    const { data: current, error: readError } = await supabase.from("festival_orders").select("status").eq("id", id).single();
    if (readError) throw readError;
    const status = current.status === "未" ? "受け取り済" : "未";
    const { error } = await supabase.from("festival_orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    return {};
  }, ack));

  socket.on("toggle-stop", (menuKey, ack = () => {}) => queueMutation(async () => {
    const { data: current, error: readError } = await supabase.from("festival_menu_state").select("stopped").eq("menu_key", menuKey).maybeSingle();
    if (readError) throw readError;
    const stopped = !Boolean(current?.stopped);
    const { error: stopError } = await supabase.from("festival_menu_state").upsert({ menu_key: menuKey, stopped, updated_at: new Date().toISOString() }, { onConflict: "menu_key" });
    if (stopError) throw stopError;
    const [stallName = "屋台", menuName = menuKey] = menuNames[menuKey] || [];
    const { error: noticeError } = await supabase.from("festival_notifications").insert({ message: `${stallName} / ${menuName} が ${stopped ? "注文停止" : "停止解除"} されました` });
    if (noticeError) throw noticeError;
    return {};
  }, ack));

  socket.on("reset-all", (confirmation, ack = () => {}) => {
    if (confirmation !== "RESET ALL") return ack({ ok: false, error: "確認文字が違います" });
    queueMutation(async () => {
      const { error } = await supabase.rpc("reset_festival_data");
      if (error) throw error;
      return {};
    }, ack);
  });
});

app.get("/health", (_req, res) => res.json({ ok: true, database: Boolean(supabase) }));
app.get("/api/export/orders.csv", async (_req, res) => {
  try {
    const current = await readState();
    const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const header = ["注文番号", "注文時刻", "屋台ID", "屋台名", "メニュー", "金額", "状態", "取消"].map(escapeCsv).join(",");
    const rows = current.orders.map((o) => [
      o.orderNumber, o.createdAt, o.stallId, o.stallName, o.menuName, o.price, o.status, o.canceled ? "取消済" : "有効",
    ].map(escapeCsv).join(","));
    const csv = `\uFEFF${[header, ...rows].join("\r\n")}`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="festival-orders-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error("CSV出力に失敗しました:", error);
    res.status(500).json({ ok: false, error: "CSV出力に失敗しました" });
  }
});

const dist = path.join(__dirname, "dist");
app.use(express.static(dist));
app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));

async function startServer() {
  if (!supabase) throw new Error("SUPABASE_URL と SUPABASE_SECRET_KEY を設定してください");
  state = await readState();
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Festival server: http://localhost:${PORT}`);
    console.log("保存先: Supabase（注文ごとのテーブル方式）");
    if (SITE_PASSWORD === "festival1234") console.warn("注意: 既定パスワードを使用中です。SITE_PASSWORDを設定してください。");
  });
}

startServer().catch((error) => {
  console.error("サーバー起動に失敗しました:", error);
  process.exit(1);
});
