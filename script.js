/* Deskhive — Interactive SaaS Platform Script
   Handles Auth Modal (LocalStorage), Live Demo Simulator, ROI Calculator, Pricing Toggle, FAQ Accordion, and Toast Alerts. */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. TOAST NOTIFICATION SYSTEM
  // ==========================================
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

  // ==========================================
  // 2. AUTH MODAL & LOCALSTORAGE PERSISTENCE
  // ==========================================
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

  // Open Modal Helper
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

  // Close Modal Helper
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

  // Close modal when tapping overlay background
  if (authModalOverlay) {
    authModalOverlay.addEventListener('click', (e) => {
      if (e.target === authModalOverlay) closeModal();
    });
  }

  if (tabSignIn && tabRegister) {
    tabSignIn.addEventListener('click', () => switchTab('signin'));
    tabRegister.addEventListener('click', () => switchTab('register'));
  }

  // Check LocalStorage for logged in user
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

  // Handle Form Sign In Submit
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

  // Handle Form Register Submit
  if (formRegister) {
    formRegister.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('regName').value;
      const email = document.getElementById('regEmail').value;
      const user = { name: name, email: email };
      localStorage.setItem('deskhive_user', JSON.stringify(user));
      closeModal();
      checkUserSession();
      showToast(`Account created successfully! Welcome to Deskhive, ${name}.`);
    });
  }

  checkUserSession();

  // ==========================================
  // 3. INTERACTIVE HERO DEMO SIMULATOR
  // ==========================================
  const filterChips = document.querySelectorAll('.filter-chips .chip');
  const inboxRows = document.querySelectorAll('.inbox-row');
  const ticketDetailPanel = document.getElementById('ticketDetailPanel');
  const closePanelBtn = document.getElementById('closePanelBtn');
  const panelTicketTitle = document.getElementById('panelTicketTitle');
  const panelMessage = document.getElementById('panelMessage');
  const replyInput = document.getElementById('replyInput');
  const sendReplyBtn = document.getElementById('sendReplyBtn');
  let currentActiveRow = null;

  const ticketData = {
    "1": { name: "Priya Sharma", channel: "Email", msg: "Hi team, I requested a refund on order #4021 three days ago. Could you please update me on the status?" },
    "2": { name: "Arjun Mehta", channel: "Live Chat", msg: "I'm getting an 'Invalid Auth Token' error every time I try logging into the dashboard. Help!" },
    "3": { name: "Fatima Khan", channel: "Social DM", msg: "Hey there! We are a team of 15 support reps. Is there an annual discount available for the Growth plan?" },
    "4": { name: "Vikram Roy", channel: "SMS", msg: "Is custom Webhook and API integration included in the Scale enterprise tier?" }
  };

  // Filter Channel Chips
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const channel = chip.getAttribute('data-channel');

      inboxRows.forEach(row => {
        if (channel === 'all' || row.getAttribute('data-channel') === channel) {
          row.style.display = 'flex';
        } else {
          row.style.display = 'none';
        }
      });
    });
  });

  // Open Ticket Detail
  inboxRows.forEach(row => {
    row.addEventListener('click', () => {
      const ticketId = row.getAttribute('data-id');
      currentActiveRow = row;
      const data = ticketData[ticketId];
      if (data && ticketDetailPanel) {
        panelTicketTitle.textContent = `${data.name} (${data.channel})`;
        panelMessage.textContent = `"${data.msg}"`;
        ticketDetailPanel.classList.add('active');
      }
    });
  });

  if (closePanelBtn && ticketDetailPanel) {
    closePanelBtn.addEventListener('click', () => {
      ticketDetailPanel.classList.remove('active');
    });
  }

  // Send Reply Button
  if (sendReplyBtn && replyInput) {
    sendReplyBtn.addEventListener('click', () => {
      const reply = replyInput.value.trim();
      if (!reply) return;
      
      showToast(`Reply sent successfully to customer! Ticket marked as resolved.`);
      replyInput.value = '';
      if (ticketDetailPanel) ticketDetailPanel.classList.remove('active');

      if (currentActiveRow) {
        currentActiveRow.style.opacity = '0.4';
        currentActiveRow.querySelector('.inbox-time').textContent = '✓ Resolved';
      }
    });
  }

  // ==========================================
  // 4. INTERACTIVE ROI CALCULATOR
  // ==========================================
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

    // Calculation logic
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

  // ==========================================
  // 5. MONTHLY / YEARLY PRICING TOGGLE
  // ==========================================
  const billingToggle = document.getElementById('billingToggle');
  const priceStarter = document.getElementById('priceStarter');
  const priceGrowth = document.getElementById('priceGrowth');
  const subStarter = document.getElementById('subStarter');
  const subGrowth = document.getElementById('subGrowth');

  if (billingToggle) {
    billingToggle.addEventListener('change', () => {
      if (billingToggle.checked) {
        // Yearly Prices
        if (priceStarter) priceStarter.innerHTML = `$15<span class="period">/agent/mo</span>`;
        if (priceGrowth) priceGrowth.innerHTML = `$31<span class="period">/agent/mo</span>`;
        if (subStarter) subStarter.textContent = `Billed annually ($180/yr)`;
        if (subGrowth) subGrowth.textContent = `Billed annually ($372/yr)`;
        showToast(`20% Annual Discount Applied to all plans!`);
      } else {
        // Monthly Prices
        if (priceStarter) priceStarter.innerHTML = `$19<span class="period">/agent/mo</span>`;
        if (priceGrowth) priceGrowth.innerHTML = `$39<span class="period">/agent/mo</span>`;
        if (subStarter) subStarter.textContent = `Billed monthly`;
        if (subGrowth) subGrowth.textContent = `Billed monthly`;
      }
    });
  }

  // ==========================================
  // 6. FAQ ACCORDION
  // ==========================================
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

  // ==========================================
  // 7. HAMBURGER MENU & BACK TO TOP
  // ==========================================
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      hamburger.classList.toggle('open');
    });

    // Close menu when tapping outside
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('open') &&
          !navLinks.contains(e.target) &&
          !hamburger.contains(e.target)) {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
      }
    });
  }

  const backToTopBtn = document.getElementById('backToTop');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    });
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

});
