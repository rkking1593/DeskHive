/* Deskhive — Interactive SaaS Platform Script
   Upgraded with Real Multi-User Auth, Password Validation, Mobile Session Avatar & ROI Transparency
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

  // 2. AUTH MODAL & REAL MULTI-USER LOCALSTORAGE AUTH WITH PASSWORD VALIDATION
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

  function openModal(mode = 'signin') {
    if (!authModalOverlay) return;
    authModalOverlay.classList.add('open');
    authModalOverlay.setAttribute('aria-hidden', 'false');
    if (mode === 'register') {
      switchTab('register');
    } else {
      switchTab('signin');
    }
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

  // Get stored users array
  function getStoredUsers() {
    const raw = localStorage.getItem('deskhive_users');
    return raw ? JSON.parse(raw) : [];
  }

  // Save users array
  function saveUsers(users) {
    localStorage.setItem('deskhive_users', JSON.stringify(users));
  }

  // FIX #2: Check & Render User Session on BOTH Desktop Header AND Mobile Drawer!
  function checkUserSession() {
    const activeUserRaw = localStorage.getItem('deskhive_active_user');
    
    // Remove existing mobile user chip if present
    const existingMobileChip = document.getElementById('mobileUserChip');
    if (existingMobileChip) existingMobileChip.remove();

    if (activeUserRaw) {
      const activeUser = JSON.parse(activeUserRaw);
      const userName = activeUser.name || activeUser.email.split('@')[0];

      // Desktop Header Chip
      if (headerAuthActions) {
        headerAuthActions.innerHTML = `
          <div class="user-chip">
            <span>👋 ${userName}</span>
            <button class="signout-btn" id="signOutBtnDesktop">Sign out</button>
          </div>
        `;
      }

      // Mobile Drawer Chip (Inserted at top of navLinks menu)
      if (navLinks) {
        const mobileChipDiv = document.createElement('div');
        mobileChipDiv.className = 'mobile-user-chip';
        mobileChipDiv.id = 'mobileUserChip';
        mobileChipDiv.innerHTML = `
          <span>👋 ${userName}</span>
          <button class="signout-btn" id="signOutBtnMobile">Sign out</button>
        `;
        navLinks.prepend(mobileChipDiv);
      }

      // Sign out handlers
      const handleSignOut = () => {
        localStorage.removeItem('deskhive_active_user');
        location.reload();
      };

      const btnDesktop = document.getElementById('signOutBtnDesktop');
      const btnMobile = document.getElementById('signOutBtnMobile');
      if (btnDesktop) btnDesktop.addEventListener('click', handleSignOut);
      if (btnMobile) btnMobile.addEventListener('click', handleSignOut);

    } else {
      // Reset Desktop Header
      if (headerAuthActions) {
        headerAuthActions.innerHTML = `
          <button class="btn btn-ghost" id="openSignInBtn">Sign in</button>
          <button class="btn btn-primary" id="openSignUpBtn">Start free trial</button>
        `;
        document.getElementById('openSignInBtn').addEventListener('click', () => openModal('signin'));
        document.getElementById('openSignUpBtn').addEventListener('click', () => openModal('register'));
      }
    }
  }

  // FIX #1: Sign In with Email & Password Verification
  if (formSignIn) {
    formSignIn.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('signInEmail').value.trim().toLowerCase();
      const passInput = document.getElementById('signInPass').value;

      const users = getStoredUsers();
      const matchedUser = users.find(u => u.email === emailInput);

      if (!matchedUser) {
        showToast(`No account found with email "${emailInput}". Please create an account first.`, true);
        return;
      }

      if (matchedUser.password !== passInput) {
        showToast(`Incorrect password for ${emailInput}. Please try again.`, true);
        return;
      }

      // Successful login
      localStorage.setItem('deskhive_active_user', JSON.stringify(matchedUser));
      closeModal();
      checkUserSession();
      showToast(`Welcome back, ${matchedUser.name}! Connected to Deskhive Inbox.`);
    });
  }

  // FIX #1: Create Account with Multi-User Storage & Duplicate Check
  if (formRegister) {
    formRegister.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim().toLowerCase();
      const password = document.getElementById('regPass').value;

      const users = getStoredUsers();

      // Check if user already exists
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        showToast(`An account with email "${email}" already exists. Please Sign In.`, true);
        switchTab('signin');
        document.getElementById('signInEmail').value = email;
        return;
      }

      // Add new user to notebook array
      const newUser = { name: name, email: email, password: password };
      users.push(newUser);
      saveUsers(users);

      // Set active session
      localStorage.setItem('deskhive_active_user', JSON.stringify(newUser));
      closeModal();
      checkUserSession();
      showToast(`Account created successfully! Welcome, ${name}.`);
    });
  }

  checkUserSession();

  // 3. FLOATING CHIPS 3-WAY INTERACTIVITY
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

  // 4. INTERACTIVE ROI CALCULATOR
  const agentsSlider = document.getElementById('agentsSlider');
  const ticketsSlider = document.getElementById('ticketsSlider');
  const agentsVal = document.getElementById('agentsVal');
  const ticketsVal = document.getElementById('ticketsVal');
  const hoursSavedVal = document.getElementById('hoursSavedVal');
  const roiSavingsVal = document.getElementById('roiSavingsVal');

  function updateRoiCalculator() {
    if (!agentsSlider || !ticketsSlider) return;
    const agents = parseInt(agentsSlider.value, 10);
    const tickets = parseInt(ticketsSlider.value, 10);

    if (agentsVal) agentsVal.textContent = `${agents} Agent${agents > 1 ? 's' : ''}`;
    if (ticketsVal) ticketsVal.textContent = `${tickets} Messages/day`;

    const hoursSaved = Math.round(agents * (tickets * 0.04) * 0.5);
    const monthlyROI = Math.round(hoursSaved * 25);

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

  // 7. HAMBURGER MENU WITH AUTO CLOSE
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
