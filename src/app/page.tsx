"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Payment = {
  id: string;
  amount: number;
  createdAt: string;
  note: string;
};

type Member = {
  id: string;
  name: string;
  birthday: string;
  avatar: string;
  paidAmount: number;
  payments: Payment[];
};

type NotificationState = NotificationPermission | "unsupported";

const matchFee = 50_000;
const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

const gradients = [
  ["#ff7a59", "#ffd166"],
  ["#5c6bc0", "#7dd3fc"],
  ["#10b981", "#bef264"],
  ["#ec4899", "#fbcfe8"],
  ["#7c3aed", "#c4b5fd"],
  ["#0891b2", "#99f6e4"],
];

function makeAvatar(name: string, index = 0) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  const [from, to] = gradients[index % gradients.length];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="${from}"/>
          <stop offset="1" stop-color="${to}"/>
        </linearGradient>
      </defs>
      <rect width="220" height="220" rx="58" fill="url(#g)"/>
      <circle cx="110" cy="82" r="38" fill="rgba(255,255,255,.86)"/>
      <path d="M40 190c12-47 43-72 70-72s58 25 70 72" fill="rgba(255,255,255,.78)"/>
      <text x="110" y="124" text-anchor="middle" font-family="Arial" font-size="42" font-weight="800" fill="#111827">${initials}</text>
    </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const starterMembers: Member[] = [
  {
    id: "minh-quan",
    name: "Nguyễn Minh Quân",
    birthday: "2001-05-20",
    avatar: makeAvatar("Nguyễn Minh Quân", 0),
    paidAmount: 100_000,
    payments: [
      {
        id: "p-1",
        amount: 50_000,
        createdAt: "2026-05-01",
        note: "Trận đầu tháng",
      },
      {
        id: "p-2",
        amount: 50_000,
        createdAt: "2026-05-08",
        note: "Cộng dồn trận sau",
      },
    ],
  },
  {
    id: "hoang-anh",
    name: "Trần Hoàng Anh",
    birthday: "2000-09-12",
    avatar: makeAvatar("Trần Hoàng Anh", 1),
    paidAmount: 50_000,
    payments: [
      {
        id: "p-3",
        amount: 50_000,
        createdAt: "2026-05-01",
        note: "Đã đóng 1 trận",
      },
    ],
  },
  {
    id: "duc-hai",
    name: "Phạm Đức Hải",
    birthday: "1999-12-04",
    avatar: makeAvatar("Phạm Đức Hải", 2),
    paidAmount: 0,
    payments: [],
  },
  {
    id: "gia-huy",
    name: "Lê Gia Huy",
    birthday: "2002-02-18",
    avatar: makeAvatar("Lê Gia Huy", 3),
    paidAmount: 150_000,
    payments: [
      {
        id: "p-4",
        amount: 150_000,
        createdAt: "2026-05-10",
        note: "Đóng trước 3 trận",
      },
    ],
  },
];

