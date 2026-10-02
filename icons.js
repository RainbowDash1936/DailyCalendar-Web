(() => {
  const icons = {
    "archive": ['<rect width="20" height="5" x="2" y="3" rx="1"></rect>', '<path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"></path>', '<path d="M10 12h4"></path>'],
    "bell": ['<path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"></path>', '<path d="M10 21h4"></path>'],
    "calendar": ['<rect width="18" height="18" x="3" y="4" rx="2"></rect>', '<path d="M16 2v4M8 2v4M3 10h18"></path>'],
    "calendar-check": ['<path d="M8 2v4M16 2v4"></path>', '<rect width="18" height="18" x="3" y="4" rx="2"></rect>', '<path d="M3 10h18M9 16l2 2 4-4"></path>'],
    "calendar-days": ['<path d="M8 2v4M16 2v4M3 10h18"></path>', '<rect width="18" height="18" x="3" y="4" rx="2"></rect>', '<path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"></path>'],
    "check": ['<path d="M20 6 9 17l-5-5"></path>'],
    "check-circle-2": ['<circle cx="12" cy="12" r="10"></circle>', '<path d="m9 12 2 2 4-4"></path>'],
    "chevron-left": ['<path d="m15 18-6-6 6-6"></path>'],
    "chevron-right": ['<path d="m9 18 6-6-6-6"></path>'],
    "circle": ['<circle cx="12" cy="12" r="10"></circle>'],
    "clock-3": ['<circle cx="12" cy="12" r="10"></circle>', '<path d="M12 6v6h4"></path>'],
    "download": ['<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>', '<path d="m7 10 5 5 5-5M12 15V3"></path>'],
    "edit-3": ['<path d="M12 20h9"></path>', '<path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>'],
    "ellipsis": ['<circle cx="12" cy="12" r="1"></circle>', '<circle cx="19" cy="12" r="1"></circle>', '<circle cx="5" cy="12" r="1"></circle>'],
    "flame": ['<path d="M8.5 14.5A3.5 3.5 0 0 0 12 18c2 0 3.5-1.5 3.5-3.5 0-2.2-1.5-4.1-3.5-6.5C10 10.4 8.5 12.3 8.5 14.5Z"></path>', '<path d="M12 2c2.5 3.1 6 6.5 6 11a6 6 0 0 1-12 0c0-2.2.8-4.1 2.2-6"></path>'],
    "info": ['<circle cx="12" cy="12" r="10"></circle>', '<path d="M12 16v-4M12 8h.01"></path>'],
    "list-check": ['<path d="M11 12h10M11 18h10M11 6h10"></path>', '<path d="m3 6 1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2"></path>'],
    "locate-fixed": ['<path d="M12 2v3M12 19v3M2 12h3M19 12h3"></path>', '<circle cx="12" cy="12" r="7"></circle>', '<circle cx="12" cy="12" r="2"></circle>'],
    "plus": ['<path d="M5 12h14M12 5v14"></path>'],
    "pause": ['<rect x="14" y="4" width="4" height="16" rx="1"></rect>', '<rect x="6" y="4" width="4" height="16" rx="1"></rect>'],
    "play": ['<polygon points="6 3 20 12 6 21 6 3"></polygon>'],
    "repeat-2": ['<path d="m17 2 4 4-4 4"></path>', '<path d="M3 11V9a4 4 0 0 1 4-4h14"></path>', '<path d="m7 22-4-4 4-4"></path>', '<path d="M21 13v2a4 4 0 0 1-4 4H3"></path>'],
    "rotate-ccw": ['<path d="M3 12a9 9 0 1 0 3-6.7L3 8"></path>', '<path d="M3 3v5h5"></path>'],
    "skip-forward": ['<polygon points="5 4 15 12 5 20 5 4"></polygon>', '<line x1="19" x2="19" y1="5" y2="19"></line>'],
    "settings": ['<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"></path>', '<circle cx="12" cy="12" r="3"></circle>'],
    "sun": ['<circle cx="12" cy="12" r="4"></circle>', '<path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"></path>'],
    "target": ['<circle cx="12" cy="12" r="10"></circle>', '<circle cx="12" cy="12" r="6"></circle>', '<circle cx="12" cy="12" r="2"></circle>'],
    "timer": ['<line x1="10" x2="14" y1="2" y2="2"></line>', '<line x1="12" x2="15" y1="14" y2="11"></line>', '<circle cx="12" cy="14" r="8"></circle>'],
    "trash-2": ['<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"></path>', '<path d="M10 11v5M14 11v5"></path>'],
    "upload": ['<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>', '<path d="m17 8-5-5-5 5M12 3v12"></path>'],
    "wand-sparkles": ['<path d="m15 4 5 5"></path>', '<path d="M3 21 16.5 7.5"></path>', '<path d="m6 3 .7 1.3L8 5l-1.3.7L6 7l-.7-1.3L4 5l1.3-.7Z"></path>', '<path d="m19 16 .7 1.3L21 18l-1.3.7L19 20l-.7-1.3L17 18l1.3-.7Z"></path>'],
    "x": ['<path d="M18 6 6 18M6 6l12 12"></path>']
  };

  function renderIcons(root = document) {
    root.querySelectorAll("[data-icon]").forEach((element) => {
      const name = element.getAttribute("data-icon");
      const paths = icons[name];
      if (!paths || element.dataset.iconRendered === "true") return;

      element.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths.join("")}</svg>`;
      element.dataset.iconRendered = "true";
    });
  }

  window.DailyCalendarIcons = { renderIcons };
})();
