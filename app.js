(() => {
  const { renderIcons } = window.DailyCalendarIcons || { renderIcons: () => {} };
  const root = document.getElementById("app-shell");
  const today = new Date();
  const todayKey = dateKey(today);
  const weekdayNames = ["日", "一", "二", "三", "四", "五", "六"];

  let state = null;
  const POMODORO_DURATIONS = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
  const POMODORO_LABELS = { focus: "专注", short: "短休息", long: "长休息" };
  const POMODORO_MODE_LABELS = { focus: "专注时间", short: "短休息", long: "长休息" };
  const POMODORO_STORAGE_KEY = "daily-calendar-pomodoro-v1";
  const STATE_STORAGE_KEY = "daily-calendar-state-v1";
  let reminderTicker = null;
  let pomodoroTimer = loadPomodoroTimer();
  let pomodoroTicker = null;
  let selectedDate = todayKey;
  let calendarCursor = new Date(today.getFullYear(), today.getMonth(), 1);
  let yearCursor = today.getFullYear();
  let currentView = "today";
  let taskFilter = "all";
  let saveTimer = null;
  let confirmResolver = null;
  let bulkImportState = { items: [], warnings: [], lastText: "" };
  let lastRenderedStreak = null;

  const elements = {
    accentControl: document.getElementById("accent-control"),
    paletteSelect: null,
    customAccentInput: null,
    addTaskButton: document.getElementById("add-task-button"),
    addTaskButtonSecondary: document.getElementById("add-task-button-secondary"),
    blurRange: document.getElementById("blur-range"),
    blurValue: document.getElementById("blur-value"),
    calendarMonthTitle: document.getElementById("calendar-month-title"),
    calendarTodayButton: document.getElementById("calendar-today-button"),
    checkinMark: document.getElementById("checkin-mark"),
    checkinNote: document.getElementById("checkin-note"),
    checkinTitle: document.getElementById("checkin-title"),
    closeTaskModal: document.getElementById("close-task-modal"),
    confirmCancel: document.getElementById("confirm-cancel"),
    confirmDialog: document.getElementById("confirm-dialog"),
    confirmMessage: document.getElementById("confirm-message"),
    confirmOk: document.getElementById("confirm-ok"),
    currentYearButton: document.getElementById("current-year-button"),
    dailyEndDate: document.getElementById("daily-end-date"),
    dailyFields: document.getElementById("daily-fields"),
    dailyStartDate: document.getElementById("daily-start-date"),
    dailySummaryTime: document.getElementById("daily-summary-time"),
    dataImportInput: document.getElementById("import-data-input"),
    animationEnabled: document.getElementById("animation-enabled"),
    defaultReminderTime: document.getElementById("default-reminder-time"),
    exportData: document.getElementById("export-data"),
    importDataButton: document.getElementById("import-data-button"),
    jumpToday: document.getElementById("jump-today"),
    managerList: document.getElementById("manager-list"),
    monthGrid: document.getElementById("month-grid"),
    nextMonth: document.getElementById("next-month"),
    nextYear: document.getElementById("next-year"),
    notificationFeedback: document.getElementById("notification-feedback"),
    notificationStatus: document.getElementById("notification-status"),
    notifyEnabled: document.getElementById("notify-enabled"),
    pageDate: document.getElementById("page-date"),
    pageTitle: document.getElementById("page-title"),
    pomodoroCycleDots: document.getElementById("pomodoro-cycle-dots"),
    pomodoroCycleLabel: document.getElementById("pomodoro-cycle-label"),
    pomodoroLinkedTask: document.getElementById("pomodoro-linked-task"),
    pomodoroModeLabel: document.getElementById("pomodoro-mode-label"),
    pomodoroModeSwitch: document.getElementById("pomodoro-mode-switch"),
    pomodoroReset: document.getElementById("pomodoro-reset"),
    pomodoroRing: document.getElementById("pomodoro-ring"),
    pomodoroSkip: document.getElementById("pomodoro-skip"),
    pomodoroStart: document.getElementById("pomodoro-start"),
    pomodoroStatusPill: document.getElementById("pomodoro-status-pill"),
    pomodoroTaskSelect: document.getElementById("pomodoro-task-select"),
    pomodoroTime: document.getElementById("pomodoro-time"),
    pomodoroTitle: document.getElementById("pomodoro-title"),
    pomodoroTodayCount: document.getElementById("pomodoro-today-count"),
    pomodoroTodayMinutes: document.getElementById("pomodoro-today-minutes"),
    previousMonth: document.getElementById("previous-month"),
    previousYear: document.getElementById("previous-year"),
    rangeEndDate: document.getElementById("range-end-date"),
    rangeFields: document.getElementById("range-fields"),
    rangeStartDate: document.getElementById("range-start-date"),
    rangeTargetCount: document.getElementById("range-target-count"),
    resetData: document.getElementById("reset-data"),
    selectedDateTitle: document.getElementById("selected-date-title"),
    selectedDayStatus: document.getElementById("selected-day-status"),
    selectedTaskList: document.getElementById("selected-task-list"),
    sidebarNote: document.getElementById("sidebar-note"),
    sidebarStreak: document.getElementById("sidebar-streak"),
    taskForm: document.getElementById("task-form"),
    taskFormError: document.getElementById("task-form-error"),
    taskId: document.getElementById("task-id"),
    taskModal: document.getElementById("task-modal"),
    taskModalLabel: document.getElementById("task-modal-label"),
    taskModalTitle: document.getElementById("task-modal-title"),
    taskReminderTime: document.getElementById("task-reminder-time"),
    taskTitle: document.getElementById("task-title"),
    taskType: document.getElementById("task-type"),
    testNotification: document.getElementById("test-notification"),
    themeControl: document.getElementById("theme-control"),
    todayProgressBar: document.getElementById("today-progress-bar"),
    todayProgressRing: document.getElementById("today-progress-ring"),
    todayProgressValue: document.getElementById("today-progress-value"),
    toastStack: document.getElementById("toast-stack"),
    weekdayPicker: document.getElementById("weekday-picker"),
    yearCheckinCount: document.getElementById("year-checkin-count"),
    yearCheckinNote: document.getElementById("year-checkin-note"),
    yearCompletionNote: document.getElementById("year-completion-note"),
    yearCompletionRate: document.getElementById("year-completion-rate"),
    yearHeatmap: document.getElementById("year-heatmap"),
    yearMonths: document.getElementById("year-months"),
    yearSummaryBestStreak: document.getElementById("year-summary-best-streak"),
    yearSummaryCheckins: document.getElementById("year-summary-checkins"),
    yearSummaryMissed: document.getElementById("year-summary-missed"),
    yearSummaryRequired: document.getElementById("year-summary-required"),
    yearViewTitle: document.getElementById("year-view-title")
  };

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function dateKey(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function parseDateKey(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function addDays(key, amount) {
    const date = parseDateKey(key);
    date.setDate(date.getDate() + amount);
    return dateKey(date);
  }

  function startOfWeek(date) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() - copy.getDay());
    return copy;
  }

  function formatLongDate(key) {
    const date = parseDateKey(key);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 星期${weekdayNames[date.getDay()]}`;
  }

  function formatDateRange(task) {
    const start = task.startDate || "未设置";
    if (!task.endDate) return `${start} 起`;
    return `${start} 至 ${task.endDate}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function completionKey(taskId, key) {
    return `${taskId}|${key}`;
  }

  function isCompleted(taskId, key) {
    return Boolean(state?.completions?.[completionKey(taskId, key)]);
  }

  function completionDatesForTask(task) {
    if (!state) return [];
    const prefix = `${task.id}|`;
    return Object.keys(state.completions)
      .filter((key) => key.startsWith(prefix) && state.completions[key] === true)
      .map((key) => key.slice(prefix.length));
  }

  function completionDatesForTaskInRange(task) {
    const start = task.startDate || "0000-01-01";
    const end = task.endDate || "9999-12-31";
    return completionDatesForTask(task).filter((date) => date >= start && date <= end);
  }

  function taskMatchesRange(task, key) {
    if (task.startDate && key < task.startDate) return false;
    if (task.endDate && key > task.endDate) return false;
    return true;
  }

  function isTaskScheduledOn(task, key) {
    if (!task || task.archived || !taskMatchesRange(task, key)) return false;

    if (task.type === "daily") {
      const weekdays = Array.isArray(task.weekdays) && task.weekdays.length > 0
        ? task.weekdays.map(Number)
        : [0, 1, 2, 3, 4, 5, 6];
      return weekdays.includes(parseDateKey(key).getDay());
    }

    return task.type === "range";
  }

  function completionDatesForTaskBefore(task, key) {
    return completionDatesForTaskInRange(task).filter((date) => date < key);
  }

  function isTaskRequiredOn(task, key) {
    if (!isTaskScheduledOn(task, key)) return false;

    if (task.type === "range") {
      const targetCount = Math.max(1, Number(task.targetCount) || 1);
      const completedBeforeDate = completionDatesForTaskBefore(task, key);
      return completedBeforeDate.length < targetCount;
    }

    return true;
  }

  function requiredTasksForDate(key) {
    if (!state) return [];
    return state.tasks.filter((task) => isTaskRequiredOn(task, key));
  }

  function completedTasksForDate(key) {
    return requiredTasksForDate(key).filter((task) => isCompleted(task.id, key));
  }

  function taskDisplayStatus(task, key) {
    const done = isCompleted(task.id, key);
    const scheduled = isTaskScheduledOn(task, key);
    const rangeDone = task.type === "range"
      && completionDatesForTaskInRange(task).length >= Math.max(1, Number(task.targetCount) || 1);

    if (done) return { key: "completed", label: "已完成", priority: 1 };
    if (task.startDate && key < task.startDate) {
      return { key: "upcoming", label: "未开始", priority: 3 };
    }
    if (task.endDate && key > task.endDate) {
      return {
        key: rangeDone ? "completed" : "ended",
        label: rangeDone ? "已完成" : "已结束",
        priority: rangeDone ? 1 : 5
      };
    }
    if (rangeDone) return { key: "completed", label: "目标已完成", priority: 1 };
    if (scheduled) {
      if (key > todayKey) return { key: "upcoming", label: "待完成", priority: 3 };
      if (key < todayKey) return { key: "overdue", label: "未完成", priority: 4 };
      return { key: "required", label: "当天必做", priority: 0 };
    }
    if (!taskMatchesRange(task, key)) {
      return { key: "inactive", label: "不在日期范围", priority: 5 };
    }
    return { key: "inactive", label: "无需打卡", priority: 5 };
  }

  function displayTasksForDate(key) {
    if (!state) return [];
    return state.tasks
      .filter((task) => !task.archived)
      .map((task) => ({ task, status: taskDisplayStatus(task, key) }))
      .sort((a, b) => {
        const priority = a.status.priority - b.status.priority;
        if (priority !== 0) return priority;
        return String(a.task.createdAt).localeCompare(String(b.task.createdAt));
      })
      .map((entry) => entry.task);
  }

  function completionEventsForDate(key) {
    if (!state) return [];
    const suffix = `|${key}`;
    return Object.keys(state.completions).filter((completion) => completion.endsWith(suffix) && state.completions[completion]);
  }

  function getDayState(key) {
    const required = requiredTasksForDate(key);
    const completed = completedTasksForDate(key);
    const completionEvents = completionEventsForDate(key);

    if (key > todayKey) {
      return { key, status: "future", label: "未到", required, completed };
    }

    if (required.length > 0 && completed.length === required.length) {
      return { key, status: "checked", label: "已打卡", required, completed };
    }

    if (required.length === 0) {
      if (completionEvents.length > 0) {
        return { key, status: "checked", label: "已打卡", required, completed };
      }
      return { key, status: "rest", label: "休息", required, completed };
    }

    if (completed.length > 0) {
      return { key, status: "partial", label: `${completed.length}/${required.length}`, required, completed };
    }

    if (key === todayKey) {
      return { key, status: "pending", label: "未完成", required, completed };
    }

    return { key, status: "missed", label: "未打卡", required, completed };
  }

  function collectYearStats(year) {
    const requiredKeys = [];
    const checkedKeys = [];
    const missedKeys = [];
    let bestStreak = 0;
    let runningStreak = 0;
    if (year > today.getFullYear()) {
      return { required: 0, checked: 0, missed: 0, bestStreak: 0 };
    }

    const endKey = year === today.getFullYear() ? todayKey : `${year}-12-31`;

    for (let cursor = `${year}-01-01`; cursor <= endKey; cursor = addDays(cursor, 1)) {
      const dayState = getDayState(cursor);
      if (dayState.required.length > 0) requiredKeys.push(cursor);

      if (dayState.status === "checked") {
        checkedKeys.push(cursor);
        runningStreak += 1;
        bestStreak = Math.max(bestStreak, runningStreak);
      } else if (dayState.status === "rest") {
        continue;
      } else if (cursor < todayKey && (dayState.status === "missed" || dayState.status === "partial")) {
        missedKeys.push(cursor);
        runningStreak = 0;
      } else if (cursor === todayKey && dayState.status !== "checked") {
        runningStreak = runningStreak;
      }
    }

    return {
      required: requiredKeys.length,
      checked: checkedKeys.length,
      missed: missedKeys.length,
      bestStreak
    };
  }

  function currentStreak() {
    let streak = 0;
    let cursor = todayKey;

    while (parseDateKey(cursor).getFullYear() === today.getFullYear()) {
      const dayState = getDayState(cursor);
      if (dayState.status === "checked") {
        streak += 1;
      } else if (dayState.status === "rest" || cursor === todayKey) {
        // A rest day or an unfinished current day does not break yesterday's streak.
      } else {
        break;
      }
      cursor = addDays(cursor, -1);
    }

    return streak;
  }

  function animationsEnabled() {
    return state?.settings?.animationsEnabled !== false;
  }

  function animateClass(element, className, duration = 420) {
    if (!element || !animationsEnabled()) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
    setTimeout(() => element.classList.remove(className), duration);
  }

  async function ensureNotificationPermission() {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  async function showBrowserNotification(title, message, tag = "daily-calendar") {
    if (!state || state.settings?.notifyEnabled === false) return false;
    const granted = await ensureNotificationPermission();
    if (!granted) return false;
    const options = { body: message, icon: "icon-192.png", badge: "icon-192.png", tag };
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, options);
      } else {
        new Notification(title, options);
      }
      return true;
    } catch (error) {
      try {
        new Notification(title, options);
        return true;
      } catch (fallbackError) {
        return false;
      }
    }
  }

  function currentTimeKey(date = new Date()) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  async function checkDueReminders() {
    if (!state || state.settings?.notifyEnabled === false) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const key = dateKey(new Date());
    const now = currentTimeKey();
    const dueTasks = requiredTasksForDate(key).filter((task) => {
      const reminderTime = task.reminderTime || state.settings.defaultReminderTime;
      return !isCompleted(task.id, key) && reminderTime && reminderTime <= now;
    });
    for (const task of dueTasks) {
      const notificationKey = `daily-calendar-notified|${key}|${task.id}`;
      if (sessionStorage.getItem(notificationKey)) continue;
      const shown = await showBrowserNotification("任务提醒", task.title, notificationKey);
      if (shown) sessionStorage.setItem(notificationKey, "1");
    }

    const summaryTime = state.settings.dailySummaryTime;
    const summaryKey = `daily-calendar-summary|${key}`;
    const pending = requiredTasksForDate(key).filter((task) => !isCompleted(task.id, key));
    if (summaryTime && summaryTime <= now && pending.length > 0 && !sessionStorage.getItem(summaryKey)) {
      const shown = await showBrowserNotification(
        "今日任务汇总",
        `还有 ${pending.length} 项任务未完成。`,
        summaryKey
      );
      if (shown) sessionStorage.setItem(summaryKey, "1");
    }
  }

  function startReminderTicker() {
    if (reminderTicker) return;
    checkDueReminders();
    reminderTicker = setInterval(checkDueReminders, 60000);
  }

  function createDefaultPomodoroTimer() {
    return {
      mode: "focus",
      remaining: POMODORO_DURATIONS.focus,
      running: false,
      endAt: null,
      cycleFocusCount: 0,
      taskId: "",
      updatedAt: Date.now()
    };
  }

  function normalizePomodoroTimer(value) {
    const fallback = createDefaultPomodoroTimer();
    if (!value || typeof value !== "object") return fallback;
    const mode = Object.hasOwn(POMODORO_DURATIONS, value.mode) ? value.mode : fallback.mode;
    const duration = POMODORO_DURATIONS[mode];
    const rawRemaining = Number(value.remaining);
    const remaining = Number.isFinite(rawRemaining)
      ? Math.max(0, Math.min(duration, Math.ceil(rawRemaining)))
      : duration;
    const endAt = Number(value.endAt);
    const running = value.running === true && Number.isFinite(endAt) && endAt > 0;

    return {
      mode,
      remaining,
      running,
      endAt: running ? endAt : null,
      cycleFocusCount: Math.max(0, Math.min(4, Number(value.cycleFocusCount) || 0)),
      taskId: typeof value.taskId === "string" ? value.taskId : "",
      updatedAt: Number(value.updatedAt) || Date.now()
    };
  }

  function loadPomodoroTimer() {
    try {
      return normalizePomodoroTimer(JSON.parse(localStorage.getItem(POMODORO_STORAGE_KEY) || "null"));
    } catch (error) {
      return createDefaultPomodoroTimer();
    }
  }

  function persistPomodoroTimer() {
    pomodoroTimer.updatedAt = Date.now();
    try {
      localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(pomodoroTimer));
    } catch (error) {
      // Timer still works for the current session if browser storage is unavailable.
    }
  }

  function currentPomodoroRemaining(now = Date.now()) {
    const duration = POMODORO_DURATIONS[pomodoroTimer.mode] || POMODORO_DURATIONS.focus;
    if (pomodoroTimer.running && pomodoroTimer.endAt) {
      return Math.max(0, Math.ceil((pomodoroTimer.endAt - now) / 1000));
    }
    return Math.max(0, Math.min(duration, Math.ceil(Number(pomodoroTimer.remaining) || 0)));
  }

  function formatPomodoroClock(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function pomodoroTaskCandidates() {
    if (!state) return [];
    const required = requiredTasksForDate(todayKey);
    const pending = required.filter((task) => !isCompleted(task.id, todayKey));
    const completed = required.filter((task) => isCompleted(task.id, todayKey));
    const result = [...pending, ...completed];
    const selectedTask = state.tasks.find((task) => task.id === pomodoroTimer.taskId);
    if (selectedTask && !result.some((task) => task.id === selectedTask.id)) result.push(selectedTask);
    return result;
  }

  function renderPomodoroTaskOptions() {
    if (!elements.pomodoroTaskSelect) return;
    const tasks = pomodoroTaskCandidates();
    elements.pomodoroTaskSelect.replaceChildren();

    const noTask = document.createElement("option");
    noTask.value = "";
    noTask.textContent = tasks.length > 0 ? "不关联任务" : "今天没有可关联任务";
    elements.pomodoroTaskSelect.appendChild(noTask);

    tasks.forEach((task) => {
      const option = document.createElement("option");
      option.value = task.id;
      option.textContent = `${task.title}${isCompleted(task.id, todayKey) ? "（已完成）" : ""}`;
      elements.pomodoroTaskSelect.appendChild(option);
    });

    elements.pomodoroTaskSelect.disabled = tasks.length === 0;
    const selectedExists = tasks.some((task) => task.id === pomodoroTimer.taskId);
    if (!selectedExists) pomodoroTimer.taskId = "";
    elements.pomodoroTaskSelect.value = pomodoroTimer.taskId;
    const selectedTask = state?.tasks.find((task) => task.id === pomodoroTimer.taskId);
    elements.pomodoroLinkedTask.textContent = selectedTask
      ? `${selectedTask.title}${isCompleted(selectedTask.id, todayKey) ? " · 已完成" : ""}`
      : "未关联任务";
    elements.pomodoroLinkedTask.title = selectedTask?.title || "";
  }

  function updatePomodoroClock(now = Date.now()) {
    if (!elements.pomodoroRing) return;
    const remaining = currentPomodoroRemaining(now);
    const duration = POMODORO_DURATIONS[pomodoroTimer.mode] || POMODORO_DURATIONS.focus;
    const progress = duration === 0 ? 100 : Math.max(0, Math.min(100, ((duration - remaining) / duration) * 100));
    elements.pomodoroRing.style.setProperty("--progress", `${progress}%`);
    elements.pomodoroRing.dataset.running = String(pomodoroTimer.running);
    elements.pomodoroTime.textContent = formatPomodoroClock(remaining);
    elements.pomodoroRing.setAttribute("aria-label", `${POMODORO_LABELS[pomodoroTimer.mode]}剩余 ${formatPomodoroClock(remaining)}`);
  }

  function renderPomodoro() {
    if (!elements.pomodoroRing || !state) return;
    const mode = pomodoroTimer.mode;
    const duration = POMODORO_DURATIONS[mode];
    const session = state.pomodoro?.sessions?.[todayKey] || { count: 0, focusMinutes: 0 };
    const cycleCount = Math.max(0, Math.min(4, Number(pomodoroTimer.cycleFocusCount) || 0));

    elements.pomodoroTitle.textContent = `${duration / 60} 分钟${POMODORO_LABELS[mode]}`;
    elements.pomodoroModeLabel.textContent = POMODORO_MODE_LABELS[mode];
    elements.pomodoroTodayCount.textContent = String(Math.max(0, Number(session.count) || 0));
    elements.pomodoroTodayMinutes.textContent = String(Math.max(0, Number(session.focusMinutes) || 0));
    elements.pomodoroCycleLabel.textContent = `${cycleCount} / 4`;
    elements.pomodoroCycleDots.querySelectorAll("i").forEach((dot, index) => {
      dot.classList.toggle("active", index < cycleCount);
    });

    elements.pomodoroModeSwitch.querySelectorAll("[data-pomodoro-mode]").forEach((button) => {
      const active = button.dataset.pomodoroMode === mode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });

    const remaining = currentPomodoroRemaining();
    const paused = !pomodoroTimer.running && remaining < duration;
    elements.pomodoroStatusPill.textContent = pomodoroTimer.running
      ? (mode === "focus" ? "专注中" : "休息中")
      : (paused ? `${POMODORO_LABELS[mode]}已暂停` : "准备开始");
    elements.pomodoroStatusPill.classList.toggle("checked", pomodoroTimer.running);

    const startLabel = pomodoroTimer.running
      ? "暂停"
      : (paused ? "继续" : (mode === "focus" ? "开始专注" : "开始休息"));
    elements.pomodoroStart.innerHTML = `<span data-icon="${pomodoroTimer.running ? "pause" : "play"}" aria-hidden="true"></span><span>${startLabel}</span>`;
    renderIcons(elements.pomodoroStart);
    renderPomodoroTaskOptions();
    updatePomodoroClock();
  }

  function stopPomodoroTicker() {
    if (pomodoroTicker) clearInterval(pomodoroTicker);
    pomodoroTicker = null;
  }

  function startPomodoroTicker() {
    if (pomodoroTicker) return;
    tickPomodoro();
    pomodoroTicker = setInterval(tickPomodoro, 250);
  }

  function recordPomodoroCompletion() {
    if (!state) return;
    if (!state.pomodoro || typeof state.pomodoro !== "object") state.pomodoro = { sessions: {} };
    if (!state.pomodoro.sessions || typeof state.pomodoro.sessions !== "object") state.pomodoro.sessions = {};
    const key = dateKey(new Date());
    const current = state.pomodoro.sessions[key] || { count: 0, focusMinutes: 0 };
    state.pomodoro.sessions[key] = {
      count: Math.min(100, (Number(current.count) || 0) + 1),
      focusMinutes: Math.min(1440, (Number(current.focusMinutes) || 0) + POMODORO_DURATIONS.focus / 60)
    };
    scheduleSave(true);
  }

  async function sendPomodoroNotification() {
    if (!state || state.settings?.notifyEnabled === false) return;
    const task = state.tasks.find((item) => item.id === pomodoroTimer.taskId);
    const message = task ? `“${task.title}”专注完成，休息一下吧。` : "专注完成，休息一下吧。";
    await showBrowserNotification("番茄钟", message, "daily-calendar-pomodoro");
  }

  function completePomodoroPhase() {
    const completedMode = pomodoroTimer.mode;
    stopPomodoroTicker();

    if (completedMode === "focus") {
      recordPomodoroCompletion();
      pomodoroTimer.cycleFocusCount = Math.min(4, (Number(pomodoroTimer.cycleFocusCount) || 0) + 1);
      const nextMode = pomodoroTimer.cycleFocusCount >= 4 ? "long" : "short";
      showToast("专注完成", `${POMODORO_DURATIONS.focus / 60} 分钟已记录，休息一下吧。`);
      sendPomodoroNotification();
      pomodoroTimer.mode = nextMode;
    } else {
      if (completedMode === "long") pomodoroTimer.cycleFocusCount = 0;
      showToast("休息结束", "准备好后开始下一轮专注。");
      pomodoroTimer.mode = "focus";
    }

    pomodoroTimer.remaining = POMODORO_DURATIONS[pomodoroTimer.mode];
    pomodoroTimer.running = false;
    pomodoroTimer.endAt = null;
    persistPomodoroTimer();
    renderPomodoro();
    animateClass(elements.pomodoroRing, "pomodoro-complete", 760);
  }

  function tickPomodoro() {
    if (!pomodoroTimer.running || !pomodoroTimer.endAt) {
      stopPomodoroTicker();
      updatePomodoroClock();
      return;
    }
    if (pomodoroTimer.endAt <= Date.now()) {
      completePomodoroPhase();
      return;
    }
    updatePomodoroClock();
  }

  function togglePomodoroTimer() {
    if (pomodoroTimer.running) {
      pomodoroTimer.remaining = currentPomodoroRemaining();
      pomodoroTimer.running = false;
      pomodoroTimer.endAt = null;
      stopPomodoroTicker();
    } else {
      if (pomodoroTimer.remaining <= 0) pomodoroTimer.remaining = POMODORO_DURATIONS[pomodoroTimer.mode];
      pomodoroTimer.endAt = Date.now() + pomodoroTimer.remaining * 1000;
      pomodoroTimer.running = true;
      startPomodoroTicker();
    }
    persistPomodoroTimer();
    renderPomodoro();
  }

  function resetPomodoroTimer(clearStoredState = false) {
    stopPomodoroTicker();
    if (clearStoredState) {
      try { localStorage.removeItem(POMODORO_STORAGE_KEY); } catch (error) {}
    }
    pomodoroTimer = createDefaultPomodoroTimer();
    persistPomodoroTimer();
    renderPomodoro();
  }

  function setPomodoroMode(mode) {
    if (!Object.hasOwn(POMODORO_DURATIONS, mode)) return;
    stopPomodoroTicker();
    pomodoroTimer.mode = mode;
    pomodoroTimer.remaining = POMODORO_DURATIONS[mode];
    pomodoroTimer.running = false;
    pomodoroTimer.endAt = null;
    persistPomodoroTimer();
    renderPomodoro();
  }
  function skipPomodoroPhase() {
    if (pomodoroTimer.mode === "focus") {
      const nextMode = (Number(pomodoroTimer.cycleFocusCount) || 0) >= 4 ? "long" : "short";
      setPomodoroMode(nextMode);
    } else {
      if (pomodoroTimer.mode === "long") pomodoroTimer.cycleFocusCount = 0;
      setPomodoroMode("focus");
    }
  }

  function resumePomodoroTimer() {
    if (!pomodoroTimer.running || !pomodoroTimer.endAt) {
      stopPomodoroTicker();
      renderPomodoro();
      return;
    }
    const overdueBy = Date.now() - pomodoroTimer.endAt;
    if (overdueBy >= 0) {
      if (overdueBy <= 5 * 60 * 1000) {
        completePomodoroPhase();
      } else {
        pomodoroTimer.running = false;
        pomodoroTimer.endAt = null;
        pomodoroTimer.remaining = POMODORO_DURATIONS[pomodoroTimer.mode];
        persistPomodoroTimer();
        renderPomodoro();
      }
      return;
    }
    startPomodoroTicker();
    renderPomodoro();
  }

  function findSelectedTaskRow(taskId) {
    return Array.from(elements.selectedTaskList.querySelectorAll(".task-row"))
      .find((row) => row.dataset.taskId === taskId) || null;
  }

  function hexToRgb(hex) {
    const normalized = String(hex || "#4d82c7").replace("#", "");
    const value = Number.parseInt(normalized, 16);
    return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
  }

  function applyAppearance() {
    if (!state) return;
    const customAccent = state.settings.customAccent || "#4d82c7";
    root.style.setProperty("--custom-accent", customAccent);
    root.dataset.theme = state.settings.theme;
    root.dataset.palette = state.settings.palette || "mist";
    root.dataset.accent = state.settings.accent;
    root.dataset.motion = animationsEnabled() ? "on" : "off";
    root.style.setProperty("--blur", `${state.settings.blur}px`);

    if (state.settings.accent === "custom") {
      const { r, g, b } = hexToRgb(customAccent);
      root.style.setProperty("--accent", customAccent);
      root.style.setProperty("--accent-soft", `rgb(${r} ${g} ${b} / 0.16)`);
    } else {
      root.style.removeProperty("--accent");
      root.style.removeProperty("--accent-soft");
    }
  }

  function createDefaultState() {
    const now = new Date().toISOString();
    return {
      version: 1,
      createdAt: now,
      updatedAt: now,
      tasks: [],
      completions: {},
      pomodoro: { sessions: {} },
      settings: {
        theme: "light",
        palette: "mist",
        accent: "sky",
        customAccent: "#4d82c7",
        blur: 26,
        notifyEnabled: true,
        animationsEnabled: true,
        defaultReminderTime: "20:00",
        dailySummaryTime: "22:30"
      }
    };
  }

  function normalizeState(input) {
    const fallback = createDefaultState();
    if (!input || typeof input !== "object" || Array.isArray(input)) return fallback;
    const settings = input.settings && typeof input.settings === "object" ? input.settings : {};
    const pomodoroSessions = input.pomodoro && typeof input.pomodoro.sessions === "object"
      ? input.pomodoro.sessions
      : {};
    const normalizedPomodoroSessions = {};
    Object.entries(pomodoroSessions).slice(-400).forEach(([key, value]) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !value || typeof value !== "object") return;
      normalizedPomodoroSessions[key] = {
        count: Math.max(0, Math.min(100, Number(value.count) || 0)),
        focusMinutes: Math.max(0, Math.min(1440, Number(value.focusMinutes) || 0))
      };
    });
    return {
      version: 1,
      createdAt: typeof input.createdAt === "string" ? input.createdAt : fallback.createdAt,
      updatedAt: new Date().toISOString(),
      tasks: Array.isArray(input.tasks) ? input.tasks.slice(0, 2000) : [],
      completions: input.completions && typeof input.completions === "object" ? input.completions : {},
      pomodoro: { sessions: normalizedPomodoroSessions },
      settings: {
        theme: settings.theme === "dark" ? "dark" : "light",
        palette: ["mist", "sand", "mint", "graphite"].includes(settings.palette) ? settings.palette : "mist",
        accent: ["sky", "sage", "rose", "amber", "ocean", "custom"].includes(settings.accent) ? settings.accent : "sky",
        customAccent: /^#[0-9a-f]{6}$/i.test(settings.customAccent) ? settings.customAccent : "#4d82c7",
        blur: Math.max(12, Math.min(38, Number(settings.blur) || 26)),
        notifyEnabled: settings.notifyEnabled !== false,
        animationsEnabled: settings.animationsEnabled !== false,
        defaultReminderTime: /^\d{2}:\d{2}$/.test(settings.defaultReminderTime) ? settings.defaultReminderTime : "20:00",
        dailySummaryTime: /^\d{2}:\d{2}$/.test(settings.dailySummaryTime) ? settings.dailySummaryTime : "22:30"
      }
    };
  }

  async function loadState() {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(STATE_STORAGE_KEY) || "null");
    } catch (error) {
      saved = null;
    }
    state = normalizeState(saved);
    localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
    applyAppearance();
    renderAll();
  }

  function scheduleSave(immediate = false) {
    if (!state) return;
    if (!immediate && saveTimer) clearTimeout(saveTimer);

    const save = () => {
      try {
        state.updatedAt = new Date().toISOString();
        localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        showToast("保存失败", error.message || "浏览器本地存储空间不足。", "error");
      }
    };

    if (immediate) {
      save();
      return;
    }

    saveTimer = setTimeout(save, 260);
  }

  function renderAll() {
    if (!state) return;
    applyAppearance();
    renderHeader();
    renderOverview();
    renderCalendar();
    renderSelectedTasks();
    renderYearView();
    renderManager();
    renderSettings();
    renderPomodoro();
    renderIcons(document);
  }

  function updateView(view) {
    currentView = view;
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.classList.toggle("active", button.dataset.view === view);
    });
    document.querySelectorAll("[data-view-panel]").forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.viewPanel === view);
    });
    renderHeader();
  }

  function renderHeader() {
    const viewTitles = {
      today: "今天",
      pomodoro: "番茄钟",
      year: "全年打卡",
      tasks: "任务管理",
      settings: "设置"
    };

    elements.pageDate.textContent = (currentView === "today" || currentView === "pomodoro")
      ? formatLongDate(todayKey)
      : "每日计划";
    elements.pageTitle.textContent = viewTitles[currentView] || "今天";
  }

  function renderOverview() {
    const todayState = getDayState(todayKey);
    const requiredCount = todayState.required.length;
    const completedCount = todayState.completed.length;
    const percent = requiredCount === 0 ? 100 : Math.round((completedCount / requiredCount) * 100);
    const stats = collectYearStats(today.getFullYear());
    const rate = stats.required === 0 ? 0 : Math.round((stats.checked / stats.required) * 100);
    const streak = currentStreak();
    const previousStreak = lastRenderedStreak;

    elements.todayProgressValue.textContent = `${completedCount} / ${requiredCount}`;
    elements.todayProgressRing.style.setProperty("--progress", `${percent}%`);
    elements.todayProgressRing.textContent = requiredCount === 0 ? "休息" : `${percent}%`;
    elements.todayProgressBar.style.width = `${percent}%`;
    elements.yearCheckinCount.textContent = String(stats.checked);
    elements.yearCheckinNote.textContent = stats.checked > 0 ? `今年已坚持 ${stats.checked} 天` : "还没有打卡记录";
    elements.yearCompletionRate.textContent = String(rate);
    elements.yearCompletionNote.textContent = stats.required === 0 ? "创建任务后开始统计" : `${stats.checked} / ${stats.required} 个截至今日应完成日期`;
    elements.sidebarStreak.textContent = String(streak);
    elements.sidebarNote.textContent = streak > 0
      ? `继续保持，今年最长连续 ${stats.bestStreak} 天`
      : "完成今天的任务即可开始连续打卡";
    if (previousStreak !== null && previousStreak !== streak) {
      animateClass(elements.sidebarStreak, "streak-pop", 420);
    }
    lastRenderedStreak = streak;
  }

  function renderCalendar() {
    elements.calendarMonthTitle.textContent = `${calendarCursor.getFullYear()}年${calendarCursor.getMonth() + 1}月`;
    elements.monthGrid.replaceChildren();

    const first = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), 1);
    const gridStart = startOfWeek(first);

    for (let index = 0; index < 42; index += 1) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const key = dateKey(date);
      const dayState = getDayState(key);
      const outside = date.getMonth() !== calendarCursor.getMonth();
      const button = document.createElement("button");

      button.type = "button";
      button.className = `day-cell ${dayState.status}${outside ? " outside" : ""}${key === selectedDate ? " selected" : ""}${key === todayKey ? " today" : ""}`;
      button.dataset.date = key;
      button.setAttribute("role", "gridcell");
      button.setAttribute(
        "aria-label",
        `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日，${dayState.label}`
      );
      button.innerHTML = `
        <span class="day-number">${date.getDate()}</span>
        <span class="day-state">
          <span class="day-dot" aria-hidden="true"></span>
          <span>${escapeHtml(dayState.label)}</span>
        </span>
      `;

      button.addEventListener("click", () => {
        selectedDate = key;
        calendarCursor = new Date(date.getFullYear(), date.getMonth(), 1);
        updateView("today");
        renderAll();
      });

      elements.monthGrid.appendChild(button);
    }
  }

  function renderSelectedTasks() {
    elements.selectedDateTitle.textContent = formatLongDate(selectedDate);
    const dayState = getDayState(selectedDate);
    const requiredTasks = dayState.required;
    const displayTasks = displayTasksForDate(selectedDate);

    elements.selectedDayStatus.textContent = dayState.label;
    elements.selectedDayStatus.className = `status-pill ${dayState.status}`;
    elements.selectedTaskList.replaceChildren();

    if (displayTasks.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.innerHTML = `
        <span data-icon="calendar-check" aria-hidden="true"></span>
        <div>
          <strong>${selectedDate > todayKey ? "这一天还没有任务" : "还没有任务"}</strong>
          <span>点击“新建任务”添加每日习惯，或设置一个区间任务。</span>
        </div>
      `;
      elements.selectedTaskList.appendChild(empty);
    } else {
      displayTasks.forEach((task) => {
        const done = isCompleted(task.id, selectedDate);
        const required = isTaskRequiredOn(task, selectedDate);
        const status = taskDisplayStatus(task, selectedDate);
        const completionCount = task.type === "range"
          ? Math.min(completionDatesForTaskInRange(task).length, Math.max(1, Number(task.targetCount) || 1))
          : 0;
        const progress = task.type === "range"
          ? `<span data-icon="check-circle-2" aria-hidden="true"></span><span>${completionCount} / ${Math.max(1, Number(task.targetCount) || 1)} 次</span>`
          : "";
        const toggle = required
          ? `
            <button class="task-toggle" type="button" data-done="${done}" aria-pressed="${done}" aria-label="${done ? "取消打卡" : "完成打卡"}">
              <span data-icon="${done ? "check" : "circle"}" aria-hidden="true"></span>
              <span class="task-toggle-label">${done ? "已打卡" : "打卡"}</span>
            </button>
          `
          : "";
        const row = document.createElement("article");
        row.className = `task-row task-row-${status.key}`;
        row.dataset.taskId = task.id;
        row.dataset.done = String(done);
        row.dataset.required = String(required);
        row.innerHTML = `
          <div class="task-main">
            <div class="task-title-row">
              <div class="task-title">${escapeHtml(task.title)}</div>
              <span class="task-status task-status-${status.key}">${escapeHtml(status.label)}</span>
            </div>
            <div class="task-meta">
              <span data-icon="${task.type === "daily" ? "repeat-2" : "target"}" aria-hidden="true"></span>
              <span>${task.type === "daily" ? "每日习惯" : "区间任务"}</span>
              <span data-icon="calendar-days" aria-hidden="true"></span>
              <span>${escapeHtml(taskScheduleLabel(task))}</span>
              <span data-icon="clock-3" aria-hidden="true"></span>
              <span>${escapeHtml(task.reminderTime || state.settings.defaultReminderTime)}</span>
              ${progress}
            </div>
          </div>
          <div class="task-actions">
            ${toggle}
            <button class="task-edit-button" type="button" aria-label="编辑任务" data-icon="edit-3"></button>
          </div>
        `;

        row.querySelector(".task-toggle")?.addEventListener("click", () => {
          if (required) toggleTask(task.id, selectedDate);
        });
        row.querySelector(".task-edit-button").addEventListener("click", () => openTaskModal(task));
        elements.selectedTaskList.appendChild(row);
      });
    }

    const percent = requiredTasks.length === 0
      ? 100
      : Math.round((dayState.completed.length / requiredTasks.length) * 100);

    if (dayState.status === "checked") {
      elements.checkinTitle.textContent = "已成功打卡";
      elements.checkinNote.textContent = "全部必做任务均已完成";
      elements.checkinMark.className = "checkin-mark checked";
      elements.checkinMark.dataset.icon = "check";
      elements.checkinMark.dataset.iconRendered = "false";
      elements.checkinMark.innerHTML = "";
    } else if (requiredTasks.length === 0) {
      elements.checkinTitle.textContent = "休息日，无需打卡";
      elements.checkinNote.textContent = "没有安排必做任务";
      elements.checkinMark.className = "checkin-mark";
      elements.checkinMark.dataset.icon = "calendar";
      elements.checkinMark.dataset.iconRendered = "false";
      elements.checkinMark.innerHTML = "";
    } else {
      elements.checkinTitle.textContent = `${percent}% 已完成`;
      elements.checkinNote.textContent = `还剩 ${requiredTasks.length - dayState.completed.length} 项任务`;
      elements.checkinMark.className = "checkin-mark";
      elements.checkinMark.dataset.icon = "ellipsis";
      elements.checkinMark.dataset.iconRendered = "false";
      elements.checkinMark.innerHTML = "";
    }

    renderIcons(elements.selectedTaskList);
    renderIcons(elements.checkinMark.parentElement);
  }

  function renderYearView() {
    elements.yearViewTitle.textContent = `${yearCursor} 年打卡热力图`;
    elements.yearMonths.replaceChildren();
    elements.yearHeatmap.replaceChildren();

    for (let month = 1; month <= 12; month += 1) {
      const label = document.createElement("span");
      label.textContent = `${month}月`;
      elements.yearMonths.appendChild(label);
    }

    const first = new Date(yearCursor, 0, 1);
    const last = new Date(yearCursor, 11, 31);
    const offset = first.getDay();
    const totalCells = Math.ceil((offset + 366) / 7) * 7;

    for (let index = 0; index < totalCells; index += 1) {
      const dayNumber = index - offset + 1;
      const date = new Date(yearCursor, 0, dayNumber);
      const cell = document.createElement("button");

      if (date < first || date > last) {
        cell.className = "heat-cell";
        cell.type = "button";
        cell.tabIndex = -1;
        cell.disabled = true;
        cell.style.opacity = "0";
      } else {
        const key = dateKey(date);
        const dayState = getDayState(key);
        let level = 0;
        if (dayState.status === "checked") level = 4;
        if (dayState.status === "partial") level = 2;
        if (dayState.status === "rest") level = 0;
        cell.type = "button";
        cell.className = `heat-cell ${dayState.status}${key === todayKey ? " today" : ""}`;
        cell.dataset.level = String(level);
        cell.dataset.date = key;
        cell.setAttribute(
          "aria-label",
          `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日，${dayState.label}`
        );
        cell.addEventListener("click", () => {
          selectedDate = key;
          calendarCursor = new Date(date.getFullYear(), date.getMonth(), 1);
          updateView("today");
          renderAll();
        });
      }

      elements.yearHeatmap.appendChild(cell);
    }

    const stats = collectYearStats(yearCursor);
    elements.yearSummaryCheckins.textContent = `${stats.checked} 天`;
    elements.yearSummaryBestStreak.textContent = `${stats.bestStreak} 天`;
    elements.yearSummaryRequired.textContent = `${stats.required} 天`;
    elements.yearSummaryMissed.textContent = `${stats.missed} 天`;
  }

  function taskScheduleLabel(task) {
    if (task.type === "daily") {
      const weekdays = Array.isArray(task.weekdays) ? task.weekdays.map(Number) : [];
      const label = weekdays.length === 7 || weekdays.length === 0
        ? "每天"
        : `每周${weekdays.map((day) => weekdayNames[day]).join("、")}`;
      const start = task.startDate ? ` · ${task.startDate} 起` : "";
      const end = task.endDate ? ` · 至 ${task.endDate}` : "";
      return `${label}${start}${end}`;
    }

    const count = Math.max(1, Number(task.targetCount) || 1);
    return `${formatDateRange(task)} · 完成 ${count} 次`;
  }

  function renderManager() {
    elements.managerList.replaceChildren();
    const tasks = state.tasks
      .filter((task) => {
        if (taskFilter === "archived") return task.archived;
        if (task.archived) return false;
        if (taskFilter === "all") return true;
        return task.type === taskFilter;
      })
      .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));

    if (tasks.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.innerHTML = `
        <span data-icon="list-check" aria-hidden="true"></span>
        <div>
          <strong>这里还没有任务</strong>
          <span>创建每日习惯或区间任务后，它们会显示在这里。</span>
        </div>
      `;
      elements.managerList.appendChild(empty);
      renderIcons(elements.managerList);
      return;
    }

    tasks.forEach((task) => {
      const completionCount = (task.type === "range" ? completionDatesForTaskInRange(task) : completionDatesForTask(task)).length;
      const targetCount = Math.max(1, Number(task.targetCount) || 1);
      const progress = task.type === "range" ? `已完成 ${Math.min(completionCount, targetCount)} / ${targetCount} 次 · ` : "";
      const row = document.createElement("article");
      row.className = "manager-row";
      row.innerHTML = `
        <div class="manager-copy">
          <div class="manager-title">${escapeHtml(task.title)}</div>
          <div class="manager-meta">
            <span>${task.type === "daily" ? "每日习惯" : "区间任务"}</span>
            <span>${escapeHtml(taskScheduleLabel(task))}</span>
            <span>${progress}提醒 ${escapeHtml(task.reminderTime || state.settings.defaultReminderTime)}</span>
          </div>
        </div>
        <div class="manager-actions">
          <button class="subtle-button" type="button" data-manager-action="edit"><span data-icon="edit-3" aria-hidden="true"></span>编辑</button>
          <button class="subtle-button" type="button" data-manager-action="archive"><span data-icon="${task.archived ? "rotate-ccw" : "archive"}" aria-hidden="true"></span>${task.archived ? "恢复" : "归档"}</button>
        </div>
      `;

      row.querySelector('[data-manager-action="edit"]').addEventListener("click", () => openTaskModal(task));
      row.querySelector('[data-manager-action="archive"]').addEventListener("click", () => archiveTask(task.id, !task.archived));
      elements.managerList.appendChild(row);
    });

    renderIcons(elements.managerList);
  }

  function ensureAppearanceControls() {
    if (elements.paletteSelect) return;

    const blurRow = elements.blurRange.closest(".setting-row");
    const paletteRow = document.createElement("label");
    paletteRow.className = "setting-row";
    paletteRow.innerHTML = `
      <span>
        <strong>整体配色</strong>
        <small>改变背景、玻璃层和辅助颜色的整体氛围</small>
      </span>
      <select class="select-input" id="palette-select">
        <option value="mist">雾蓝玻璃</option>
        <option value="sand">暖沙玻璃</option>
        <option value="mint">青绿玻璃</option>
        <option value="graphite">石墨玻璃</option>
      </select>
    `;
    blurRow.before(paletteRow);
    elements.paletteSelect = paletteRow.querySelector("#palette-select");

    [ ["amber", "琥珀色"], ["ocean", "海青色"] ].forEach(([value, label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.accentChoice = value;
      button.setAttribute("aria-label", label);
      elements.accentControl.appendChild(button);
    });

    const customColor = document.createElement("label");
    customColor.className = "custom-color-button";
    customColor.setAttribute("aria-label", "自定义强调色");
    customColor.innerHTML = `<input type="color" id="custom-accent-input" value="#4d82c7" aria-label="选择自定义强调色">`;
    elements.accentControl.appendChild(customColor);
    elements.customAccentInput = customColor.querySelector("#custom-accent-input");
  }

  function renderSettings() {
    elements.notifyEnabled.checked = state.settings.notifyEnabled;
    elements.defaultReminderTime.value = state.settings.defaultReminderTime;
    elements.dailySummaryTime.value = state.settings.dailySummaryTime;
    elements.animationEnabled.checked = animationsEnabled();
    elements.blurRange.value = String(state.settings.blur);
    elements.blurValue.textContent = `${state.settings.blur} px`;
    elements.notificationStatus.textContent = state.settings.notifyEnabled ? "已开启" : "已关闭";
    elements.notificationStatus.classList.toggle("checked", state.settings.notifyEnabled);
    if (elements.paletteSelect) elements.paletteSelect.value = state.settings.palette || "mist";
    if (elements.customAccentInput) elements.customAccentInput.value = state.settings.customAccent || "#4d82c7";

    elements.themeControl.querySelectorAll("[data-theme-choice]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.themeChoice === state.settings.theme));
    });
    elements.accentControl.querySelectorAll("[data-accent-choice]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.accentChoice === state.settings.accent));
    });
    if (elements.customAccentInput) {
      elements.customAccentInput.closest(".custom-color-button")?.setAttribute("aria-pressed", String(state.settings.accent === "custom"));
    }
  }

  function toggleTask(taskId, key) {
    const id = completionKey(taskId, key);
    const completing = !state.completions[id];
    if (state.completions[id]) {
      delete state.completions[id];
    } else {
      state.completions[id] = true;
    }
    scheduleSave();
    renderAll();

    if (!completing) return;

    const row = findSelectedTaskRow(taskId);
    animateClass(row, "just-completed", 430);
    animateClass(row?.querySelector(".task-toggle"), "check-pop", 460);

    if (getDayState(key).status === "checked") {
      animateClass(elements.checkinMark, "celebrate", 620);
      animateClass(elements.todayProgressRing, "celebrate", 620);
      animateClass(elements.todayProgressBar.parentElement, "celebrate", 620);
      animateClass(document.querySelector(`.day-cell[data-date="${key}"]`), "day-pulse", 620);
    }
  }

  function archiveTask(taskId, archived) {
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task) return;
    task.archived = archived;
    scheduleSave();
    renderAll();
    showToast(archived ? "任务已归档" : "任务已恢复", task.title);
  }

  function setWeekdaySelection(values) {
    const selected = new Set((values || []).map(Number));
    elements.weekdayPicker.querySelectorAll("input").forEach((input) => {
      input.checked = selected.size === 0 || selected.has(Number(input.value));
    });
  }

  function getSelectedWeekdays() {
    return Array.from(elements.weekdayPicker.querySelectorAll("input:checked")).map((input) => Number(input.value));
  }

  function setTaskTypeFields(type) {
    const isDaily = type === "daily";
    elements.dailyFields.hidden = !isDaily;
    elements.rangeFields.hidden = isDaily;
    elements.dailyStartDate.required = isDaily;
    elements.rangeStartDate.required = !isDaily;
    elements.rangeEndDate.required = !isDaily;
  }

  function openTaskModal(task = null) {
    elements.taskForm.reset();
    elements.taskFormError.textContent = "";
    elements.taskId.value = task?.id || "";
    elements.taskModalLabel.textContent = task ? "编辑任务" : "创建任务";
    elements.taskModalTitle.textContent = task ? task.title : "新建任务";
    elements.taskTitle.value = task?.title || "";
    elements.taskType.value = task?.type || "daily";
    elements.taskReminderTime.value = task?.reminderTime || "";
    elements.dailyStartDate.value = task?.startDate || todayKey;
    elements.dailyEndDate.value = task?.endDate || "";
    elements.rangeStartDate.value = task?.startDate || todayKey;
    elements.rangeEndDate.value = task?.endDate || addDays(todayKey, 30);
    elements.rangeTargetCount.value = String(task?.targetCount || 1);
    setWeekdaySelection(task?.weekdays || [0, 1, 2, 3, 4, 5, 6]);
    setTaskTypeFields(elements.taskType.value);
    elements.taskModal.hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(() => elements.taskTitle.focus(), 0);
  }

  function closeTaskModal() {
    elements.taskModal.hidden = true;
    document.body.style.overflow = "";
  }

  function submitTask(event) {
    event.preventDefault();
    elements.taskFormError.textContent = "";

    const title = elements.taskTitle.value.trim();
    const type = elements.taskType.value;
    const reminderTime = elements.taskReminderTime.value || null;
    const existing = state.tasks.find((task) => task.id === elements.taskId.value);

    if (!title) {
      elements.taskFormError.textContent = "请输入任务名称。";
      return;
    }

    let task = {
      id: existing?.id || (crypto.randomUUID ? crypto.randomUUID() : `task-${Date.now()}-${Math.random().toString(16).slice(2)}`),
      title,
      type,
      reminderTime,
      archived: existing?.archived || false,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (type === "daily") {
      const weekdays = getSelectedWeekdays();
      const startDate = elements.dailyStartDate.value;
      const endDate = elements.dailyEndDate.value || null;
      if (!startDate) {
        elements.taskFormError.textContent = "请选择开始日期。";
        return;
      }
      if (weekdays.length === 0) {
        elements.taskFormError.textContent = "请至少选择一个重复日期。";
        return;
      }
      if (endDate && endDate < startDate) {
        elements.taskFormError.textContent = "结束日期不能早于开始日期。";
        return;
      }
      task = { ...task, weekdays, startDate, endDate };
    } else {
      const startDate = elements.rangeStartDate.value;
      const endDate = elements.rangeEndDate.value;
      const targetCount = Math.max(1, Number(elements.rangeTargetCount.value) || 1);
      if (!startDate || !endDate) {
        elements.taskFormError.textContent = "请选择完整的开始和结束日期。";
        return;
      }
      if (endDate < startDate) {
        elements.taskFormError.textContent = "结束日期不能早于开始日期。";
        return;
      }
      task = { ...task, startDate, endDate, targetCount, weekdays: [] };
    }

    if (existing) {
      Object.assign(existing, task);
    } else {
      state.tasks.push(task);
    }

    scheduleSave(true);
    closeTaskModal();
    renderAll();
    showToast(existing ? "任务已更新" : "任务已创建", title);
  }

  function showConfirm(message, title = "确认操作") {
    elements.confirmMessage.textContent = message;
    document.getElementById("confirm-title").textContent = title;
    elements.confirmDialog.hidden = false;
    document.body.style.overflow = "hidden";

    return new Promise((resolve) => {
      confirmResolver = resolve;
    });
  }

  function closeConfirm(result) {
    elements.confirmDialog.hidden = true;
    document.body.style.overflow = "";
    if (confirmResolver) {
      confirmResolver(result);
      confirmResolver = null;
    }
  }

  function normalizeBulkText(value) {
    return String(value || "")
      .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 65248))
      .replaceAll("：", ":")
      .replaceAll("．", ".");
  }

  function validDateParts(year, month, day) {
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
  }

  function parseBulkDateToken(token) {
    const normalized = normalizeBulkText(token)
      .replace(/日$/g, "")
      .replace(/[年/.]/g, "-")
      .replace(/月/g, "-");
    const parts = normalized.split("-").filter(Boolean).map(Number);
    if (parts.length === 3) return validDateParts(parts[0], parts[1], parts[2]);
    if (parts.length === 2) return validDateParts(today.getFullYear(), parts[0], parts[1]);
    return null;
  }

  function extractBulkDates(text) {
    const source = normalizeBulkText(text);
    const regex = /((?:\d{4}[年\/\-])?\d{1,2}[月\/\-]\d{1,2}日?)/g;
    const matches = [];
    let match;
    while ((match = regex.exec(source)) !== null) {
      const date = parseBulkDateToken(match[0]);
      if (date) matches.push({ text: match[0], index: match.index, end: match.index + match[0].length, date });
    }

    if (matches.length === 0) return null;
    if (matches.length >= 2) {
      const between = source.slice(matches[0].end, matches[1].index);
      if (/^\s*(?:至|到|~|～|—|–|-)\s*$/.test(between)) {
        return { kind: "range", start: dateKey(matches[0].date), end: dateKey(matches[1].date), matches };
      }
      return { kind: "multiple", dates: matches.map((item) => dateKey(item.date)), matches };
    }
    return { kind: "single", date: dateKey(matches[0].date), matches };
  }

  function extractBulkTime(text) {
    const source = normalizeBulkText(text);
    let match = source.match(/(?:(上午|下午|晚上|早上|中午)\s*)?(\d{1,2}):(\d{2})/);
    if (!match) match = source.match(/(?:(上午|下午|晚上|早上|中午)\s*)?(\d{1,2})点(\d{1,2})?分?/);
    if (!match) return null;

    let hour = Number(match[2]);
    const minute = Number(match[3] || 0);
    const period = match[1] || "";
    if (["下午", "晚上"].includes(period) && hour < 12) hour += 12;
    if (hour > 23 || minute > 59) return null;
    return `${pad(hour)}:${pad(minute)}`;
  }

  function parseBulkWeekdays(text) {
    const source = normalizeBulkText(text);
    if (/每天|每日|天天/.test(source)) return [0, 1, 2, 3, 4, 5, 6];
    const map = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 0, 天: 0 };
    const segments = source.match(/周([一二三四五六日天](?:\s*[、,，和及]?\s*[一二三四五六日天])*)/g) || [];
    const weekdays = [];
    segments.forEach((segment) => {
      segment.replace(/[一二三四五六日天]/g, (char) => {
        const value = map[char];
        if (value !== undefined && !weekdays.includes(value)) weekdays.push(value);
        return char;
      });
    });
    return weekdays;
  }

  function cleanBulkTitle(text, dateInfo, reminderTime) {
    let result = normalizeBulkText(text);
    if (dateInfo) {
      dateInfo.matches.forEach((match) => {
        result = result.replace(match.text, " ");
      });
    }
    if (reminderTime) result = result.replace(/(?:上午|下午|晚上|早上|中午)?\s*\d{1,2}[:点]\d{1,2}分?/, " ");
    result = result
      .replace(/任务名称|任务|事项|内容|日期|提醒时间|提醒|时间|每天|每日|天天|区间任务|每日习惯/g, " ")
      .replace(/^(?:从|期间|开始|结束|至|到)\s*/g, "")
      .replace(/\s*(?:从|期间|开始|结束|至|到)$/g, "")
      .replace(/^[\s\-–—,，;；|]+|[\s\-–—,，;；|]+$/g, "");
    return result || "未命名任务";
  }

  function splitBulkRow(line) {
    if (line.includes("\t")) return line.split("\t").map((cell) => cell.trim());
    if (line.includes("|")) return line.split("|").map((cell) => cell.trim());
    if (line.includes(",") || line.includes("，")) return line.split(/[,，]/).map((cell) => cell.trim());
    return [line.trim()];
  }

  function detectBulkHeader(cells) {
    const normalized = cells.map((cell) => normalizeBulkText(cell));
    const map = {};
    normalized.forEach((cell, index) => {
      if (/开始/.test(cell)) map.start = index;
      else if (/截止|结束/.test(cell)) map.end = index;
      else if (/日期/.test(cell)) map.date = index;
      if (/提醒|时间/.test(cell) && !/开始|截止|结束/.test(cell)) map.reminder = index;
      if (/任务|事项|名称|内容/.test(cell)) map.title = index;
      if (/类型|重复/.test(cell)) map.type = index;
    });
    return Object.keys(map).length >= 2 ? map : null;
  }

  function makeBulkTasks({ title, dateText, reminderText, typeText }) {
    const combinedText = `${title || ""} ${dateText || ""} ${typeText || ""}`;
    const dateInfo = extractBulkDates(dateText || combinedText);
    const reminderTime = extractBulkTime(reminderText || "") || extractBulkTime(combinedText);
    const cleanTitle = cleanBulkTitle(title || combinedText, dateInfo, reminderTime);
    const weekdays = parseBulkWeekdays(`${typeText || ""} ${title || ""} ${dateText || ""}`);
    const dailyRequested = weekdays.length > 0 || /每天|每日|天天|每日习惯/.test(`${typeText || ""} ${title || ""}`);
    const targetMatch = String(typeText || combinedText).match(/(\d+)\s*次/);
    const targetCount = targetMatch ? Math.max(1, Number(targetMatch[1])) : 1;

    if (!dateInfo) {
      if (!dailyRequested) return { error: "未识别到日期" };
      return {
        tasks: [{
          title: cleanTitle,
          type: "daily",
          startDate: selectedDate,
          endDate: null,
          weekdays: weekdays.length > 0 ? weekdays : [0, 1, 2, 3, 4, 5, 6],
          reminderTime
        }]
      };
    }

    if (dateInfo.kind === "range") {
      if (dailyRequested) {
        return {
          tasks: [{
            title: cleanTitle,
            type: "daily",
            startDate: dateInfo.start,
            endDate: dateInfo.end,
            weekdays: weekdays.length > 0 ? weekdays : [0, 1, 2, 3, 4, 5, 6],
            reminderTime
          }]
        };
      }
      return {
        tasks: [{
          title: cleanTitle,
          type: "range",
          startDate: dateInfo.start,
          endDate: dateInfo.end,
          targetCount,
          weekdays: [],
          reminderTime
        }]
      };
    }

    if (dateInfo.kind === "multiple") {
      return {
        tasks: dateInfo.dates.map((date) => ({
          title: cleanTitle,
          type: "daily",
          startDate: date,
          endDate: date,
          weekdays: [parseDateKey(date).getDay()],
          reminderTime
        }))
      };
    }

    return {
      tasks: [{
        title: cleanTitle,
        type: "daily",
        startDate: dateInfo.date,
        endDate: dailyRequested ? null : dateInfo.date,
        weekdays: weekdays.length > 0 ? weekdays : [parseDateKey(dateInfo.date).getDay()],
        reminderTime
      }]
    };
  }

  function parseBulkText(text) {
    const lines = String(text || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) return { items: [], warnings: [] };
    const rows = lines.map(splitBulkRow);
    const header = detectBulkHeader(rows[0]);
    const dataRows = header ? rows.slice(1) : rows;
    const items = [];
    const warnings = [];

    dataRows.forEach((cells, index) => {
      const rowNumber = index + (header ? 2 : 1);
      const rowText = cells.join(" ");
      let result;

      if (header) {
        const title = cells[header.title] || cells.find((cell) => cell && !extractBulkDates(cell) && !extractBulkTime(cell)) || rowText;
        let dateText = header.date !== undefined ? cells[header.date] : rowText;
        if (header.start !== undefined || header.end !== undefined) {
          dateText = `${cells[header.start] || ""} 至 ${cells[header.end] || ""}`;
        }
        result = makeBulkTasks({
          title,
          dateText,
          reminderText: header.reminder !== undefined ? cells[header.reminder] : "",
          typeText: header.type !== undefined ? cells[header.type] : ""
        });
      } else {
        const dateCells = cells.filter((cell) => extractBulkDates(cell));
        const timeCells = cells.filter((cell) => extractBulkTime(cell));
        const titleCells = cells.filter((cell) => !extractBulkDates(cell) && !extractBulkTime(cell));
        result = makeBulkTasks({
          title: titleCells.join(" ") || rowText,
          dateText: dateCells.join("，") || rowText,
          reminderText: timeCells.join(" "),
          typeText: rowText
        });
      }

      if (result.error) warnings.push(`第 ${rowNumber} 行：${result.error}`);
      else items.push(...result.tasks);
    });

    return { items, warnings };
  }

  function describeBulkTask(task) {
    if (task.type === "range") return `${task.startDate} 至 ${task.endDate} · 完成 ${task.targetCount || 1} 次`;
    if (task.endDate && task.endDate !== task.startDate) {
      const weekdays = task.weekdays?.length === 7 ? "每天" : `每周${task.weekdays.map((day) => weekdayNames[day]).join("、")}`;
      return `${task.startDate} 至 ${task.endDate} · ${weekdays}`;
    }
    return `${task.startDate} · 星期${weekdayNames[parseDateKey(task.startDate).getDay()]}`;
  }

  function ensureBulkImportUI() {
    if (document.getElementById("bulk-import-modal")) return;

    const taskButton = document.getElementById("add-task-button-secondary");
    const taskButtonRow = taskButton?.parentElement;
    if (taskButtonRow) {
      const button = document.createElement("button");
      button.className = "subtle-button";
      button.id = "bulk-import-button";
      button.type = "button";
      button.innerHTML = `<span data-icon="upload" aria-hidden="true"></span>粘贴导入`;
      taskButtonRow.insertBefore(button, taskButton);
    }

    const dataActions = document.querySelector("#view-settings .data-actions");
    if (dataActions) {
      const button = document.createElement("button");
      button.className = "subtle-button";
      button.id = "bulk-import-button-settings";
      button.type = "button";
      button.innerHTML = `<span data-icon="upload" aria-hidden="true"></span>导入任务表`;
      dataActions.prepend(button);
    }

    const modal = document.createElement("div");
    modal.className = "modal-backdrop";
    modal.id = "bulk-import-modal";
    modal.hidden = true;
    modal.innerHTML = `
      <section class="modal bulk-import-modal" role="dialog" aria-modal="true" aria-labelledby="bulk-import-title">
        <header class="modal-header">
          <div>
            <p class="panel-label">表格或文字粘贴</p>
            <h2 id="bulk-import-title">识别并导入任务</h2>
          </div>
          <button class="icon-button" type="button" id="close-bulk-import" aria-label="关闭" data-icon="x"></button>
        </header>
        <label class="form-field bulk-input-field">
          <span>粘贴内容</span>
          <textarea class="bulk-textarea" id="bulk-import-text" placeholder="任务名称\t日期\t提醒时间&#10;喝水\t2026-10-02\t20:00&#10;周报\t2026-10-01至2026-10-07"></textarea>
        </label>
        <div class="bulk-toolbar">
          <button class="subtle-button" type="button" id="bulk-parse-button"><span data-icon="wand-sparkles" aria-hidden="true"></span>重新识别</button>
          <span class="setting-feedback" id="bulk-import-summary">等待粘贴内容</span>
        </div>
        <div class="bulk-preview" id="bulk-import-preview"></div>
        <div class="bulk-warnings" id="bulk-import-warnings"></div>
        <footer class="modal-footer">
          <button class="subtle-button" type="button" id="cancel-bulk-import">取消</button>
          <button class="primary-button" type="button" id="confirm-bulk-import" disabled>一键识别并导入</button>
        </footer>
      </section>`;
    document.body.appendChild(modal);

    elements.bulkImportModal = modal;
    elements.bulkImportText = modal.querySelector("#bulk-import-text");
    elements.bulkImportPreview = modal.querySelector("#bulk-import-preview");
    elements.bulkImportWarnings = modal.querySelector("#bulk-import-warnings");
    elements.bulkImportSummary = modal.querySelector("#bulk-import-summary");
    elements.confirmBulkImport = modal.querySelector("#confirm-bulk-import");

    document.getElementById("bulk-import-button")?.addEventListener("click", openBulkImportModal);
    document.getElementById("bulk-import-button-settings")?.addEventListener("click", openBulkImportModal);
    document.getElementById("close-bulk-import").addEventListener("click", closeBulkImportModal);
    document.getElementById("cancel-bulk-import").addEventListener("click", closeBulkImportModal);
    document.getElementById("bulk-parse-button").addEventListener("click", parseBulkInput);
    elements.confirmBulkImport.addEventListener("click", importBulkTasks);
    elements.bulkImportText.addEventListener("input", parseBulkInput);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeBulkImportModal();
    });
    renderIcons(modal);
  }

  function openBulkImportModal() {
    elements.bulkImportModal.hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(() => elements.bulkImportText.focus(), 0);
  }

  function closeBulkImportModal() {
    elements.bulkImportModal.hidden = true;
    document.body.style.overflow = "";
  }

  function renderBulkPreview() {
    elements.bulkImportPreview.replaceChildren();
    elements.bulkImportWarnings.replaceChildren();

    if (bulkImportState.items.length === 0) {
      elements.bulkImportSummary.textContent = "没有识别到可导入任务";
      elements.confirmBulkImport.disabled = true;
    } else {
      elements.bulkImportSummary.textContent = `已识别 ${bulkImportState.items.length} 项任务`;
      elements.confirmBulkImport.disabled = false;
    }

    bulkImportState.items.forEach((task, index) => {
      const row = document.createElement("div");
      row.className = "bulk-preview-row";
      row.innerHTML = `
        <span class="bulk-preview-index">${index + 1}</span>
        <div class="bulk-preview-copy">
          <strong>${escapeHtml(task.title)}</strong>
          <small>${escapeHtml(describeBulkTask(task))}${task.reminderTime ? ` · 提醒 ${escapeHtml(task.reminderTime)}` : ""}</small>
        </div>
      `;
      elements.bulkImportPreview.appendChild(row);
    });

    bulkImportState.warnings.forEach((warning) => {
      const row = document.createElement("div");
      row.className = "bulk-warning";
      row.textContent = warning;
      elements.bulkImportWarnings.appendChild(row);
    });
  }

  function parseBulkInput() {
    const text = elements.bulkImportText.value;
    bulkImportState = { ...parseBulkText(text), lastText: text };
    renderBulkPreview();
  }

  function isDuplicateBulkTask(task) {
    return state.tasks.some((existing) => {
      const existingWeekdays = [...(existing.weekdays || [])].sort().join(",");
      const nextWeekdays = [...(task.weekdays || [])].sort().join(",");
      return !existing.archived &&
        existing.title === task.title &&
        existing.type === task.type &&
        (existing.startDate || null) === (task.startDate || null) &&
        (existing.endDate || null) === (task.endDate || null) &&
        (existing.reminderTime || null) === (task.reminderTime || null) &&
        existingWeekdays === nextWeekdays;
    });
  }

  function importBulkTasks() {
    if (bulkImportState.items.length === 0) return;
    let added = 0;
    let skipped = 0;
    bulkImportState.items.forEach((item) => {
      if (isDuplicateBulkTask(item)) {
        skipped += 1;
        return;
      }
      state.tasks.push({
        id: crypto.randomUUID ? crypto.randomUUID() : `task-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title: item.title,
        type: item.type,
        startDate: item.startDate,
        endDate: item.endDate || null,
        weekdays: item.weekdays || [],
        targetCount: item.type === "range" ? Math.max(1, Number(item.targetCount) || 1) : undefined,
        reminderTime: item.reminderTime || null,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      added += 1;
    });

    scheduleSave(true);
    closeBulkImportModal();
    elements.bulkImportText.value = "";
    bulkImportState = { items: [], warnings: [], lastText: "" };
    renderAll();
    showToast("批量导入完成", `新增 ${added} 项任务${skipped ? `，跳过 ${skipped} 项重复任务` : ""}。`);
  }

  function showToast(title, message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(message)}</span>`;
    elements.toastStack.appendChild(toast);
    setTimeout(() => toast.remove(), 4200);
  }

  async function exportData() {
    const payload = JSON.stringify(state, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `每日计划备份-${todayKey}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("备份已导出", "JSON 文件已保存到你选择的位置。");
  }

  async function importData(file) {
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      if (!imported || !Array.isArray(imported.tasks)) throw new Error("备份文件格式不正确。");
      const confirmed = await showConfirm("导入后会替换当前全部任务和打卡记录，是否继续？", "导入备份");
      if (!confirmed) return;

      state = normalizeState(imported);
      localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
      applyAppearance();
      renderAll();
      showToast("导入完成", "任务和打卡记录已经恢复。");
    } catch (error) {
      showToast("导入失败", error.message || "请选择有效的备份文件。", "error");
    }
  }

  async function resetData() {
    const confirmed = await showConfirm("这会清空全部任务和打卡记录，且无法撤销。是否继续？", "清空全部数据");
    if (!confirmed) return;
    state.tasks = [];
    state.completions = {};
    state.pomodoro = { sessions: {} };
    resetPomodoroTimer(true);
    scheduleSave(true);
    renderAll();
    showToast("数据已清空", "可以重新创建任务。");
  }

  function bindEvents() {
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", () => updateView(button.dataset.view));
    });
    elements.pomodoroModeSwitch.addEventListener("click", (event) => {
      const button = event.target.closest("[data-pomodoro-mode]");
      if (button) setPomodoroMode(button.dataset.pomodoroMode);
    });
    elements.pomodoroStart.addEventListener("click", togglePomodoroTimer);
    elements.pomodoroReset.addEventListener("click", () => resetPomodoroTimer());
    elements.pomodoroSkip.addEventListener("click", skipPomodoroPhase);
    elements.pomodoroTaskSelect.addEventListener("change", () => {
      pomodoroTimer.taskId = elements.pomodoroTaskSelect.value;
      persistPomodoroTimer();
      renderPomodoro();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && pomodoroTimer.running) tickPomodoro();
      if (document.visibilityState === "visible") checkDueReminders();
    });

    elements.addTaskButton.addEventListener("click", () => openTaskModal());
    elements.addTaskButtonSecondary.addEventListener("click", () => openTaskModal());
    elements.closeTaskModal.addEventListener("click", closeTaskModal);
    elements.cancelTaskButton?.addEventListener("click", closeTaskModal);
    document.getElementById("cancel-task-button").addEventListener("click", closeTaskModal);
    elements.taskModal.addEventListener("click", (event) => {
      if (event.target === elements.taskModal) closeTaskModal();
    });
    elements.taskForm.addEventListener("submit", submitTask);
    elements.taskType.addEventListener("change", () => setTaskTypeFields(elements.taskType.value));

    elements.previousMonth.addEventListener("click", () => {
      calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1);
      renderCalendar();
      renderIcons(elements.monthGrid);
    });

    elements.nextMonth.addEventListener("click", () => {
      calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1);
      renderCalendar();
      renderIcons(elements.monthGrid);
    });

    elements.calendarTodayButton.addEventListener("click", () => {
      calendarCursor = new Date(today.getFullYear(), today.getMonth(), 1);
      selectedDate = todayKey;
      renderAll();
    });

    elements.jumpToday.addEventListener("click", () => {
      selectedDate = todayKey;
      calendarCursor = new Date(today.getFullYear(), today.getMonth(), 1);
      yearCursor = today.getFullYear();
      updateView("today");
      renderAll();
    });

    elements.previousYear.addEventListener("click", () => {
      yearCursor -= 1;
      renderYearView();
    });

    elements.nextYear.addEventListener("click", () => {
      yearCursor += 1;
      renderYearView();
    });

    elements.currentYearButton.addEventListener("click", () => {
      yearCursor = today.getFullYear();
      renderYearView();
    });

    document.querySelectorAll("[data-task-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        taskFilter = button.dataset.taskFilter;
        document.querySelectorAll("[data-task-filter]").forEach((item) => {
          const active = item.dataset.taskFilter === taskFilter;
          item.classList.toggle("active", active);
          item.setAttribute("aria-selected", String(active));
        });
        renderManager();
      });
    });

    elements.notifyEnabled.addEventListener("change", () => {
      state.settings.notifyEnabled = elements.notifyEnabled.checked;
      scheduleSave(true);
      renderSettings();
    });

    elements.defaultReminderTime.addEventListener("change", () => {
      state.settings.defaultReminderTime = elements.defaultReminderTime.value || "20:00";
      scheduleSave(true);
      renderAll();
    });

    elements.dailySummaryTime.addEventListener("change", () => {
      state.settings.dailySummaryTime = elements.dailySummaryTime.value || "22:30";
      scheduleSave(true);
      renderSettings();
    });

    elements.themeControl.addEventListener("click", (event) => {
      const button = event.target.closest("[data-theme-choice]");
      if (!button) return;
      state.settings.theme = button.dataset.themeChoice;
      scheduleSave(true);
      renderAll();
    });

    elements.accentControl.addEventListener("click", (event) => {
      const button = event.target.closest("[data-accent-choice]");
      if (!button) return;
      state.settings.accent = button.dataset.accentChoice;
      scheduleSave(true);
      renderAll();
    });

    if (elements.paletteSelect) {
      elements.paletteSelect.addEventListener("change", () => {
        state.settings.palette = elements.paletteSelect.value;
        scheduleSave(true);
        renderAll();
      });
    }

    if (elements.customAccentInput) {
      elements.customAccentInput.addEventListener("input", () => {
        state.settings.accent = "custom";
        state.settings.customAccent = elements.customAccentInput.value;
        applyAppearance();
        renderSettings();
      });
      elements.customAccentInput.addEventListener("change", () => scheduleSave(true));
    }

    elements.blurRange.addEventListener("input", () => {
      state.settings.blur = Number(elements.blurRange.value);
      elements.blurValue.textContent = `${state.settings.blur} px`;
      applyAppearance();
    });

    elements.blurRange.addEventListener("change", () => scheduleSave(true));

    elements.animationEnabled.addEventListener("change", () => {
      state.settings.animationsEnabled = elements.animationEnabled.checked;
      applyAppearance();
      scheduleSave(true);
      renderSettings();
    });

    elements.testNotification.addEventListener("click", async () => {
      elements.notificationFeedback.textContent = "正在发送...";
      const shown = await showBrowserNotification(
        "每日计划测试提醒",
        "如果你看到这条通知，浏览器提醒功能已经可用。",
        "daily-calendar-test"
      );
      elements.notificationFeedback.textContent = shown ? "测试提醒已发送" : "通知权限未开启或当前环境不支持";
    });

    elements.exportData.addEventListener("click", exportData);
    elements.importDataButton.addEventListener("click", () => elements.dataImportInput.click());
    elements.dataImportInput.addEventListener("change", () => {
      const file = elements.dataImportInput.files?.[0];
      if (file) importData(file);
      elements.dataImportInput.value = "";
    });
    elements.resetData.addEventListener("click", resetData);
    elements.confirmCancel.addEventListener("click", () => closeConfirm(false));
    elements.confirmOk.addEventListener("click", () => closeConfirm(true));
    elements.confirmDialog.addEventListener("click", (event) => {
      if (event.target === elements.confirmDialog) closeConfirm(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !elements.taskModal.hidden) closeTaskModal();
      if (event.key === "Escape" && !elements.confirmDialog.hidden) closeConfirm(false);
    });
  }

  async function init() {
    ensureAppearanceControls();
    ensureBulkImportUI();
    bindEvents();
    renderIcons(document);
    try {
      await loadState();
      resumePomodoroTimer();
      startReminderTicker();
      updateView("today");
    } catch (error) {
      showToast("无法启动界面", error.message || "请重新打开软件。", "error");
    }
  }

  init();
})();
