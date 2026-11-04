// 문의 탭: 강의 가능 일정 달력. 날짜별 빈 시간만 보여주고, 고른 날짜를 문의 양식에 넣어줍니다.
(() => {
  const section = document.getElementById("availabilitySection");
  const gridEl = document.getElementById("availGrid");
  const monthEl = document.getElementById("availMonth");
  const prevBtn = document.getElementById("availPrev");
  const nextBtn = document.getElementById("availNext");
  const detailEl = document.getElementById("availDetail");
  if (!section) return;

  const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
  const STATUS = { open: "가능", partial: "일부 가능", full: "마감", weekend: "협의" };
  const byDate = new Map();
  let months = [];
  let monthIdx = 0;
  let selected = "";

  const parts = (date) => date.split("-").map(Number);
  const weekdayOf = (date) => {
    const [y, m, d] = parts(date);
    return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  };
  const labelOf = (date) => {
    const [, m, d] = parts(date);
    return `${m}월 ${d}일(${WEEK[weekdayOf(date)]})`;
  };
  const slotText = (day) => day.free.map(([s, e]) => `${s}~${e}`).join(", ");

  function renderMonth() {
    const ym = months[monthIdx];
    const [y, m] = ym.split("-").map(Number);
    monthEl.textContent = `${y}년 ${m}월`;
    prevBtn.disabled = monthIdx === 0;
    nextBtn.disabled = monthIdx === months.length - 1;

    const first = new Date(Date.UTC(y, m - 1, 1));
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    let html = WEEK.map((w) => `<span class="avail-week">${w}</span>`).join("");
    html += '<span class="avail-blank"></span>'.repeat(first.getUTCDay());
    for (let d = 1; d <= lastDay; d++) {
      const date = `${ym}-${String(d).padStart(2, "0")}`;
      const day = byDate.get(date);
      if (!day) {
        html += `<span class="avail-day is-out"><b>${d}</b></span>`;
        continue;
      }
      const clickable = day.status === "open" || day.status === "partial" || day.status === "weekend";
      html += `<button type="button" class="avail-day is-${day.status}${date === selected ? " is-selected" : ""}" data-date="${date}" ${clickable ? "" : "disabled"} aria-label="${labelOf(date)} ${STATUS[day.status]}"><b>${d}</b><small>${STATUS[day.status]}</small></button>`;
    }
    gridEl.innerHTML = html;
  }

  function renderDetail(date) {
    const day = byDate.get(date);
    const text = day.status === "weekend" ? "주말 강의는 문의해 주시면 협의합니다." : `비어 있는 시간: ${slotText(day)}`;
    detailEl.innerHTML = `
      <div><strong>${labelOf(date)}</strong><p>${text}</p></div>
      <button type="button" class="cta-primary" id="availAsk">이 날짜로 문의하기</button>`;
    detailEl.classList.remove("hidden");
    document.getElementById("availAsk").addEventListener("click", () => {
      const input = document.querySelector('#inquiryForm input[name="schedule"]');
      input.value = day.status === "weekend" ? labelOf(date) : `${labelOf(date)} ${slotText(day)} 중`;
      document.getElementById("contactFormAnchor").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  gridEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-date]");
    if (!btn || btn.disabled) return;
    selected = btn.dataset.date;
    renderMonth();
    renderDetail(selected);
  });
  prevBtn.addEventListener("click", () => {
    monthIdx -= 1;
    renderMonth();
  });
  nextBtn.addEventListener("click", () => {
    monthIdx += 1;
    renderMonth();
  });

  async function load() {
    let data;
    try {
      data = await (await fetch("/api/availability")).json();
    } catch (e) {
      return;
    }
    // 아직 연결 전이거나 오류가 나면 섹션을 숨긴 채로 둡니다
    if (!data.configured || data.error || !data.days?.length) return;
    data.days.forEach((d) => byDate.set(d.date, d));
    months = [...new Set(data.days.map((d) => d.date.slice(0, 7)))];
    section.classList.remove("hidden");
    renderMonth();
  }
  load();
})();
