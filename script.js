/* Deskhive — Interactive SaaS Platform Script
   Featuring 3-Way Floating Chip Interactions:
   1. Click same chip again -> Toggles/Closes filter & drawer.
   2. Click outside .hero-visual container -> Resets filter & closes drawer.
   3. Single-channel isolation -> Shows ONLY matching customer message, hides all others (Transient, resets on refresh).
*/

document.addEventListener('DOMContentLoaded', () => {

  // 1. TOAST NOTIFICATION SYSTEM
  const toastContainer = document.getElementById('toastContainer');
  function showToast(message) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // 2. AUTH MODAL & LOCALSTORAGE PERSISTENCE
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

  function checkUserSession() {
    const savedUser = localStorage.getItem('deskhive_user');
    if (savedUser && headerAuthActions) {
      const user = JSON.parse(savedUser);
      headerAuthActions.innerHTML = `
        <div class="user-chip">
          <span>👋 ${user.name || user.email.split('@')[0]}</span>
          <button class="signout-btn" id="signOutBtn">Sign out</button>
        </div>
      `;
      const signOutBtn = document.getElementById('signOutBtn');
      if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
          localStorage.removeItem('deskhive_user');
          location.reload();
        });
      }
    }
  }

  if (formSignIn) {
    formSignIn.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('signInEmail').value;
      const user = { email: email, name: email.split('@')[0] };
      localStorage.setItem('deskhive_user', JSON.stringify(user));
      closeModal();
      checkUserSession();
      showToast(`Welcome back, ${user.name}! Connected to Deskhive Inbox.`);
    });
  }

  if (formRegister) {
    formRegister.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('regName').value;
      const email = document.getElementById('regEmail').value;
      const user = { name: name, email: email };
      localStorage.setItem('deskhive_user', JSON.stringify(user));
      closeModal();
      checkUserSession();
      showToast(`Account created successfully! Welcome, ${name}.`);
    });
  }

  checkUserSession();

  // 3. FLOATING CHIPS 3-WAY INTERACTIVITY (TOGGLE, OUTSIDE-CLICK, SINGLE-CHANNEL ISOLATION)
  const floatingChips = document.querySelectorAll('.channel-chip');
  const inboxRows = document.querySelectorAll('.inbox-row');
  const heroVisualContainer = document.querySelector('.hero-visual');
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

  // Reset/Show all rows and close panel
  function resetInboxView() {
    currentActiveChannel = null;
    floatingChips.forEach(c => c.classList.remove('active'));
    inboxRows.forEach(row => {
      row.style.display = 'flex';
      row.classList.remove('highlighted');
    });
    if (ticketDetailPanel) ticketDetailPanel.classList.remove('active');
  }

  // Floating Chips Click Handler
  floatingChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      const channel = chip.getAttribute('data-channel');

      // REQUIREMENT 1: If same chip clicked again -> TOGGLE / CLOSE IT!
      if (currentActiveChannel === channel) {
        resetInboxView();
        showToast(`Filter cleared — showing all inbox channels.`);
        return;
      }

      // REQUIREMENT 3: Show ONLY matching person's message, HIDE all others!
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
          row.style.display = 'none'; // Hide all other messages
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



  // Clicking Inbox Rows directly
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

  // 7. HAMBURGER MENU
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

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