function parseDateParts(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

function formatBirthday(value: string) {
  const { year, month, day } = parseDateParts(value);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(
    2,
    "0",
  )}/${year}`;
}

function isBirthdayToday(value: string) {
  const today = new Date();
  const { month, day } = parseDateParts(value);
  return today.getDate() === day && today.getMonth() + 1 === month;
}

function createId(value: string) {
  return `${value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}-${Date.now()}`;
}

function getNotificationState(): NotificationState {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  return Notification.permission;
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return false;
  }

  try {
    await navigator.serviceWorker.register("/sw.js");
    return true;
  } catch {
    return false;
  }
}

export default function Home() {
  const [members, setMembers] = useState<Member[]>(starterMembers);
  const [query, setQuery] = useState("Nguyễn Minh Quân");
  const [matchCount, setMatchCount] = useState(2);
  const [selectedMemberId, setSelectedMemberId] = useState(starterMembers[0].id);
  const [paymentAmount, setPaymentAmount] = useState(matchFee);
  const [paymentNote, setPaymentNote] = useState("Đóng thêm 1 trận");
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [notificationState, setNotificationState] =
    useState<NotificationState>("default");
  const [birthdayStatus, setBirthdayStatus] = useState(
    "App sẽ tự thông báo trên điện thoại khi đến sinh nhật thành viên.",
  );
  const [newMember, setNewMember] = useState({
    name: "",
    birthday: "",
    avatar: "",
  });

  useEffect(() => {
    const saved = window.localStorage.getItem("hbt-football-app");
    const parsed = saved
      ? (JSON.parse(saved) as {
          members?: Member[];
          matchCount?: number;
        })
      : null;

    const frame = window.requestAnimationFrame(() => {
      setNotificationState(getNotificationState());
      void registerServiceWorker();

      if (parsed?.members?.length) {
        setMembers(parsed.members);
        setSelectedMemberId(parsed.members[0].id);
        setQuery(parsed.members[0].name);
      }

      if (parsed?.matchCount) {
        setMatchCount(parsed.matchCount);
      }

      setHasLoadedData(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hasLoadedData) {
      return;
    }

    window.localStorage.setItem(
      "hbt-football-app",
      JSON.stringify({ members, matchCount }),
    );
  }, [hasLoadedData, members, matchCount]);

  const expectedAmount = matchCount * matchFee;
  const selectedMember = members.find((member) => member.id === selectedMemberId);
  const foundMember = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return members[0];
    }

    return members.find((member) =>
      member.name.toLowerCase().includes(normalizedQuery),
    );
  }, [members, query]);
  const birthdaysToday = useMemo(
    () => members.filter((member) => isBirthdayToday(member.birthday)),
    [members],
  );
  const totalPaid = members.reduce((total, member) => total + member.paidAmount, 0);
  const totalExpected = members.length * expectedAmount;
  const completionRate = totalExpected
    ? Math.min(100, Math.round((totalPaid / totalExpected) * 100))
    : 0;
  const unpaidMembers = members.filter(
    (member) => member.paidAmount < expectedAmount,
  ).length;

  const showBirthdayNotification = useCallback(
    async (source: "auto" | "manual") => {
      if (birthdaysToday.length === 0) {
        setBirthdayStatus("Hôm nay chưa có sinh nhật thành viên nào.");
        return false;
      }

      if (getNotificationState() !== "granted") {
        setBirthdayStatus(
          "Bạn cần bấm bật thông báo để app nhắc trên điện thoại.",
        );
        return false;
      }

      const names = birthdaysToday.map((member) => member.name).join(", ");
      const notification = {
        body: `Hôm nay là sinh nhật của ${names}. Nhớ chúc mừng nhé!`,
        icon: birthdaysToday[0].avatar,
        badge: birthdaysToday[0].avatar,
        tag: `hbt-birthday-${new Date().toISOString().slice(0, 10)}`,
      };

      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification("Sinh nhật hôm nay", notification);
      } else {
        new Notification("Sinh nhật hôm nay", notification);
      }

      setBirthdayStatus(
        source === "auto"
          ? `Đã tự thông báo sinh nhật của ${names} trên thiết bị.`
          : `Đã gửi thử thông báo sinh nhật của ${names}.`,
      );
      return true;
    },
    [birthdaysToday],
  );

  useEffect(() => {
    if (
      !hasLoadedData ||
      notificationState !== "granted" ||
      birthdaysToday.length === 0
    ) {
      return;
    }

    const todayKey = new Date().toISOString().slice(0, 10);
    const storageKey = `hbt-birthday-device-${todayKey}`;
    if (window.localStorage.getItem(storageKey)) {
      const frame = window.requestAnimationFrame(() => {
        setBirthdayStatus("Sinh nhật hôm nay đã được nhắc trên thiết bị rồi.");
      });

      return () => window.cancelAnimationFrame(frame);
    }

    const frame = window.requestAnimationFrame(() => {
      void showBirthdayNotification("auto").then((sent) => {
        if (sent) {
          window.localStorage.setItem(storageKey, "done");
        }
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [birthdaysToday, hasLoadedData, notificationState, showBirthdayNotification]);

  async function enableDeviceNotifications() {
    if (!("Notification" in window)) {
      setNotificationState("unsupported");
      setBirthdayStatus(
        "Trình duyệt này chưa hỗ trợ Notification API. Với iPhone, hãy deploy bản mới, xoá icon cũ và thêm lại app vào màn hình chính.",
      );
      return;
    }

    const hasServiceWorker = await registerServiceWorker();
    if (!hasServiceWorker) {
      setBirthdayStatus(
        "Chưa đăng ký được service worker. Hãy mở bản deploy HTTPS trên Vercel rồi thử lại.",
      );
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationState(permission);

    if (permission === "granted") {
      await showBirthdayNotification("manual");
      return;
    }

    setBirthdayStatus(
      permission === "denied"
        ? "Bạn đã chặn thông báo. Hãy mở lại quyền thông báo trong cài đặt trình duyệt."
        : "Chưa bật thông báo nên app chỉ hiển thị nhắc trong giao diện.",
    );
  }

  function addPayment() {
    if (!selectedMember || paymentAmount <= 0) {
      return;
    }

    const payment: Payment = {
      id: crypto.randomUUID(),
      amount: paymentAmount,
      createdAt: new Date().toISOString(),
      note: paymentNote || "Đóng tiền bóng",
    };

    setMembers((current) =>
      current.map((member) =>
        member.id === selectedMember.id
          ? {
              ...member,
              paidAmount: member.paidAmount + paymentAmount,
              payments: [payment, ...member.payments],
            }
          : member,
      ),
    );
  }

  function uploadAvatar(file: File | undefined) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setBirthdayStatus("File upload phải là ảnh cầu thủ.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setNewMember((current) => ({
        ...current,
        avatar: String(reader.result),
      }));
      setBirthdayStatus("Đã chọn ảnh cầu thủ. Bấm thêm vào đội để lưu.");
    };
    reader.readAsDataURL(file);
  }

  function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newMember.name.trim() || !newMember.birthday) {
      return;
    }

    const member: Member = {
      id: createId(newMember.name),
      name: newMember.name.trim(),
      birthday: newMember.birthday,
      avatar: newMember.avatar || makeAvatar(newMember.name, members.length),
      paidAmount: 0,
      payments: [],
    };

    setMembers((current) => [...current, member]);
    setSelectedMemberId(member.id);
    setQuery(member.name);
    setNewMember({ name: "", birthday: "", avatar: "" });
  }

  function deleteMember(memberId: string) {
    const member = members.find((item) => item.id === memberId);
    const nextMembers = members.filter((item) => item.id !== memberId);

    setMembers(nextMembers);

    if (selectedMemberId === memberId) {
      setSelectedMemberId(nextMembers[0]?.id ?? "");
    }

    if (foundMember?.id === memberId) {
      setQuery(nextMembers[0]?.name ?? "");
    }

    setBirthdayStatus(
      member
        ? `Đã xoá ${member.name}. Dữ liệu mới đã được lưu trên máy.`
        : "Đã xoá cầu thủ. Dữ liệu mới đã được lưu trên máy.",
    );
  }

  return (
    <main className="app-background min-h-screen overflow-hidden px-4 py-5 text-slate-950 sm:px-6 lg:px-10">
      <div className="background-overlay pointer-events-none fixed inset-0" />

      <section className="app-shell relative mx-auto">
        <header className="hero-card">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-orange-100">
                Đoàn kết Hai Bà Trưng
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.06em] text-white sm:text-5xl">
                Quản lý đội bóng gọn như một app mobile
              </h1>
              <p className="mt-4 max-w-xl text-base font-medium leading-7 text-white/75">
                Tìm ngày sinh, xem ảnh thành viên, cộng dồn tiền sân và nhận
                nhắc sinh nhật ngay trên máy đang dùng.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-white sm:min-w-[420px]">
              <div className="metric-card">
                <span>Quỹ đã thu</span>
                <strong>{currency.format(totalPaid)}</strong>
              </div>
              <div className="metric-card">
                <span>Số trận</span>
                <strong>{matchCount}</strong>
              </div>
              <div className="metric-card">
                <span>Hoàn tất</span>
                <strong>{completionRate}%</strong>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_.82fr]">
          <div className="grid gap-5">
            <section className="panel">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex-1">
                  <p className="eyebrow">Tra cứu thành viên</p>
                  <h2 className="section-title">Nhập tên là ra hồ sơ</h2>
                </div>
                <label className="search-box md:min-w-[360px]">
                  <span>Tên thành viên</span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Ví dụ: Minh Quân"
                  />
                </label>
              </div>

              {foundMember ? (
                <div className="member-spotlight mt-5">
                  <Image
                    src={foundMember.avatar}
                    alt={`Ảnh ${foundMember.name}`}
                    width={128}
                    height={128}
                    unoptimized
                    className="h-28 w-28 rounded-[2rem] object-cover shadow-xl sm:h-32 sm:w-32"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-3xl font-black tracking-[-0.05em] text-slate-950">
                        {foundMember.name}
                      </h3>
                      <span
                        className={`status-pill ${
                          isBirthdayToday(foundMember.birthday)
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {isBirthdayToday(foundMember.birthday)
                          ? "Hôm nay sinh nhật"
                          : "Đã lưu hồ sơ"}
                      </span>
                    </div>
                    <p className="mt-3 text-lg font-bold text-slate-600">
                      Sinh ngày {formatBirthday(foundMember.birthday)}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Đã đóng {currency.format(foundMember.paidAmount)} trên tổng
                      cần đóng {currency.format(expectedAmount)}.
                    </p>
                    <button
                      className="danger-button mt-4"
                      onClick={() => deleteMember(foundMember.id)}
                    >
                      Xoá cầu thủ này
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center font-semibold text-slate-500">
                  Chưa tìm thấy tên này. Bạn có thể thêm thành viên mới bên dưới.
                </div>
              )}
            </section>

            <section className="panel">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow">Tiền đóng đội bóng</p>
                  <h2 className="section-title">Cộng dồn theo từng lần đóng</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Mặc định 1 trận là {currency.format(matchFee)}. Ví dụ đóng
                    50.000đ hôm nay, lần sau đóng thêm 50.000đ thì tổng là
                    100.000đ.
                  </p>
                </div>
                <button
                  className="primary-button"
                  onClick={() => setMatchCount((current) => current + 1)}
                >
                  + Thêm 1 trận
                </button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-4">
                <label className="field">
                  <span>Người đóng</span>
                  <select
                    value={selectedMemberId}
                    onChange={(event) => setSelectedMemberId(event.target.value)}
                  >
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Số tiền</span>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(event) =>
                      setPaymentAmount(Number(event.target.value))
                    }
                  />
                </label>
                <label className="field">
                  <span>Ghi chú</span>
                  <input
                    value={paymentNote}
                    onChange={(event) => setPaymentNote(event.target.value)}
                  />
                </label>
                <button className="primary-button md:mt-6" onClick={addPayment}>
                  Cộng tiền
                </button>
              </div>
            </section>
          </div>

          <aside className="grid gap-5 content-start">
            <section className="panel">
              <p className="eyebrow">Thông báo sinh nhật</p>
              <h2 className="section-title">Nhắc trên điện thoại</h2>
              <p className="mt-2 text-sm text-slate-500">
                Khi mở app trên điện thoại và đã cấp quyền, nếu hôm nay là sinh
                nhật của ai đó, app sẽ hiện thông báo trên thiết bị.
              </p>

              <div className="birthday-card mt-5">
                <div>
                  <p className="text-sm font-black text-slate-500">
                    Sinh nhật hôm nay
                  </p>
                  <p className="mt-1 text-2xl font-black text-slate-950">
                    {birthdaysToday.length
                      ? birthdaysToday.map((member) => member.name).join(", ")
                      : "Chưa có ai"}
                  </p>
                </div>
                <button
                  className="primary-button w-full"
                  onClick={() => void enableDeviceNotifications()}
                >
                  {notificationState === "granted"
                    ? "Thử thông báo trên điện thoại"
                    : "Bật thông báo trên điện thoại"}
                </button>
              </div>

              <div className="mt-4 rounded-3xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                {birthdayStatus}
              </div>
            </section>

            <section className="panel">
              <p className="eyebrow">Thêm thành viên</p>
              <h2 className="section-title">Lưu người mới</h2>
              <form className="mt-5 grid gap-3" onSubmit={addMember}>
                <div className="avatar-uploader">
                  <Image
                    src={newMember.avatar || makeAvatar(newMember.name || "Cầu thủ")}
                    alt="Ảnh cầu thủ sắp thêm"
                    width={96}
                    height={96}
                    unoptimized
                    className="h-24 w-24 rounded-[1.7rem] object-cover shadow-lg"
                  />
                  <label className="upload-button">
                    Upload ảnh
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => uploadAvatar(event.target.files?.[0])}
                    />
                  </label>
                </div>
                <label className="field">
                  <span>Họ tên</span>
                  <input
                    value={newMember.name}
                    onChange={(event) =>
                      setNewMember((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Nguyễn Văn A"
                  />
                </label>
                <label className="field">
                  <span>Ngày sinh</span>
                  <input
                    type="date"
                    value={newMember.birthday}
                    onChange={(event) =>
                      setNewMember((current) => ({
                        ...current,
                        birthday: event.target.value,
                      }))
                    }
                  />
                </label>
                <button className="primary-button" type="submit">
                  Thêm vào đội
                </button>
              </form>
            </section>
          </aside>
        </section>

        <section className="panel mt-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Bảng trạng thái</p>
              <h2 className="section-title">Đã đóng hay chưa đóng</h2>
            </div>
            <p className="rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-700">
              {unpaidMembers} người còn thiếu
            </p>
          </div>

          <div className="mt-5 grid gap-3">
            {members.map((member) => {
              const missing = Math.max(0, expectedAmount - member.paidAmount);
              const isDone = missing === 0;

              return (
                <article className="payment-row" key={member.id}>
                  <div className="flex min-w-0 items-center gap-3">
                    <Image
                      src={member.avatar}
                      alt={`Ảnh ${member.name}`}
                      width={84}
                      height={84}
                      unoptimized
                      className="h-20 w-20 rounded-[1.35rem] object-cover shadow-md"
                    />
                    <div className="min-w-0">
                      <h3 className="truncate font-black text-slate-950">
                        {member.name}
                      </h3>
                      <p className="text-xs font-semibold text-slate-400">
                        {member.payments.length} lần đóng
                      </p>
                    </div>
                  </div>

                  <div className="payment-money">
                    <span>Đã đóng</span>
                    <strong>{currency.format(member.paidAmount)}</strong>
                  </div>
                  <div className="payment-money">
                    <span>Cần đóng</span>
                    <strong>{currency.format(expectedAmount)}</strong>
                  </div>
                  <div className="payment-money">
                    <span>Còn thiếu</span>
                    <strong className={missing ? "text-rose-500" : "text-emerald-600"}>
                      {currency.format(missing)}
                    </strong>
                  </div>
                  <span
                    className={`status-pill ${
                      isDone
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {isDone ? "Đã đóng" : "Chưa đủ"}
                  </span>
                  <button
                    className="danger-button justify-self-end"
                    onClick={() => deleteMember(member.id)}
                  >
                    Xoá
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}
