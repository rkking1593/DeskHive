/* Deskhive — Interactive SaaS Platform Script
   Real multi-user auth (email + password verification), mobile-visible
   session state, ROI calculator transparency note, and an icon-based
   show/hide password toggle docked inside each password field.
*/

document.addEventListener('DOMContentLoaded', () => {

  // 1. TOAST NOTIFICATION SYSTEM
  const toastContainer = document.getElementById('toastContainer');
  function showToast(message, isError = false) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    if (isError) {
      toast.style.background = '#e11d48';
      toast.style.color = '#ffffff';
    }
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // 2. AUTH MODAL & REAL MULTI-USER LOCALSTORAGE AUTH
  const authModalOverlay = document.getElementById('authModalOverlay');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const openSignInBtn = document.getElementById('openSignInBtn');
  const openSignUpBtn = document.getElementById('openSignUpBtn');
  const heroTrialBtn = document.getElementById('heroTrialBtn');
  const openAuthBtns = document.querySelectorAll('.open-auth-btn');

  const tabSignIn = document.getElementById('tabSignIn');
  const tabRegister = document.getElementById('tabRegister');
  const formSignIn = document.getElementById('formSignIn');
  const formRegister = document.getElementById('formRegister');
  const headerAuthActions = document.getElementById('headerAuthActions');
  const navLinks = document.getElementById('navLinks');

  const USERS_KEY = 'deskhive_users';
  const SESSION_KEY = 'deskhive_active_user';

  function getStoredUsers() {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function openModal(mode = 'signin') {
    if (!authModalOverlay) return;
    authModalOverlay.classList.add('open');
    authModalOverlay.setAttribute('aria-hidden', 'false');
    switchTab(mode === 'register' ? 'register' : 'signin');
  }

  function closeModal() {
    if (!authModalOverlay) return;
    authModalOverlay.classList.remove('open');
    authModalOverlay.setAttribute('aria-hidden', 'true');
  }

  function switchTab(targetTab) {
    if (targetTab === 'register') {
      tabRegister.classList.add('active');
      tabSignIn.classList.remove('active');
      formRegister.classList.add('active');
      formSignIn.classList.remove('active');
    } else {
      tabSignIn.classList.add('active');
      tabRegister.classList.remove('active');
      formSignIn.classList.add('active');
      formRegister.classList.remove('active');
    }
  }

  if (openSignInBtn) openSignInBtn.addEventListener('click', () => openModal('signin'));
  if (openSignUpBtn) openSignUpBtn.addEventListener('click', () => openModal('register'));
  if (heroTrialBtn) heroTrialBtn.addEventListener('click', () => openModal('register'));
  openAuthBtns.forEach(btn => btn.addEventListener('click', () => openModal('register')));
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

  if (authModalOverlay) {
    authModalOverlay.addEventListener('click', (e) => {
      if (e.target === authModalOverlay) closeModal();
    });
  }

  if (tabSignIn && tabRegister) {
    tabSignIn.addEventListener('click', () => switchTab('signin'));
    tabRegister.addEventListener('click', () => switchTab('register'));
  }

  // Builds the desktop AND mobile "logged in" state, so login is visible
  // on phones too — not just in the desktop header.
  function checkUserSession() {
    const activeUserRaw = localStorage.getItem(SESSION_KEY);

    const existingMobileChip = document.getElementById('mobileUserChip');
    if (existingMobileChip) existingMobileChip.remove();

    if (activeUserRaw) {
      const activeUser = JSON.parse(activeUserRaw);
      const userName = activeUser.name || activeUser.email.split('@')[0];

      if (headerAuthActions) {
        headerAuthActions.innerHTML = `
          <div class="user-chip">
            <span>👋 ${userName}</span>
            <button class="signout-btn" id="signOutBtnDesktop">Sign out</button>
          </div>
        `;
        document.getElementById('signOutBtnDesktop').addEventListener('click', handleSignOut);
      }

      if (navLinks) {
        const mobileChipDiv = document.createElement('div');
        mobileChipDiv.className = 'mobile-user-chip';
        mobileChipDiv.id = 'mobileUserChip';
        mobileChipDiv.innerHTML = `
          <span>👋 ${userName}</span>
          <button class="signout-btn" id="signOutBtnMobile">Sign out</button>
        `;
        navLinks.prepend(mobileChipDiv);
        document.getElementById('signOutBtnMobile').addEventListener('click', handleSignOut);
      }
    } else if (headerAuthActions) {
      headerAuthActions.innerHTML = `
        <button class="btn btn-ghost" id="openSignInBtn">Sign in</button>
        <button class="btn btn-primary" id="openSignUpBtn">Start free trial</button>
      `;
      document.getElementById('openSignInBtn').addEventListener('click', () => openModal('signin'));
      document.getElementById('openSignUpBtn').addEventListener('click', () => openModal('register'));
    }
  }

  function handleSignOut() {
    localStorage.removeItem(SESSION_KEY);
    location.reload();
  }

  // Sign in — checks the email exists AND the password matches it,
  // with distinct messages for each failure case.
  if (formSignIn) {
    formSignIn.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('signInEmail').value.trim().toLowerCase();
      const password = document.getElementById('signInPass').value;

      const users = getStoredUsers();
      const matchedUser = users.find(u => u.email === email);

      if (!matchedUser) {
        showToast(`No account found with email "${email}". Please create an account first.`, true);
        return;
      }

      if (matchedUser.password !== password) {
        showToast(`Incorrect password for ${email}. Please try again.`, true);
        return;
      }

      localStorage.setItem(SESSION_KEY, JSON.stringify({ name: matchedUser.name, email: matchedUser.email }));
      closeModal();
      checkUserSession();
      showToast(`Welcome back, ${matchedUser.name}! Connected to Deskhive Inbox.`);
    });
  }

  // Sign up — stores each account in a list, blocks duplicate emails.
  if (formRegister) {
    formRegister.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim().toLowerCase();
      const password = document.getElementById('regPass').value;

      const users = getStoredUsers();
      const existingUser = users.find(u => u.email === email);

      if (existingUser) {
        showToast(`An account with email "${email}" already exists. Please sign in instead.`, true);
        switchTab('signin');
        document.getElementById('signInEmail').value = email;
        return;
      }

      users.push({ name, email, password });
      saveUsers(users);

      localStorage.setItem(SESSION_KEY, JSON.stringify({ name, email }));
      closeModal();
      checkUserSession();
      showToast(`Account created successfully! Welcome, ${name}.`);
    });
  }

  checkUserSession();

  // Password show/hide toggle — eye icon docked inside each password field.
  const passToggleBtns = document.querySelectorAll('.pass-toggle-btn');
  passToggleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-target');
      const targetInput = document.getElementById(targetId);
      const icon = btn.querySelector('i');
      if (!targetInput || !icon) return;

      const isPassword = targetInput.getAttribute('type') === 'password';
      targetInput.setAttribute('type', isPassword ? 'text' : 'password');

      icon.classList.toggle('fa-eye', !isPassword);
      icon.classList.toggle('fa-eye-slash', isPassword);
      btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });
  });

  // 3. FLOATING CHIPS 3-WAY INTERACTIVITY (TOGGLE, SINGLE-CHANNEL ISOLATION)
  const floatingChips = document.querySelectorAll('.channel-chip');
  const inboxRows = document.querySelectorAll('.inbox-row');
  const ticketDetailPanel = document.getElementById('ticketDetailPanel');
  const closePanelBtn = document.getElementById('closePanelBtn');
  const panelTicketTitle = document.getElementById('panelTicketTitle');
  const panelMessage = document.getElementById('panelMessage');
  const replyInput = document.getElementById('replyInput');
  const sendReplyBtn = document.getElementById('sendReplyBtn');
  let currentActiveChannel = null;
  let currentActiveRow = null;

  const ticketData = {
    "1": { name: "Priya S.", channel: "Email", msg: "Refund status on order #4021 requested 3 days ago." },
    "2": { name: "Arjun M.", channel: "Live Chat", msg: "Can't log into my dashboard account. Invalid Token error." },
    "3": { name: "Fatima K.", channel: "Social DM", msg: "Question regarding Growth plan annual discount." },
    "4": { name: "Vikram R.", channel: "SMS", msg: "Is API integration included in Scale enterprise plan?" }
  };

  function resetInboxView() {
    currentActiveChannel = null;
    floatingChips.forEach(c => c.classList.remove('active'));
    inboxRows.forEach(row => {
      row.style.display = 'flex';
      row.classList.remove('highlighted');
    });
    if (ticketDetailPanel) ticketDetailPanel.classList.remove('active');
  }

  floatingChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      const channel = chip.getAttribute('data-channel');

      if (currentActiveChannel === channel) {
        resetInboxView();
        showToast(`Filter cleared — showing all inbox channels.`);
        return;
      }

      currentActiveChannel = channel;
      floatingChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      let matchedRow = null;
      inboxRows.forEach(row => {
        if (row.getAttribute('data-channel') === channel) {
          row.style.display = 'flex';
          row.classList.add('highlighted');
          matchedRow = row;
        } else {
          row.style.display = 'none';
        }
      });

      if (matchedRow) {
        const ticketId = matchedRow.getAttribute('data-id');
        currentActiveRow = matchedRow;
        const data = ticketData[ticketId];
        if (data && ticketDetailPanel) {
          panelTicketTitle.textContent = `${data.name} (${data.channel})`;
          panelMessage.textContent = `"${data.msg}"`;
          ticketDetailPanel.classList.add('active');
        }
      }

      showToast(`Showing ONLY ${channel.toUpperCase()} message for ${ticketData[matchedRow?.getAttribute('data-id')]?.name || ''}`);
    });
  });

  inboxRows.forEach(row => {
    row.addEventListener('click', (e) => {
      e.stopPropagation();
      const ticketId = row.getAttribute('data-id');
      currentActiveRow = row;
      inboxRows.forEach(r => r.classList.remove('highlighted'));
      row.classList.add('highlighted');

      const data = ticketData[ticketId];
      if (data && ticketDetailPanel) {
        panelTicketTitle.textContent = `${data.name} (${data.channel})`;
        panelMessage.textContent = `"${data.msg}"`;
        ticketDetailPanel.classList.add('active');
      }
    });
  });

  if (closePanelBtn && ticketDetailPanel) {
    closePanelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      ticketDetailPanel.classList.remove('active');
    });
  }

  if (sendReplyBtn && replyInput) {
    sendReplyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const reply = replyInput.value.trim();
      if (!reply) return;

      showToast(`Reply sent to customer! Ticket resolved.`);
      replyInput.value = '';
      if (ticketDetailPanel) ticketDetailPanel.classList.remove('active');

      if (currentActiveRow) {
        currentActiveRow.style.opacity = '0.4';
        currentActiveRow.querySelector('.inbox-time').textContent = '✓';
      }
    });
  }

  // 4. INTERACTIVE ROI CALCULATOR (with visible assumption note)
  const agentsSlider = document.getElementById('agentsSlider');
  const ticketsSlider = document.getElementById('ticketsSlider');
  const agentsVal = document.getElementById('agentsVal');
  const ticketsVal = document.getElementById('ticketsVal');
  const hoursSavedVal = document.getElementById('hoursSavedVal');
  const roiSavingsVal = document.getElementById('roiSavingsVal');
  const roiAssumptionNote = document.getElementById('roiAssumptionNote');
  const HOURLY_RATE_ASSUMPTION = 25;

  if (roiAssumptionNote) {
    roiAssumptionNote.textContent = `Estimate assumes a support agent's time is worth $${HOURLY_RATE_ASSUMPTION}/hour.`;
  }

  function updateRoiCalculator() {
    if (!agentsSlider || !ticketsSlider) return;
    const agents = parseInt(agentsSlider.value, 10);
    const tickets = parseInt(ticketsSlider.value, 10);

    if (agentsVal) agentsVal.textContent = `${agents} Agent${agents > 1 ? 's' : ''}`;
    if (ticketsVal) ticketsVal.textContent = `${tickets} Messages/day`;

    const hoursSaved = Math.round(agents * (tickets * 0.04) * 0.5);
    const monthlyROI = Math.round(hoursSaved * HOURLY_RATE_ASSUMPTION);

    if (hoursSavedVal) hoursSavedVal.textContent = `${hoursSaved} hrs/mo`;
    if (roiSavingsVal) roiSavingsVal.textContent = `$${monthlyROI.toLocaleString()} /mo`;
  }

  if (agentsSlider && ticketsSlider) {
    agentsSlider.addEventListener('input', updateRoiCalculator);
    ticketsSlider.addEventListener('input', updateRoiCalculator);
    updateRoiCalculator();
  }

  // 5. MONTHLY / YEARLY PRICING TOGGLE
  const billingToggle = document.getElementById('billingToggle');
  const priceStarter = document.getElementById('priceStarter');
  const priceGrowth = document.getElementById('priceGrowth');
  const subStarter = document.getElementById('subStarter');
  const subGrowth = document.getElementById('subGrowth');

  if (billingToggle) {
    billingToggle.addEventListener('change', () => {
      if (billingToggle.checked) {
        if (priceStarter) priceStarter.innerHTML = `$15<span class="period">/agent/mo</span>`;
        if (priceGrowth) priceGrowth.innerHTML = `$31<span class="period">/agent/mo</span>`;
        if (subStarter) subStarter.textContent = `Billed annually ($180/yr)`;
        if (subGrowth) subGrowth.textContent = `Billed annually ($372/yr)`;
        showToast(`20% Annual Discount Applied!`);
      } else {
        if (priceStarter) priceStarter.innerHTML = `$19<span class="period">/agent/mo</span>`;
        if (priceGrowth) priceGrowth.innerHTML = `$39<span class="period">/agent/mo</span>`;
        if (subStarter) subStarter.textContent = `Billed monthly`;
        if (subGrowth) subGrowth.textContent = `Billed monthly`;
      }
    });
  }

  // 6. FAQ ACCORDION
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    if (trigger) {
      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        faqItems.forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    }
  });

  // 7. HAMBURGER MENU
  const hamburger = document.getElementById('hamburger');

  if (hamburger && navLinks) {
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
      });
    });

    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      hamburger.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('open') &&
          !navLinks.contains(e.target) &&
          !hamburger.contains(e.target)) {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
      }
    });
  }

});