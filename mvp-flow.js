(() => {
  const LOGIN_PAGE = "1-Gestão Projetos - Boas-vindas.html";
  const SESSION_KEY = "poc_mvp_session";
  const USERS = {
    "gestorgeral@projetar.com": {
      password: "123",
      role: "admin",
      name: "Gestor Geral",
    },
    "sesar@projetar.com": {
      password: "123",
      role: "recursos",
      name: "Sesar",
    },
  };

  const SUITES = {
    admin: {
      dashboard: "4-Gestão Projetos - Dashboard Es.html",
      portfolio: "5-Gestão Projetos - Portfólio de.html",
      details: "6-Gestão Projetos - Detalhes do.html",
      execution: "8-Gestão Projetos - Execução (Ti.html",
      alerts: "9-Gestão Projetos - Central de A.html",
    },
    recursos: {
      dashboard: "10-Recursos Hídricos - Dashboard.html",
      portfolio: "11-Recursos Hídricos - Portfólio.html",
      details: "12-Recursos Hídricos - Detalhes.html",
      dependencies: "13-Recursos Hídricos - Dependências.html",
      execution: "14-Recursos Hídricos - Execução.html",
      alerts: "15-Recursos Hídricos - Alertas.html",
    },
  };

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setSession(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function goTo(fileName) {
    window.location.href = fileName;
  }

  function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getSuite(role) {
    return SUITES[role];
  }

  function redirectToRoleHome(role) {
    const suite = getSuite(role);
    goTo(suite ? suite.dashboard : LOGIN_PAGE);
  }

  function attachLogout() {
    document.querySelectorAll("button, a").forEach((element) => {
      if (element.dataset.logoutBound === "true") return;
      const hasLogoutIcon = element.querySelector(".fa-arrow-right-from-bracket");
      const text = (element.textContent || "").trim();
      const isLogoutText = text === "Sair" || text === "Logout";
      if (!hasLogoutIcon && !isLogoutText) return;

      element.dataset.logoutBound = "true";
      element.addEventListener("click", (event) => {
        event.preventDefault();
        clearSession();
        goTo(LOGIN_PAGE);
      });
    });
  }

  function wireSidebar(role) {
    const suite = getSuite(role);
    if (!suite) return;

    document.querySelectorAll(".sidebar-item").forEach((item) => {
      const text = (item.textContent || "").trim();
      const title = (item.getAttribute("title") || "").trim();
      const isDependencies = text === "Dependências" || title === "Dependências";
      if (role === "admin" && isDependencies) {
        item.closest("li")?.remove();
      }
    });

    const routes =
      role === "admin"
        ? [suite.dashboard, suite.portfolio, suite.execution, suite.alerts]
        : [
            suite.dashboard,
            suite.portfolio,
            suite.dependencies,
            suite.execution,
            suite.alerts,
          ];

    document.querySelectorAll(".sidebar-item").forEach((item, index) => {
      if (index < routes.length && item.tagName === "A") {
        item.setAttribute("href", routes[index]);
      }
    });
  }

  function wireCommonLinks(role) {
    const suite = getSuite(role);
    if (!suite) return;

    const viewAllLink = document.querySelector("a.text-sm.font-medium.text-blue-brand");
    if (viewAllLink) {
      viewAllLink.setAttribute("href", suite.portfolio);
    }

    document.querySelectorAll("button").forEach((button) => {
      const text = (button.textContent || "").trim();
      if (text === "Detalhes") {
        button.addEventListener("click", () => goTo(suite.details));
      }
    });

    document.querySelectorAll("p, h3, h4").forEach((element) => {
      const text = (element.textContent || "").trim();
      if (!text) return;
      const matchProject =
        text.includes("Novo Hospital Municipal") ||
        text.includes("Canalização do Córrego do Norte") ||
        text.includes("Ampliação da Barragem Serra Azul") ||
        text.includes("Rede de Sensores do Rio Claro");
      if (!matchProject) return;

      element.style.cursor = "pointer";
      element.addEventListener("click", () => goTo(suite.details));
    });
  }

  function protectSuite(role) {
    const session = getSession();
    if (!session) {
      goTo(LOGIN_PAGE);
      return null;
    }
    if (session.role !== role) {
      redirectToRoleHome(session.role);
      return null;
    }
    if (
      role === "admin" &&
      window.location.pathname.includes("7-Gest") &&
      window.location.pathname.includes("Depend")
    ) {
      redirectToRoleHome(role);
      return null;
    }
    wireSidebar(role);
    wireCommonLinks(role);
    attachLogout();
    return session;
  }

  function setupLoginPage() {
    const existing = getSession();
    if (existing) {
      redirectToRoleHome(existing.role);
      return;
    }

    const form = document.getElementById("auth-form");
    const emailInput = document.getElementById("document");
    const passwordInput = document.getElementById("password");
    const errorBox = document.getElementById("login-error");
    const helpLinks = document.querySelectorAll('a[href="#"]');

    helpLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
      });
    });

    const submit = (event) => {
      event.preventDefault();
      const email = normalizeEmail(emailInput?.value);
      const password = String(passwordInput?.value || "").trim();
      const user = USERS[email];

      if (!user || user.password !== password) {
        if (errorBox) {
          errorBox.textContent =
            "Credenciais inválidas. Use gestorgeral@projetar.com ou sesar@projetar.com com a senha 123.";
          errorBox.classList.remove("hidden");
        }
        return;
      }

      setSession({
        email,
        role: user.role,
        name: user.name,
      });

      redirectToRoleHome(user.role);
    };

    if (form) {
      form.addEventListener("submit", submit);
    }

    const submitButton = document.getElementById("login-submit");
    if (submitButton) {
      submitButton.addEventListener("click", submit);
    }
  }

  function setupSelectionPage() {
    const session = getSession();
    if (!session) {
      goTo(LOGIN_PAGE);
      return;
    }

    const radios = document.querySelectorAll('input[name="context_selection"]');
    const primaryButton = document.getElementById("selection-enter");
    const logoutButton = document.getElementById("selection-logout");

    if (logoutButton) {
      logoutButton.addEventListener("click", (event) => {
        event.preventDefault();
        clearSession();
        goTo(LOGIN_PAGE);
      });
    }

    if (primaryButton) {
      primaryButton.addEventListener("click", () => {
        let role = session.role;
        const selectedIndex = [...radios].findIndex((radio) => radio.checked);
        if (selectedIndex === 0) role = "admin";
        if (selectedIndex === 1 || selectedIndex === 2) role = "recursos";
        redirectToRoleHome(role);
      });
    }
  }

  const config = window.__MVP_FLOW__;
  if (!config) return;

  if (config.type === "login") {
    setupLoginPage();
    return;
  }

  if (config.type === "selection") {
    setupSelectionPage();
    return;
  }

  if (config.type === "suite" && config.role) {
    protectSuite(config.role);
  }
})();
