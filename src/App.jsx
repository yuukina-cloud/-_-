import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Ban,
  LayoutDashboard,
  Monitor,
  Receipt,
  ShoppingCart,
  Store,
  Undo2,
  Sparkles,
  CheckCircle2,
  Clock3,
  XCircle,
  ChefHat,
} from "lucide-react";

const FESTIVAL_NAME = "第〇回高専祭";

const stalls = [
  {
    id: "A",
    grade: "3-br",
    category: "主菜",
    name: "こんばん屋",
    menus: [
      { id: "1", name: "カレー", price: 300, image: "🍛" },
      { id: "2", name: "うどん", price: 200, image: "🍜" },
    ],
  },
  {
    id: "B",
    grade: "5-mi",
    category: "主菜",
    name: "わが屋",
    menus: [{ id: "3", name: "パン", price: 500, image: "🍞" }],
  },
  {
    id: "C",
    grade: "4-br",
    category: "デザート",
    name: "こんにち屋",
    menus: [
      { id: "4", name: "ホットケーキ（チョコ）", price: 200, image: "🥞🍫" },
      { id: "5", name: "ホットケーキ（ストロベリー）", price: 200, image: "🥞🍓" },
    ],
  },
];

const allMenus = stalls.flatMap((stall) =>
  stall.menus.map((menu) => ({
    ...menu,
    stallId: stall.id,
    stallName: stall.name,
    grade: stall.grade,
    category: stall.category,
  }))
);

const grades = ["全部", "3-br", "4-br", "5-mi"];
const categories = ["全部", "主菜", "デザート"];

const yen = (n) => `¥${n.toLocaleString("ja-JP")}`;
const pad3 = (n) => String(n).padStart(3, "0");
const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
const fmtDate = (iso) => new Date(iso).toLocaleString("ja-JP");
const orderNo = (stallId, seq, menuId) => `${stallId}-${pad3(seq)}-${menuId}`;

const cx = (...arr) => arr.filter(Boolean).join(" ");

const panel =
  "rounded-3xl border border-slate-200/80 bg-white/90 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur";
const softPanel =
  "rounded-2xl border border-slate-200 bg-slate-50/80 shadow-sm";
const buttonBase =
  "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-medium transition active:scale-[0.98]";
const buttonGhost =
  "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50";
const buttonPrimary =
  "bg-slate-900 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50";
const buttonDanger =
  "bg-rose-600 text-white hover:bg-rose-500";
const chipBase =
  "rounded-full border px-3 py-1.5 text-sm font-medium transition";

function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-6 text-slate-900 md:px-6 xl:px-8">
      <div className="mx-auto max-w-7xl space-y-6">{children}</div>
    </div>
  );
}

function HeaderHero() {
  return (
    <div className={cx(panel, "overflow-hidden p-6 md:p-8")}>
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="relative z-10 max-w-3xl">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold tracking-wide text-white">
              学園祭 屋台会計システム
            </span>
            <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
              デザイン改善版
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            注文・受け取り・停止管理を
            <span className="bg-gradient-to-r from-slate-900 to-violet-700 bg-clip-text text-transparent">
              ひと目で使いやすく
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
            今のVite環境で貼り替えやすい1ファイル構成のまま、見やすさ・押しやすさ・情報整理を強化したUIです。
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[420px]">
          {[
            [Monitor, "注文端末", "コン1"],
            [Store, "屋台管理", "コン2"],
            [LayoutDashboard, "統合監視", "コン3"],
            [Sparkles, "軽量構成", "Vite対応"],
          ].map(([Icon, title, sub]) => (
            <div
              key={title}
              className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur"
            >
              <Icon size={18} className="text-violet-600" />
              <div className="mt-3 text-sm font-semibold">{title}</div>
              <div className="text-xs text-slate-500">{sub}</div>
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-200/40 blur-3xl" />
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        {Icon ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
            <Icon size={18} />
          </div>
        ) : null}
        <div>
          <div className="text-lg font-bold tracking-tight">{title}</div>
          {subtitle ? <div className="text-sm text-slate-500">{subtitle}</div> : null}
        </div>
      </div>
    </div>
  );
}

function PillTabs({ title, options, value, onChange, label = (x) => x }) {
  return (
    <div className={cx(softPanel, "p-4")}>
      <div className="mb-3 text-sm font-semibold text-slate-700">{title}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={cx(
                chipBase,
                active
                  ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              {label(opt)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatusPill({ type, children }) {
  const styles = {
    waiting: "bg-amber-50 text-amber-700 border-amber-200",
    done: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancel: "bg-rose-50 text-rose-700 border-rose-200",
    stop: "bg-red-50 text-red-700 border-red-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span className={cx("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", styles[type] || styles.neutral)}>
      {children}
    </span>
  );
}

function MenuGrid({ menus, stopMap, onAdd, showAdd = true }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {menus.map((menu, i) => {
        const stopped = !!stopMap[menu.id];
        return (
          <motion.div
            key={`${menu.stallId}-${menu.id}-${i}`}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.18 }}
            className={cx(panel, "overflow-hidden p-0")}
          >
            <div className="h-2 bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-500" />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-5xl leading-none">{menu.image}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusPill type="neutral">{menu.stallName}</StatusPill>
                    <StatusPill type="neutral">{menu.grade}</StatusPill>
                  </div>
                </div>
                {stopped ? <StatusPill type="stop">注文停止中</StatusPill> : null}
              </div>

              <div className="mt-4 text-lg font-bold leading-snug">{menu.name}</div>
              <div className="mt-1 text-sm text-slate-500">{menu.category}</div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-500">税込価格</div>
                  <div className="text-2xl font-bold tracking-tight">{yen(menu.price)}</div>
                </div>
                {stopped ? (
                  <div className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm">
                    現在注文できません
                  </div>
                ) : showAdd ? (
                  <button className={cx(buttonBase, buttonPrimary)} onClick={() => onAdd(menu)}>
                    カゴに追加
                  </button>
                ) : null}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function CartPanel({ cart, total, onRemove, onSubmit, interactive = true }) {
  return (
    <div className={cx(panel, "p-5")}>
      <SectionTitle icon={ShoppingCart} title="注文カゴ" subtitle="選んだメニューを確認できます" />

      <div className="space-y-3">
        {!cart.length && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            カゴは空です。メニューを追加してください。
          </div>
        )}

        {cart.map((item) => (
          <div
            key={item.cartId}
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div>
              <div className="font-semibold">{item.menuName}</div>
              <div className="mt-1 text-xs text-slate-500">
                {item.stallName} ・ {yen(item.price)}
              </div>
            </div>
            {interactive ? (
              <button className={cx(buttonBase, buttonGhost)} onClick={() => onRemove(item.cartId)}>
                削除
              </button>
            ) : null}
          </div>
        ))}

        <div className="rounded-2xl bg-slate-900 p-4 text-white">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>合計金額</span>
            <span>{cart.length}点</span>
          </div>
          <div className="mt-2 text-3xl font-bold tracking-tight">{yen(total)}</div>
        </div>

        {interactive ? (
          <button
            className={cx(buttonBase, buttonPrimary, "w-full py-3 text-base font-bold")}
            disabled={!cart.length}
            onClick={onSubmit}
          >
            注文を確定する
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ReceiptDialog({ receipts, onClose }) {
  if (!receipts.length) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ y: 16, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 12, opacity: 0, scale: 0.98 }}
          className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-[28px] border border-white/20 bg-white p-6 shadow-2xl"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <SectionTitle icon={Receipt} title="レシート一覧" subtitle="注文後に発行される控えです" />
            <button className={cx(buttonBase, buttonGhost)} onClick={onClose}>
              閉じる
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {receipts.map((o) => (
              <div
                key={o.id}
                className="rounded-[24px] border border-dashed border-slate-300 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)] p-5 font-mono text-sm leading-7 shadow-sm"
              >
                <div className="text-center text-base font-bold tracking-wide">{FESTIVAL_NAME}</div>
                <div className="mt-3 border-t border-dashed border-slate-300 pt-3">
                  <div>屋台名「{o.stallName}」</div>
                  <div>注文名「{o.menuName}」</div>
                  <div>注文番号 {o.orderNumber}</div>
                </div>
                <div className="mt-4 text-center text-base">〈領収証〉</div>
                <div className="mt-2">合計　{o.menuName}　{yen(o.price)}（税込）</div>
                <div>注文日 {fmtDate(o.createdAt)}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function useCustomerView(orders, stopMap, onCreateOrders, resetAfterSubmit = false) {
  const [category, setCategory] = useState("全部");
  const [grade, setGrade] = useState("全部");
  const [stallId, setStallId] = useState("全部");
  const [cart, setCart] = useState([]);
  const [receipts, setReceipts] = useState([]);

  const filteredStalls = useMemo(
    () =>
      stalls.filter(
        (s) =>
          (category === "全部" || s.category === category) &&
          (grade === "全部" || s.grade === grade)
      ),
    [category, grade]
  );

  const menus = useMemo(() => {
    if (stallId === "全部") {
      return filteredStalls.flatMap((s) =>
        s.menus.map((m) => ({
          ...m,
          stallId: s.id,
          stallName: s.name,
          grade: s.grade,
          category: s.category,
        }))
      );
    }
    const stall = filteredStalls.find((s) => s.id === stallId);
    return stall
      ? stall.menus.map((m) => ({
          ...m,
          stallId: stall.id,
          stallName: stall.name,
          grade: stall.grade,
          category: stall.category,
        }))
      : [];
  }, [filteredStalls, stallId]);

  const total = useMemo(() => cart.reduce((sum, x) => sum + x.price, 0), [cart]);

  const add = (m) =>
    setCart((prev) => [
      ...prev,
      {
        cartId: crypto.randomUUID(),
        stallId: m.stallId,
        stallName: m.stallName,
        menuId: m.id,
        menuName: m.name,
        price: m.price,
      },
    ]);

  const remove = (id) => setCart((prev) => prev.filter((x) => x.cartId !== id));

  const reset = () => {
    setCategory("全部");
    setGrade("全部");
    setStallId("全部");
    setCart([]);
  };

  const submit = () => {
    if (!cart.length) return;
    const created = onCreateOrders(cart);
    setReceipts(created);
    setCart([]);
    if (resetAfterSubmit) {
      setCategory("全部");
      setGrade("全部");
      setStallId("全部");
    }
  };

  return {
    category,
    setCategory,
    grade,
    setGrade,
    stallId,
    setStallId,
    filteredStalls,
    menus,
    cart,
    receipts,
    setReceipts,
    total,
    add,
    remove,
    submit,
    reset,
    stopMap,
    orders,
  };
}

function CustomerTerminal({
  orders,
  stopMap,
  onCreateOrders,
  title = "コン1（注文）",
  interactive = true,
  resetAfterSubmit = false,
}) {
  const v = useCustomerView(orders, stopMap, onCreateOrders, resetAfterSubmit);

  return (
    <div className={cx(panel, "p-5 md:p-6")}>
      <SectionTitle icon={Monitor} title={title} subtitle="来場者向けの注文画面" />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-violet-50 p-4">
          <div className="text-xs text-violet-700">表示中メニュー</div>
          <div className="mt-1 text-2xl font-bold">{v.menus.length}</div>
        </div>
        <div className="rounded-2xl bg-sky-50 p-4">
          <div className="text-xs text-sky-700">カゴ内商品数</div>
          <div className="mt-1 text-2xl font-bold">{v.cart.length}</div>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-4">
          <div className="text-xs text-emerald-700">現在合計</div>
          <div className="mt-1 text-2xl font-bold">{yen(v.total)}</div>
        </div>
      </div>

      <div className="space-y-4">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <PillTabs title="1. 種類を選ぶ" options={categories} value={v.category} onChange={v.setCategory} />
    <PillTabs title="2. 学年・学科を選ぶ" options={grades} value={v.grade} onChange={v.setGrade} />
    <PillTabs
      title="3. 屋台を選ぶ"
      options={["全部", ...v.filteredStalls.map((s) => s.id)]}
      value={v.stallId}
      onChange={v.setStallId}
      label={(id) =>
        id === "全部"
          ? "全部"
          : `${stalls.find((s) => s.id === id)?.name}（${stalls.find((s) => s.id === id)?.grade}）`
      }
    />
  </div>

  <div className={cx(softPanel, "p-4 md:p-5")}>
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <div className="text-sm text-slate-500">4. メニュー表</div>
        <div className="text-lg font-bold">注文したい商品を選んでください</div>
      </div>
      {interactive ? (
        <button className={cx(buttonBase, buttonGhost)} onClick={v.reset}>
          絞り込みをリセット
        </button>
      ) : null}
    </div>

    {v.menus.length ? (
      <MenuGrid menus={v.menus} stopMap={stopMap} onAdd={v.add} showAdd={interactive} />
    ) : (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        条件に合うメニューがありません。
      </div>
    )}
  </div>

  {interactive ? (
    <CartPanel cart={v.cart} total={v.total} onRemove={v.remove} onSubmit={v.submit} />
  ) : null}

  <ReceiptDialog receipts={v.receipts} onClose={() => v.setReceipts([])} />
</div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone = "slate" }) {
  const toneMap = {
    slate: "bg-slate-50 text-slate-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    violet: "bg-violet-50 text-violet-700",
  };

  return (
    <div className={cx(panel, "p-4")}>
      <div className="flex items-center gap-3">
        <div className={cx("flex h-11 w-11 items-center justify-center rounded-2xl", toneMap[tone])}>
          <Icon size={18} />
        </div>
        <div>
          <div className="text-sm text-slate-500">{label}</div>
          <div className="text-3xl font-bold tracking-tight">{value}</div>
        </div>
      </div>
    </div>
  );
}

function BoothTerminal({ orders, stopMap, onToggleReceived, onToggleStop, title = "コン2（屋台側管理）" }) {
  const [stallTab, setStallTab] = useState(stalls[0].id);

  const ordersByStall = useMemo(
    () =>
      Object.fromEntries(
        stalls.map((s) => [
          s.id,
          [...orders]
            .filter((o) => o.stallId === s.id)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
        ])
      ),
    [orders]
  );

  const currentStall = stalls.find((s) => s.id === stallTab) || stalls[0];
  const list = ordersByStall[currentStall.id] || [];

  const detail = {
    active: list.filter((o) => !o.canceled).length,
    canceled: list.filter((o) => o.canceled).length,
    waiting: list.filter((o) => !o.canceled && o.status === "未").length,
    received: list.filter((o) => !o.canceled && o.status === "受け取り済").length,
  };

  return (
    <div className={cx(panel, "p-5 md:p-6")}>
      <SectionTitle icon={Store} title={title} subtitle="屋台ごとの注文確認と停止管理" />

      <div className="mb-4 flex flex-wrap gap-2">
        {stalls.map((s) => {
          const active = stallTab === s.id;
          return (
            <button
              key={s.id}
              className={cx(
                buttonBase,
                active ? buttonPrimary : buttonGhost
              )}
              onClick={() => setStallTab(s.id)}
            >
              <ChefHat size={15} className="mr-2" />
              {s.name}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Receipt} label="有効注文" value={detail.active} tone="violet" />
        <StatCard icon={Clock3} label="受け取り待ち" value={detail.waiting} tone="amber" />
        <StatCard icon={CheckCircle2} label="受け取り済" value={detail.received} tone="emerald" />
        <StatCard icon={XCircle} label="取消" value={detail.canceled} tone="rose" />
      </div>

      <div className={cx(softPanel, "mt-5 p-4 md:p-5")}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <div className="text-sm text-slate-500">{currentStall.name}</div>
            <div className="text-lg font-bold">注文早見表（早い時間順）</div>
          </div>
        </div>

        <div className="space-y-3">
          {!list.length && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              まだ注文はありません。
            </div>
          )}

          {list.map((o) => (
            <div
              key={o.id}
              className={cx(
                "grid gap-3 rounded-2xl border p-4 md:grid-cols-[90px_1fr_110px_170px] md:items-center",
                o.canceled ? "border-slate-200 bg-slate-100/80 line-through" : "border-slate-200 bg-white"
              )}
            >
              <div className="text-sm font-medium text-slate-500">{fmtTime(o.createdAt)}</div>
              <div>
                <div className="font-semibold">{o.orderNumber}</div>
                <div className="text-sm text-slate-500">{o.menuName}</div>
              </div>
              <div>
                {o.canceled ? (
                  <StatusPill type="cancel">取消</StatusPill>
                ) : o.status === "未" ? (
                  <StatusPill type="waiting">未</StatusPill>
                ) : (
                  <StatusPill type="done">受け取り済</StatusPill>
                )}
              </div>
              <div>
                {!o.canceled ? (
                  <button className={cx(buttonBase, buttonGhost, "w-full")} onClick={() => onToggleReceived(o.id)}>
                    {o.status === "未" ? "受け取り済にする" : "未に戻す"}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {currentStall.menus.map((m) => {
          const menuOrders = list.filter((o) => o.menuId === m.id);
          const stopped = !!stopMap[m.id];

          return (
            <div key={m.id} className={cx(panel, "p-5")}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-slate-500">メニュー</div>
                  <div className="text-lg font-bold">{m.name}</div>
                </div>
                <button
                  className={cx(buttonBase, stopped ? buttonDanger : buttonGhost)}
                  onClick={() => onToggleStop(m.id)}
                >
                  <Ban size={14} className="mr-2" />
                  {stopped ? "停止解除" : "注文ストップ"}
                </button>
              </div>

              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-slate-500">注文数</span>
                <span className="font-semibold">{menuOrders.length}件</span>
              </div>

              <div className="space-y-2">
                {!menuOrders.length && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                    このメニューの注文はまだありません。
                  </div>
                )}

                {menuOrders.map((o) => (
                  <div
                    key={o.id}
                    className={cx(
                      "rounded-2xl border p-3 text-sm",
                      o.canceled ? "border-slate-200 bg-slate-100 line-through" : "border-slate-200 bg-white"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500">{fmtTime(o.createdAt)}</span>
                      {o.canceled ? (
                        <StatusPill type="cancel">取消</StatusPill>
                      ) : o.status === "未" ? (
                        <StatusPill type="waiting">未</StatusPill>
                      ) : (
                        <StatusPill type="done">受け取り済</StatusPill>
                      )}
                    </div>
                    <div className="mt-2 font-semibold">{o.orderNumber}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonitorTerminal({ orders, stopMap, notifications, onCancelOrder, onCreateOrders, onToggleReceived, onToggleStop }) {
  const [tab, setTab] = useState("customer");

  const activeStops = allMenus.filter((m) => stopMap[m.id]);
  const fullyStoppedStalls = stalls.filter((s) => s.menus.every((m) => stopMap[m.id]));
  const recent = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);
  const partialStops = activeStops.filter(
    (m) => !fullyStoppedStalls.some((s) => s.id === m.stallId)
  );

  return (
    <div className={cx(panel, "p-5 md:p-6")}>
      <SectionTitle icon={LayoutDashboard} title="コン3（監視・統合）" subtitle="全体状況の確認と取消対応" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Receipt} label="総注文数" value={orders.length} tone="violet" />
        <StatCard icon={CheckCircle2} label="有効注文" value={orders.filter((o) => !o.canceled).length} tone="emerald" />
        <StatCard icon={XCircle} label="取消数" value={orders.filter((o) => o.canceled).length} tone="rose" />
        <StatCard icon={Clock3} label="受け取り待ち" value={orders.filter((o) => !o.canceled && o.status === "未").length} tone="amber" />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className={cx(softPanel, "p-4 md:p-5")}>
          <div className="mb-3 text-lg font-bold">注文ストップ情報</div>
          <div className="space-y-2 text-sm">
            {!fullyStoppedStalls.length && !partialStops.length ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-slate-500">
                現在、停止中のメニューはありません。
              </div>
            ) : null}

            {fullyStoppedStalls.map((s) => (
              <div key={s.id} className="rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">
                {s.name} は注文停止
              </div>
            ))}

            {partialStops.map((m) => (
              <div key={m.id} className="rounded-2xl border border-red-100 bg-red-50/70 p-4 text-red-700">
                <span className="font-semibold">{m.stallName}</span> / {m.name} は注文停止中
              </div>
            ))}
          </div>
        </div>

        <div className={cx(softPanel, "p-4 md:p-5")}>
          <div className="mb-3 flex items-center gap-2 text-lg font-bold">
            <Bell size={18} className="text-violet-600" />
            通知
          </div>
          <div className="space-y-2">
            {!notifications.length ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
                通知はありません。
              </div>
            ) : (
              [...notifications].reverse().map((n) => (
                <div key={n.id} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                  <div className="font-medium">{n.message}</div>
                  <div className="mt-1 text-xs text-slate-500">{fmtDate(n.createdAt)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className={cx(softPanel, "mt-5 p-4 md:p-5")}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm text-slate-500">注文済み一覧</div>
            <div className="text-lg font-bold">取消対応</div>
          </div>
        </div>

        <div className="space-y-3">
          {!recent.length && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              注文はまだありません。
            </div>
          )}

          {recent.map((o) => (
            <div
              key={o.id}
              className={cx(
                "flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4",
                o.canceled ? "border-slate-200 bg-slate-100 line-through" : "border-slate-200 bg-white"
              )}
            >
              <div>
                <div className="font-semibold">{o.stallName} / {o.menuName}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {o.orderNumber} / {fmtDate(o.createdAt)}
                </div>
              </div>
              {!o.canceled ? (
                <button className={cx(buttonBase, buttonGhost)} onClick={() => onCancelOrder(o.id)}>
                  <Undo2 size={14} className="mr-2" />
                  取消する
                </button>
              ) : (
                <StatusPill type="cancel">取消済</StatusPill>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          className={cx(buttonBase, tab === "customer" ? buttonPrimary : buttonGhost)}
          onClick={() => setTab("customer")}
        >
          コン1の表示
        </button>
        <button
          className={cx(buttonBase, tab === "booth" ? buttonPrimary : buttonGhost)}
          onClick={() => setTab("booth")}
        >
          コン2の機能
        </button>
      </div>

      <div className="mt-5">
        {tab === "customer" ? (
          <CustomerTerminal
            orders={orders}
            stopMap={stopMap}
            onCreateOrders={onCreateOrders}
            title="コン3内 コン1表示"
            interactive={false}
          />
        ) : (
          <BoothTerminal
            orders={orders}
            stopMap={stopMap}
            onToggleReceived={onToggleReceived}
            onToggleStop={onToggleStop}
            title="コン3内 コン2機能"
          />
        )}
      </div>
    </div>
  );
}

export default function FestivalAccountingSystemPrototype() {
  const [orders, setOrders] = useState([]);
  const [seqByStall, setSeqByStall] = useState({ A: 0, B: 0, C: 0 });
  const [stopMap, setStopMap] = useState({});
  const [notifications, setNotifications] = useState([]);

  const notify = (message) =>
    setNotifications((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        message,
        createdAt: new Date().toISOString(),
      },
    ]);

  const handleCreateOrders = (cartItems) => {
    const now = new Date().toISOString();
    const nextSeq = { ...seqByStall };

    const created = cartItems.map((item) => {
      nextSeq[item.stallId] = (nextSeq[item.stallId] || 0) + 1;
      return {
        id: crypto.randomUUID(),
        createdAt: now,
        stallId: item.stallId,
        stallName: item.stallName,
        menuId: item.menuId,
        menuName: item.menuName,
        price: item.price,
        orderNumber: orderNo(item.stallId, nextSeq[item.stallId], item.menuId),
        status: "未",
        canceled: false,
      };
    });

    setSeqByStall(nextSeq);
    setOrders((prev) => [...prev, ...created]);
    return created;
  };

  const handleCancelOrder = (id) =>
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, canceled: true } : o)));

  const handleToggleReceived = (id) =>
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, status: o.status === "未" ? "受け取り済" : "未" } : o
      )
    );

  const handleToggleStop = (menuId) =>
    setStopMap((prev) => {
      const next = { ...prev, [menuId]: !prev[menuId] };
      const m = allMenus.find((x) => x.id === menuId);
      notify(`${m?.stallName ?? "屋台"} / ${m?.name ?? menuId} が ${next[menuId] ? "注文停止" : "停止解除"} されました`);
      return next;
    });

  const shared = {
    orders,
    stopMap,
    onCreateOrders: handleCreateOrders,
    onToggleReceived: handleToggleReceived,
    onToggleStop: handleToggleStop,
    notifications,
    onCancelOrder: handleCancelOrder,
  };

  return (
  <div className="h-screen overflow-y-scroll snap-y snap-mandatory bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] text-slate-900">
    <div className="snap-start min-h-screen px-4 py-6 md:px-6 xl:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <HeaderHero />
        <CustomerTerminal
          orders={shared.orders}
          stopMap={shared.stopMap}
          onCreateOrders={shared.onCreateOrders}
          resetAfterSubmit={true}
        />
      </div>
    </div>

    <div className="snap-start min-h-screen px-4 py-6 md:px-6 xl:px-8">
      <div className="mx-auto max-w-7xl">
        <BoothTerminal
          orders={shared.orders}
          stopMap={shared.stopMap}
          onToggleReceived={shared.onToggleReceived}
          onToggleStop={shared.onToggleStop}
        />
      </div>
    </div>

    <div className="snap-start min-h-screen px-4 py-6 md:px-6 xl:px-8">
      <div className="mx-auto max-w-7xl">
        <MonitorTerminal {...shared} />
      </div>
    </div>
  </div>
);}