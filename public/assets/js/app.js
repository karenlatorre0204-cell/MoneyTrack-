/**
 * MONEYTRACK · Main Application Controller
 * Navegación modular por tabs, renderizado dinámico, validación de formularios,
 * modales 3D, atajos de teclado, búsqueda global y gestión completa de:
 * - Ingresos y Gastos
 * - Módulo "Me Deben / Debo" (Préstamos y Abonos)
 * - Calendario Financiero Interactivo
 * - Simulador "¿Puedo Permitírmelo?"
 * - Score de Salud Financiera
 * - Gestor de Categorías Personalizadas
 * - Gamificación (Medallas y Reto de 30 Días)
 * - Grupo Familiar Personalizable
 */

const App = {
  currentView: 'dashboard',
  currentPage: 1,
  pageSize: 8,
  sortField: 'date',
  sortAsc: false,
  deleteTarget: null,

  // Estados de vista
  loanFilter: 'all',
  calendarDate: new Date(),
  selectedLoanType: 'me_deben',

  init() {
    this.checkSession();
    this.bindNavigation();
    this.bindModals();
    this.bindKeyboardShortcuts();
    this.renderCurrentView();
    this.initPWA();
  },

  // 1. Control de Sesión y Auth
  checkSession() {
    const session = Storage.getSession();
    const authWrapper = document.getElementById('auth-wrapper');
    const appShell = document.getElementById('app-shell');

    if (!session || !session.user || session.expired) {
      if (session && session.expired) {
        this.showToast(
          session.reason === 'inactivity'
            ? 'Sesión cerrada por inactividad (30 min).'
            : 'Sesión expirada por límite de tiempo.',
          'warning'
        );
      }
      if (authWrapper) authWrapper.style.display = 'grid';
      if (appShell) appShell.style.display = 'none';
      return false;
    }

    if (authWrapper) authWrapper.style.display = 'none';
    if (appShell) appShell.style.display = 'flex';

    // Actualizar nombre en la cabecera
    const userNameEl = document.getElementById('header-user-name');
    if (userNameEl) userNameEl.textContent = session.user.name;

    return true;
  },

  toggleAuthTab(tab) {
    const loginForm = document.getElementById('form-login');
    const registerForm = document.getElementById('form-register');
    const tabLogin = document.getElementById('auth-tab-login');
    const tabRegister = document.getElementById('auth-tab-register');

    if (tab === 'login') {
      if (loginForm) loginForm.style.display = 'block';
      if (registerForm) registerForm.style.display = 'none';
      if (tabLogin) tabLogin.className = 'btn-3d btn-3d--sm';
      if (tabRegister) tabRegister.className = 'btn-3d btn-3d--secondary btn-3d--sm';
    } else {
      if (loginForm) loginForm.style.display = 'none';
      if (registerForm) registerForm.style.display = 'block';
      if (tabLogin) tabLogin.className = 'btn-3d btn-3d--secondary btn-3d--sm';
      if (tabRegister) tabRegister.className = 'btn-3d btn-3d--sm';
    }
  },

  // 2. Navegación por Módulos
  bindNavigation() {
    const navLinks = document.querySelectorAll('[data-nav-target]');
    navLinks.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const target = link.getAttribute('data-nav-target');
        this.navigateTo(target);
      });
    });

    // Botón de alternar colapso de sidebar (Pin)
    const pinToggle = document.getElementById('sidebar-pin-toggle');
    if (pinToggle) {
      pinToggle.addEventListener('click', () => {
        const sidebar = document.getElementById('app-sidebar');
        if (sidebar) {
          const isCollapsed = sidebar.classList.toggle('is-collapsed');
          const prefs = ThemeEngine.getPreferences();
          prefs.sidebarPinned = !isCollapsed;
          ThemeEngine.savePreferences(prefs);
        }
      });
    }

    // Botón menú móvil
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', () => {
        const sidebar = document.getElementById('app-sidebar');
        if (sidebar) sidebar.classList.toggle('is-mobile-open');
      });
    }

    // Botón Drawer de Control Panel (Estilos & Accesibilidad)
    const cpToggle = document.getElementById('control-panel-toggle');
    const cpClose = document.getElementById('control-panel-close');
    const cpDrawer = document.getElementById('control-panel-drawer');

    if (cpToggle && cpDrawer) {
      cpToggle.addEventListener('click', () => cpDrawer.classList.toggle('is-open'));
    }
    if (cpClose && cpDrawer) {
      cpClose.addEventListener('click', () => cpDrawer.classList.remove('is-open'));
    }
  },

  navigateTo(viewName) {
    if (!this.checkSession()) return;

    this.currentView = viewName;
    this.currentPage = 1;

    // Actualizar enlaces activos
    document.querySelectorAll('[data-nav-target]').forEach(el => {
      el.classList.toggle('is-active', el.getAttribute('data-nav-target') === viewName);
    });

    // Alternar vistas
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.style.display = sec.id === `view-${viewName}` ? 'block' : 'none';
    });

    // Cerrar sidebar en móvil si está abierto
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.classList.remove('is-mobile-open');

    this.renderCurrentView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // 3. Atajos Rápidos de Teclado
  bindKeyboardShortcuts() {
    window.addEventListener('keydown', e => {
      // Ignorar si el foco está en un input o textarea
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      // Cerrar modales con Escape
      if (e.key === 'Escape') {
        this.closeAllModals();
        const cpDrawer = document.getElementById('control-panel-drawer');
        if (cpDrawer) cpDrawer.classList.remove('is-open');
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.openQuickSearchModal();
        return;
      }

      if (isInput) return;

      // Ctrl + I: Nuevo Ingreso
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        this.openAddTransactionModal('ingreso');
      }

      // Ctrl + G: Nuevo Gasto
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        this.openAddTransactionModal('gasto');
      }

      // Ctrl + P: Simulador
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        this.navigateTo('simulator');
      }
    });
  },

  // 4. Renderizador de Vistas
  renderCurrentView() {
    switch (this.currentView) {
      case 'dashboard':
        this.renderDashboardView();
        break;
      case 'incomes':
        this.renderTransactionsView('ingreso');
        break;
      case 'expenses':
        this.renderTransactionsView('gasto');
        break;
      case 'budgets':
        this.renderBudgetsView();
        break;
      case 'loans':
        this.renderLoansView();
        break;
      case 'calendar':
        this.renderCalendarView();
        break;
      case 'savings':
        this.renderSavingsView();
        break;
      case 'simulator':
        this.renderSimulatorView();
        break;
      case 'achievements':
        this.renderAchievementsView();
        break;
      case 'reports':
        this.renderReportsView();
        break;
      case 'family':
        this.renderFamilyView();
        break;
      case 'profile':
        this.renderProfileView();
        break;
    }
  },

  // =========================================================================
  // VISTA: DASHBOARD
  // =========================================================================
  renderDashboardView() {
    const kpis = Storage.getDashboardKPIs();
    const health = Storage.calculateFinancialHealthScore();
    const loansSummary = Storage.getLoansSummary();

    // Actualizar KPI Cards
    const balEl = document.getElementById('dash-balance');
    const incEl = document.getElementById('dash-incomes');
    const expEl = document.getElementById('dash-expenses');
    const bdgEl = document.getElementById('dash-budget-pct');

    if (balEl) balEl.textContent = Storage.formatCOP(kpis.balance);
    if (incEl) incEl.textContent = Storage.formatCOP(kpis.totalIncomes);
    if (expEl) expEl.textContent = Storage.formatCOP(kpis.totalExpenses);
    if (bdgEl) bdgEl.textContent = `${kpis.budgetCompliance}%`;

    // Widget Salud Financiera
    const healthScoreEl = document.getElementById('dash-health-score');
    const healthBadgeEl = document.getElementById('dash-health-badge');
    const healthCircleEl = document.getElementById('dash-health-circle');
    const healthSummaryEl = document.getElementById('dash-health-summary');

    if (healthScoreEl) healthScoreEl.textContent = health.score;
    if (healthBadgeEl) {
      healthBadgeEl.textContent = health.tierLabel;
      healthBadgeEl.style.color = health.tierColor;
    }
    if (healthCircleEl) {
      healthCircleEl.style.borderColor = health.tierColor;
      healthCircleEl.style.boxShadow = `0 0 25px -4px ${health.tierColor}`;
    }
    if (healthSummaryEl && health.tips.length > 0) {
      healthSummaryEl.textContent = health.tips[0];
    }

    // Mini Widget Préstamos
    const meDebenQuick = document.getElementById('dash-me-deben-quick');
    const deboQuick = document.getElementById('dash-debo-quick');
    if (meDebenQuick) meDebenQuick.textContent = Storage.formatCOP(loansSummary.pendingMeDeben);
    if (deboQuick) deboQuick.textContent = Storage.formatCOP(loansSummary.pendingDebo);

    // Tabla de Movimientos Recientes
    const tbody = document.getElementById('dash-recent-tbody');
    if (tbody) {
      if (!kpis.recentTransactions.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:24px; color:var(--muted);">Aún no hay transacciones registradas. ¡Comienza haciendo clic en "+ Nuevo Ingreso"!</td></tr>`;
      } else {
        tbody.innerHTML = kpis.recentTransactions.map(t => {
          const cat = Storage.getCategoryById(t.categoryId);
          const isInc = t.type === 'ingreso';
          return `
            <tr>
              <td style="font-family:var(--font-mono); font-size:0.8rem;">${t.date}</td>
              <td><strong>${this.escapeHtml(t.description)}</strong></td>
              <td><span class="badge-3d" style="background:${cat.color}22; color:${cat.color}; border:1px solid ${cat.color}44;">${this.escapeHtml(cat.name)}</span></td>
              <td style="font-weight:700; color:${isInc ? 'var(--success)' : 'var(--danger)'};">
                ${isInc ? '+' : '-'} ${Storage.formatCOP(t.amount)}
              </td>
              <td><span class="badge-3d ${isInc ? 'badge-3d--success' : 'badge-3d--danger'}">${t.type.toUpperCase()}</span></td>
            </tr>
          `;
        }).join('');
      }
    }

    // Gráficas Chart.js
    setTimeout(() => {
      Charts.renderDashboardComparison('chart-dash-comparison');
      Charts.renderCategoryDoughnut('chart-dash-category');
    }, 50);
  },

  // =========================================================================
  // VISTA: INGRESOS & GASTOS
  // =========================================================================
  renderTransactionsView(type) {
    const isInc = type === 'ingreso';
    const searchInput = document.getElementById(`${type}-search-input`);
    const catFilter = document.getElementById(`${type}-category-filter`);
    const tbody = document.getElementById(`${type}-tbody`);
    const pagination = document.getElementById(`${type}-pagination`);

    // Poblar selector de categorías si está vacío
    if (catFilter && catFilter.options.length <= 1) {
      const cats = Storage.getCategories(type);
      cats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        catFilter.appendChild(opt);
      });
    }

    const filter = {
      type: type,
      search: searchInput ? searchInput.value : '',
      categoryId: catFilter ? catFilter.value : ''
    };

    const allTxs = Storage.getTransactions(filter);

    // Paginación
    const totalPages = Math.ceil(allTxs.length / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const pageTxs = allTxs.slice(startIndex, startIndex + this.pageSize);

    if (tbody) {
      if (!pageTxs.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:32px; color:var(--muted);">No se encontraron ${isInc ? 'ingresos' : 'gastos'} con los filtros aplicados.</td></tr>`;
      } else {
        tbody.innerHTML = pageTxs.map(t => {
          const cat = Storage.getCategoryById(t.categoryId);
          return `
            <tr>
              <td style="font-family:var(--font-mono); font-size:0.82rem;">${t.date}</td>
              <td><strong>${this.escapeHtml(t.description)}</strong></td>
              <td><span class="badge-3d" style="background:${cat.color}22; color:${cat.color}; border:1px solid ${cat.color}44;">${this.escapeHtml(cat.name)}</span></td>
              <td style="font-weight:700; color:${isInc ? 'var(--success)' : 'var(--danger)'};">
                ${isInc ? '+' : '-'} ${Storage.formatCOP(t.amount)}
              </td>
              <td style="text-align:right;">
                <div style="display:inline-flex; gap:6px;">
                  <button class="btn-3d btn-3d--secondary btn-3d--sm" onclick="App.openEditTransactionModal('${t.id}')">Editar</button>
                  <button class="btn-3d btn-3d--danger btn-3d--sm" onclick="App.confirmDeleteTransaction('${t.id}')">Eliminar</button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // Renderizar paginador
    if (pagination) {
      pagination.innerHTML = this.renderPaginationControls(this.currentPage, totalPages, type);
    }
  },

  renderPaginationControls(current, total, type) {
    if (total <= 1) return '';
    return `
      <div style="display:flex; justify-content:center; align-items:center; gap:8px; margin-top:16px;">
        <button class="btn-3d btn-3d--secondary btn-3d--sm" ${current === 1 ? 'disabled' : ''} onclick="App.changePage(${current - 1}, '${type}')">◀ Ant</button>
        <span style="font-size:0.85rem; font-family:var(--font-mono); color:var(--muted);">Página ${current} de ${total}</span>
        <button class="btn-3d btn-3d--secondary btn-3d--sm" ${current === total ? 'disabled' : ''} onclick="App.changePage(${current + 1}, '${type}')">Sig ▶</button>
      </div>
    `;
  },

  changePage(newPage, type) {
    this.currentPage = newPage;
    this.renderTransactionsView(type);
  },

  // =========================================================================
  // VISTA: PRESUPUESTOS Y GESTOR DE CATEGORÍAS
  // =========================================================================
  renderBudgetsView() {
    const container = document.getElementById('budgets-cards-container');
    const catContainer = document.getElementById('categories-manager-container');
    const budgets = Storage.getBudgets();
    const categories = Storage.getCategories();

    // 1. Tarjetas de Presupuestos
    if (container) {
      if (!budgets.length) {
        container.innerHTML = `
          <div class="card-3d" style="grid-column:1/-1; text-align:center; padding:36px; color:var(--muted);">
            <svg width="40" height="40" style="color:var(--warning); margin-bottom:12px;"><use href="#i-budget"/></svg>
            <h3 style="margin:0 0 6px; color:var(--fg);">No tienes presupuestos activos para este mes</h3>
            <p style="margin:0 0 16px; font-size:0.85rem;">Fija límites mensuales en tus categorías de gasto para evitar desbordes y mejorar tu Score de Salud.</p>
            <button class="btn-3d" onclick="App.openAddBudgetModal()">+ Configurar Primer Presupuesto</button>
          </div>
        `;
      } else {
        container.innerHTML = budgets.map(b => {
          const pct = Math.min(100, b.percentage);
          const barColor = b.isOverbudget ? 'var(--danger)' : b.percentage >= 85 ? 'var(--warning)' : 'var(--accent)';
          return `
            <div class="card-3d">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                <div>
                  <span class="badge-3d" style="background:${b.categoryColor}22; color:${b.categoryColor}; border:1px solid ${b.categoryColor}44; font-size:0.75rem;">${this.escapeHtml(b.categoryName)}</span>
                  <h3 style="margin:6px 0 0; font-family:var(--font-head); font-size:1.3rem;">${Storage.formatCOP(b.limitAmount)}</h3>
                </div>
                <span class="badge-3d ${b.isOverbudget ? 'badge-3d--danger' : 'badge-3d--accent'}">${b.percentage}%</span>
              </div>

              <!-- Barra de progreso 3D -->
              <div style="height:12px; background:var(--surface-2); border-radius:999px; overflow:hidden; border:1px solid var(--border); margin-bottom:12px;">
                <div style="width:${pct}%; height:100%; background:${barColor}; border-radius:999px; transition:width 0.4s var(--ease);"></div>
              </div>

              <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--muted); margin-bottom:14px;">
                <span>Gastado: <strong style="color:var(--fg);">${Storage.formatCOP(b.spentAmount)}</strong></span>
                <span>${b.isOverbudget ? 'Excedido por:' : 'Disponible:'} <strong style="color:${b.isOverbudget ? 'var(--danger)' : 'var(--success)'};">${Storage.formatCOP(Math.abs(b.remainingAmount))}</strong></span>
              </div>

              <div style="display:flex; justify-content:flex-end; gap:8px;">
                <button class="btn-3d btn-3d--secondary btn-3d--sm" onclick="App.openAddBudgetModal('${b.categoryId}', ${b.limitAmount})">Ajustar Límite</button>
                <button class="btn-3d btn-3d--danger btn-3d--sm" onclick="App.confirmDeleteBudget('${b.id}')">Eliminar</button>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // 2. Gestor de Categorías
    if (catContainer) {
      catContainer.innerHTML = categories.map(c => `
        <div style="background:var(--surface-2); padding:10px 14px; border-radius:12px; border:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="width:14px; height:14px; border-radius:50%; background:${c.color}; display:inline-block;"></span>
            <div>
              <strong style="font-size:0.85rem; display:block;">${this.escapeHtml(c.name)}</strong>
              <small style="color:var(--muted); font-size:0.7rem; text-transform:uppercase;">${c.type} ${c.isCustom ? '· Creada por ti' : ''}</small>
            </div>
          </div>
          ${c.isCustom ? `
            <button class="btn-3d btn-3d--danger btn-3d--sm" style="padding:4px 8px; font-size:0.7rem;" onclick="App.confirmDeleteCategory('${c.id}')">×</button>
          ` : ''}
        </div>
      `).join('');
    }
  },

  // =========================================================================
  // VISTA: MÓDULO "ME DEBEN / DEBO" (CONTROL DE PRÉSTAMOS PERSONALES)
  // =========================================================================
  renderLoansView() {
    const summary = Storage.getLoansSummary();
    const searchVal = document.getElementById('loans-search-input') ? document.getElementById('loans-search-input').value : '';

    // KPI Summary
    const meDebenEl = document.getElementById('loans-total-me-deben');
    const deboEl = document.getElementById('loans-total-debo');
    const netEl = document.getElementById('loans-net-balance');

    if (meDebenEl) meDebenEl.textContent = Storage.formatCOP(summary.pendingMeDeben);
    if (deboEl) deboEl.textContent = Storage.formatCOP(summary.pendingDebo);
    if (netEl) {
      netEl.textContent = Storage.formatCOP(summary.netBalance);
      netEl.style.color = summary.netBalance >= 0 ? 'var(--success)' : 'var(--danger)';
    }

    // Tarjetas filtradas
    const filter = {
      search: searchVal,
      type: this.loanFilter === 'me_deben' ? 'me_deben' : this.loanFilter === 'debo' ? 'debo' : null,
      status: this.loanFilter === 'vencido' ? 'vencido' : this.loanFilter === 'saldado' ? 'saldado' : null
    };

    const loans = Storage.getLoans(filter);
    const container = document.getElementById('loans-cards-container');

    if (container) {
      if (!loans.length) {
        container.innerHTML = `
          <div class="card-3d" style="grid-column:1/-1; text-align:center; padding:36px; color:var(--muted);">
            <svg width="40" height="40" style="color:var(--accent); margin-bottom:12px;"><use href="#i-loans"/></svg>
            <h3 style="margin:0 0 6px; color:var(--fg);">No tienes registros en este filtro</h3>
            <p style="margin:0 0 16px; font-size:0.85rem;">Registra dinero que te deben o deudas pendientes para llevar un control exacto de tus cuentas personales.</p>
            <button class="btn-3d" onclick="App.openAddLoanModal()">+ Registrar Préstamo / Deuda</button>
          </div>
        `;
      } else {
        container.innerHTML = loans.map(l => {
          const isMeDeben = l.type === 'me_deben';
          let statusBadge;
          if (l.status === 'saldado') statusBadge = '<span class="badge-3d badge-3d--paid">✓ Saldado</span>';
          else if (l.isOverdue) statusBadge = '<span class="badge-3d badge-3d--overdue">⚠️ Vencido</span>';
          else if (l.status === 'parcial') statusBadge = '<span class="badge-3d badge-3d--partial">Abonado Parcial</span>';
          else statusBadge = '<span class="badge-3d badge-3d--pending">Pendiente Total</span>';

          const paymentsHtml = (l.payments && l.payments.length) ? `
            <div style="margin-top:10px; padding-top:10px; border-top:1px solid var(--border-light);">
              <small style="color:var(--muted); font-size:0.72rem; text-transform:uppercase; font-weight:700;">Historial de Abonos (${l.payments.length})</small>
              <div style="max-height:80px; overflow-y:auto; margin-top:4px; font-size:0.78rem; display:flex; flex-direction:column; gap:4px;">
                ${l.payments.map(p => `
                  <div style="display:flex; justify-content:space-between; color:var(--muted);">
                    <span>${p.date}: ${this.escapeHtml(p.notes || 'Abono')}</span>
                    <strong style="color:var(--fg);">${Storage.formatCOP(p.amount)}</strong>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : '';

          return `
            <div class="loan-card-3d">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                  <div>
                    <span class="badge-3d ${isMeDeben ? 'badge-3d--success' : 'badge-3d--danger'}" style="font-size:0.72rem;">
                      ${isMeDeben ? '🤝 ME DEBEN' : '💳 DEBO'}
                    </span>
                    <h3 style="margin:6px 0 2px; font-family:var(--font-head); font-size:1.3rem;">${this.escapeHtml(l.personName)}</h3>
                    <small style="color:var(--muted); font-size:0.75rem;">Desde: ${l.startDate} ${l.dueDate ? `· Límite: <strong>${l.dueDate}</strong>` : ''}</small>
                  </div>
                  ${statusBadge}
                </div>

                <div style="margin:14px 0 10px;">
                  <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:4px;">
                    <span style="font-size:0.78rem; color:var(--muted);">Monto Total: <strong>${Storage.formatCOP(l.amount)}</strong></span>
                    <span style="font-size:0.85rem; font-weight:700; color:${isMeDeben ? 'var(--success)' : 'var(--danger)'};">
                      Resta: ${Storage.formatCOP(l.remainingAmount)}
                    </span>
                  </div>

                  <!-- Barra de progreso -->
                  <div style="height:10px; background:var(--surface-2); border-radius:999px; overflow:hidden; border:1px solid var(--border);">
                    <div style="width:${l.progressPct}%; height:100%; background:${isMeDeben ? 'var(--success)' : 'var(--accent)'}; border-radius:999px; transition:width 0.4s var(--ease);"></div>
                  </div>
                </div>

                ${l.notes ? `<p style="margin:0 0 10px; font-size:0.82rem; color:var(--muted); font-style:italic;">"${this.escapeHtml(l.notes)}"</p>` : ''}
                ${paymentsHtml}
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; padding-top:12px; border-top:1px solid var(--border);">
                <button class="btn-3d btn-3d--danger btn-3d--sm" onclick="App.confirmDeleteLoan('${l.id}')">Eliminar</button>
                ${l.status !== 'saldado' ? `
                  <button class="btn-3d btn-3d--sm" onclick="App.openAddLoanPaymentModal('${l.id}', '${this.escapeHtml(l.personName)}', ${l.remainingAmount})">+ Abonar</button>
                ` : `<span style="font-size:0.8rem; color:var(--success); font-weight:700;">Completamente Pagado</span>`}
              </div>
            </div>
          `;
        }).join('');
      }
    }
  },

  setLoanFilter(filter) {
    this.loanFilter = filter;
    document.querySelectorAll('#loans-filter-tabs button').forEach(b => {
      b.classList.toggle('is-active-tab', b.getAttribute('data-loan-filter') === filter);
      b.className = b.getAttribute('data-loan-filter') === filter ? 'btn-3d btn-3d--sm is-active-tab' : 'btn-3d btn-3d--secondary btn-3d--sm';
    });
    this.renderLoansView();
  },

  // =========================================================================
  // VISTA: CALENDARIO FINANCIERO INTERACTIVO
  // =========================================================================
  renderCalendarView() {
    const year = this.calendarDate.getFullYear();
    const month = this.calendarDate.getMonth(); // 0 a 11
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const titleEl = document.getElementById('calendar-month-title');
    if (titleEl) titleEl.textContent = `${monthNames[month]} ${year}`;

    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const txs = Storage.getTransactions().filter(t => t.date.startsWith(monthStr));

    // KPI del mes
    const incMonth = txs.filter(t => t.type === 'ingreso').reduce((a, b) => a + b.amount, 0);
    const expMonth = txs.filter(t => t.type === 'gasto').reduce((a, b) => a + b.amount, 0);
    const balMonth = incMonth - expMonth;

    const incEl = document.getElementById('cal-kpi-incomes');
    const expEl = document.getElementById('cal-kpi-expenses');
    const balEl = document.getElementById('cal-kpi-balance');

    if (incEl) incEl.textContent = Storage.formatCOP(incMonth);
    if (expEl) expEl.textContent = Storage.formatCOP(expMonth);
    if (balEl) {
      balEl.textContent = Storage.formatCOP(balMonth);
      balEl.style.color = balMonth >= 0 ? 'var(--success)' : 'var(--danger)';
    }

    // Construir cuadrícula de días
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 es domingo
    // Convertir para que lunes sea 0
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const todayStr = new Date().toISOString().slice(0, 10);
    const grid = document.getElementById('calendar-days-grid');
    if (!grid) return;

    let cellsHtml = '';

    // Días de relleno del mes anterior
    for (let i = startOffset - 1; i >= 0; i--) {
      const prevDay = daysInPrevMonth - i;
      cellsHtml += `
        <div class="cal-day-cell is-other-month">
          <div class="cal-day-num"><span style="color:var(--muted);">${prevDay}</span></div>
        </div>
      `;
    }

    // Días del mes activo
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${monthStr}-${String(day).padStart(2, '0')}`;
      const isToday = dayStr === todayStr;
      const dayTxs = txs.filter(t => t.date === dayStr);

      const dayInc = dayTxs.filter(t => t.type === 'ingreso').reduce((a, b) => a + b.amount, 0);
      const dayExp = dayTxs.filter(t => t.type === 'gasto').reduce((a, b) => a + b.amount, 0);

      cellsHtml += `
        <div class="cal-day-cell ${isToday ? 'is-today' : ''}" onclick="App.openCalendarDayModal('${dayStr}')">
          <div class="cal-day-num">
            <span>${day}</span>
            ${isToday ? '<span class="badge-3d badge-3d--accent" style="padding:1px 4px; font-size:0.6rem;">HOY</span>' : ''}
          </div>
          <div>
            ${dayInc > 0 ? `<div class="cal-pill-inc">+${Storage.formatCOPShort(dayInc)}</div>` : ''}
            ${dayExp > 0 ? `<div class="cal-pill-exp">-${Storage.formatCOPShort(dayExp)}</div>` : ''}
          </div>
        </div>
      `;
    }

    // Días de relleno del mes siguiente para completar la fila
    const totalFilled = startOffset + daysInMonth;
    const remainingSlots = 7 - (totalFilled % 7);
    if (remainingSlots < 7) {
      for (let day = 1; day <= remainingSlots; day++) {
        cellsHtml += `
          <div class="cal-day-cell is-other-month">
            <div class="cal-day-num"><span style="color:var(--muted);">${day}</span></div>
          </div>
        `;
      }
    }

    grid.innerHTML = cellsHtml;
  },

  calendarPrevMonth() {
    this.calendarDate.setMonth(this.calendarDate.getMonth() - 1);
    this.renderCalendarView();
  },

  calendarNextMonth() {
    this.calendarDate.setMonth(this.calendarDate.getMonth() + 1);
    this.renderCalendarView();
  },

  calendarToday() {
    this.calendarDate = new Date();
    this.renderCalendarView();
  },

  openCalendarDayModal(dateStr) {
    const modal = document.getElementById('modal-calendar-day');
    const titleEl = document.getElementById('cal-day-modal-date');
    const listEl = document.getElementById('cal-day-tx-list');
    const addBtn = document.getElementById('cal-day-add-btn');

    if (titleEl) titleEl.textContent = `Fecha: ${dateStr}`;

    const txs = Storage.getTransactions().filter(t => t.date === dateStr);
    if (listEl) {
      if (!txs.length) {
        listEl.innerHTML = `<p style="text-align:center; color:var(--muted); margin:20px 0;">No hubo movimientos registrados en esta fecha.</p>`;
      } else {
        listEl.innerHTML = txs.map(t => {
          const cat = Storage.getCategoryById(t.categoryId);
          const isInc = t.type === 'ingreso';
          return `
            <div style="background:var(--surface-2); padding:10px 14px; border-radius:10px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; border:1px solid var(--border);">
              <div>
                <strong>${this.escapeHtml(t.description)}</strong>
                <small style="display:block; color:var(--muted); font-size:0.75rem;">${cat.name}</small>
              </div>
              <strong style="color:${isInc ? 'var(--success)' : 'var(--danger)'};">
                ${isInc ? '+' : '-'} ${Storage.formatCOP(t.amount)}
              </strong>
            </div>
          `;
        }).join('');
      }
    }

    if (addBtn) {
      addBtn.onclick = () => {
        this.closeAllModals();
        this.openAddTransactionModal('gasto', dateStr);
      };
    }

    this.showModal('modal-calendar-day');
  },

  // =========================================================================
  // VISTA: SIMULADOR "¿PUEDO PERMITÍRMELO?"
  // =========================================================================
  renderSimulatorView() {
    const catSelect = document.getElementById('sim-category');
    if (catSelect && catSelect.options.length === 0) {
      const cats = Storage.getCategories('gasto');
      cats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        catSelect.appendChild(opt);
      });
    }
  },

  runSimulator(e) {
    e.preventDefault();
    const itemName = document.getElementById('sim-item-name').value;
    const amount = parseFloat(document.getElementById('sim-amount').value);
    const catId = document.getElementById('sim-category').value;

    const result = Storage.simulatePurchase(itemName, amount, catId);
    const container = document.getElementById('sim-result-container');

    if (container) {
      container.innerHTML = `
        <div class="sim-result-card verdict-${result.verdict}">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
            <div>
              <span class="badge-3d" style="background:${result.color}22; color:${result.color}; border:1px solid ${result.color}44; font-size:0.78rem;">${result.badge}</span>
              <h2 style="margin:8px 0 4px; font-family:var(--font-head); font-size:1.5rem;">${result.headline}</h2>
            </div>
            <span style="font-family:var(--font-head); font-size:1.4rem; font-weight:800; color:${result.color};">${Storage.formatCOP(result.price)}</span>
          </div>

          <p style="font-size:0.9rem; line-height:1.5; color:var(--fg); margin-bottom:16px;">
            ${result.explanation}
          </p>

          <!-- Métricas del Asesor -->
          <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:10px; margin-bottom:18px;">
            <div style="background:var(--surface-2); padding:10px; border-radius:10px; border:1px solid var(--border);">
              <small style="color:var(--muted); font-size:0.7rem; text-transform:uppercase;">Saldo restante tras compra</small>
              <div style="font-weight:700; font-size:1rem; color:${result.metrics.postPurchaseBalance >= 0 ? 'var(--fg)' : 'var(--danger)'};">
                ${Storage.formatCOP(result.metrics.postPurchaseBalance)}
              </div>
            </div>
            <div style="background:var(--surface-2); padding:10px; border-radius:10px; border:1px solid var(--border);">
              <small style="color:var(--muted); font-size:0.7rem; text-transform:uppercase;">Equivalente en trabajo</small>
              <div style="font-weight:700; font-size:1rem;">
                ${result.metrics.daysOfWork > 0 ? `${result.metrics.daysOfWork} días de sueldo` : 'N/A'}
              </div>
            </div>
          </div>

          <div style="background:${result.color}15; border-left:4px solid ${result.color}; padding:10px 14px; border-radius:8px;">
            <strong style="color:${result.color}; font-size:0.82rem; display:block; margin-bottom:2px;">Recomendación:</strong>
            <span style="font-size:0.84rem; color:var(--fg);">${result.advice}</span>
          </div>
        </div>
      `;
    }

    if (typeof SoundEngine !== 'undefined') {
      if (result.verdict === 'success') SoundEngine.playSuccess();
      else SoundEngine.playClick();
    }
  },

  // =========================================================================
  // VISTA: GAMIFICACIÓN Y RETOS DE AHORRO
  // =========================================================================
  renderAchievementsView() {
    const data = Storage.getAchievements();
    const challenge = Storage.getSavingsChallenge();
    const savings = Storage.getSavings();

    // Actualizar píldora de progreso
    const pill = document.getElementById('achievements-progress-pill');
    if (pill) pill.textContent = `${data.unlockedCount} / ${data.totalCount} Medallas (${data.percentage}%)`;

    // Grid de Medallas
    const grid = document.getElementById('achievements-grid');
    if (grid) {
      grid.innerHTML = data.badges.map(b => `
        <div class="trophy-card-3d ${b.unlocked ? '' : 'is-locked'}">
          <div style="font-size:2.4rem; line-height:1;">${b.icon}</div>
          <h4 style="margin:0; font-family:var(--font-head); font-size:1.05rem;">${b.title}</h4>
          <p style="margin:0; font-size:0.78rem; color:var(--muted); line-height:1.4;">${b.desc}</p>
          <span class="badge-3d ${b.unlocked ? 'badge-3d--success' : 'badge-3d--secondary'}" style="font-size:0.7rem; margin-top:4px;">
            ${b.unlocked ? '✓ Desbloqueada' : `🔒 ${b.progress}`}
          </span>
        </div>
      `).join('');
    }

    // Reto de Ahorro Progresivo
    const totalEl = document.getElementById('challenge-saved-total');
    if (totalEl) totalEl.textContent = `${Storage.formatCOP(challenge.totalAccumulated)}`;

    // Selector de meta destino
    const goalSelect = document.getElementById('challenge-target-goal');
    if (goalSelect) {
      const currentSelected = goalSelect.value;
      goalSelect.innerHTML = `<option value="">Ahorro general (solo marcar día)</option>` +
        savings.map(s => `<option value="${s.id}" ${s.id === currentSelected ? 'selected' : ''}>Abonar a: ${this.escapeHtml(s.name)}</option>`).join('');
    }

    // Grid de los 30 Días
    const challengeGrid = document.getElementById('challenge-tiles-grid');
    if (challengeGrid) {
      challengeGrid.innerHTML = challenge.days.map(d => `
        <div class="challenge-tile ${d.isDone ? 'is-done' : ''}" onclick="App.toggleChallengeDay(${d.day})">
          <div style="font-size:0.7rem; font-weight:700;">DÍA ${d.day}</div>
          <div style="font-size:0.75rem; font-weight:800; margin-top:2px;">$ ${(d.amount / 1000)}k</div>
          <div style="font-size:0.7rem; margin-top:4px;">${d.isDone ? '✓' : '○'}</div>
        </div>
      `).join('');
    }
  },

  toggleChallengeDay(dayNumber) {
    const goalSelect = document.getElementById('challenge-target-goal');
    const goalId = goalSelect ? goalSelect.value : null;

    const res = Storage.toggleChallengeDay(dayNumber, goalId);
    if (res.success) {
      this.renderAchievementsView();
      if (res.isDone && goalId) {
        this.showToast(`¡Día ${dayNumber} completado y abonado a tu meta!`, 'success');
      }
    }
  },

  // =========================================================================
  // VISTA: REPORTES Y SALUD FINANCIERA
  // =========================================================================
  renderReportsView() {
    const analytics = Storage.getAnalytics();
    const health = Storage.calculateFinancialHealthScore();

    // Stats Grid
    const expMean = document.getElementById('report-exp-mean');
    const expMedian = document.getElementById('report-exp-median');
    const incMean = document.getElementById('report-inc-mean');
    const incMedian = document.getElementById('report-inc-median');

    if (expMean) expMean.textContent = Storage.formatCOP(analytics.expenseMean);
    if (expMedian) expMedian.textContent = Storage.formatCOP(analytics.expenseMedian);
    if (incMean) incMean.textContent = Storage.formatCOP(analytics.incomeMean);
    if (incMedian) incMedian.textContent = Storage.formatCOP(analytics.incomeMedian);

    // Diagnóstico de Salud
    const scoreEl = document.getElementById('report-health-score');
    const badgeEl = document.getElementById('report-health-badge');
    const circleEl = document.getElementById('report-health-circle');
    const titleEl = document.getElementById('report-health-title');
    const breakdownEl = document.getElementById('report-health-breakdown');
    const tipsEl = document.getElementById('report-health-tips');

    if (scoreEl) scoreEl.textContent = health.score;
    if (badgeEl) {
      badgeEl.textContent = health.tierLabel;
      badgeEl.style.color = health.tierColor;
    }
    if (circleEl) {
      circleEl.style.borderColor = health.tierColor;
      circleEl.style.boxShadow = `0 0 35px -5px ${health.tierColor}`;
    }
    if (titleEl) titleEl.textContent = health.tierLabel;

    if (breakdownEl) {
      const items = [
        health.breakdown.savingsRate,
        health.breakdown.budgetControl,
        health.breakdown.emergencyFund,
        health.breakdown.debtLevel
      ];
      breakdownEl.innerHTML = items.map(item => {
        const pct = Math.round((item.score / item.max) * 100);
        return `
          <div>
            <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
              <span>${item.label}</span>
              <strong>${item.score} / ${item.max} pts</strong>
            </div>
            <div style="height:8px; background:var(--surface-2); border-radius:999px; overflow:hidden; border:1px solid var(--border);">
              <div style="width:${pct}%; height:100%; background:var(--accent); border-radius:999px;"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    if (tipsEl) {
      tipsEl.innerHTML = health.tips.map(t => `<li style="margin-bottom:6px;">${t}</li>`).join('');
    }

    // Gráfica de Tendencia
    setTimeout(() => {
      Charts.renderReportsTrend('chart-reports-trend');
    }, 50);
  },

  // =========================================================================
  // VISTA: GRUPO FAMILIAR (FLUJO DINÁMICO SIN DATOS FIJOS)
  // =========================================================================
  renderFamilyView() {
    const container = document.getElementById('family-container');
    if (!container) return;

    const family = Storage.getFamilyGroup();

    // 1. Estado Vacío: Si no ha creado grupo familiar
    if (!family) {
      container.innerHTML = `
        <div class="card-3d" style="text-align:center; padding:48px 24px; max-width:680px; margin:0 auto;">
          <div style="width:70px; height:70px; border-radius:50%; background:var(--surface-2); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; margin:0 auto 18px; color:var(--accent);">
            <svg width="36" height="36"><use href="#i-family"/></svg>
          </div>
          <h2 style="margin:0 0 8px; font-family:var(--font-head); font-size:1.6rem;">Crea tu Grupo Familiar</h2>
          <p style="margin:0 0 24px; color:var(--muted); font-size:0.9rem; line-height:1.5;">
            Organiza las finanzas de tu hogar de forma colaborativa. Crea tu grupo familiar asignándole un nombre propio y luego añade a los miembros de tu familia.
          </p>
          <button class="btn-3d" onclick="App.openCreateFamilyModal()">+ Crear Grupo Familiar</button>
        </div>
      `;
      return;
    }

    // 2. Estado Con Grupo Creado
    const members = family.members || [];
    container.innerHTML = `
      <div class="card-3d" style="margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
          <div>
            <span class="badge-3d badge-3d--accent" style="font-size:0.7rem;">Grupo Activo</span>
            <h2 style="margin:4px 0 2px; font-family:var(--font-head); font-size:1.6rem;">${this.escapeHtml(family.name)}</h2>
            <p style="margin:0; color:var(--muted); font-size:0.82rem;">Creado por <strong>${this.escapeHtml(family.createdByName || 'Ti')}</strong> el ${family.createdAt}</p>
          </div>
          <div style="display:flex; gap:10px;">
            <button class="btn-3d" onclick="App.openAddFamilyMemberModal()">+ Añadir Miembro</button>
            <button class="btn-3d btn-3d--danger btn-3d--sm" onclick="App.confirmDeleteFamilyGroup()">Disolver Grupo</button>
          </div>
        </div>

        <div class="table-container">
          <table class="table-3d">
            <thead>
              <tr>
                <th>Miembro</th>
                <th>Parentesco / Relación</th>
                <th>Fecha de Incorporación</th>
                <th>Notas</th>
                <th style="text-align:right;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${members.map(m => `
                <tr>
                  <td><strong>${this.escapeHtml(m.name)}</strong></td>
                  <td><span class="badge-3d ${m.isOwner ? 'badge-3d--accent' : 'badge-3d--secondary'}">${this.escapeHtml(m.relationship)}</span></td>
                  <td style="font-family:var(--font-mono); font-size:0.8rem; color:var(--muted);">${m.joinedAt || family.createdAt}</td>
                  <td style="color:var(--muted); font-size:0.82rem;">${this.escapeHtml(m.notes || 'Miembro del hogar')}</td>
                  <td style="text-align:right;">
                    ${m.isOwner ? '<span style="font-size:0.75rem; color:var(--muted);">Titular</span>' : `
                      <button class="btn-3d btn-3d--danger btn-3d--sm" onclick="App.confirmDeleteFamilyMember('${m.id}')">Eliminar</button>
                    `}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  openCreateFamilyModal() {
    const input = document.getElementById('family-group-name-input');
    if (input) input.value = '';
    this.showModal('modal-family-create');
  },

  saveCreateFamilyForm(e) {
    e.preventDefault();
    const name = document.getElementById('family-group-name-input').value;
    const res = Storage.createFamilyGroup(name);

    if (res.success) {
      this.closeAllModals();
      this.showToast('¡Grupo familiar creado! Ahora puedes añadir miembros.', 'success');
      this.renderFamilyView();
    } else {
      this.showToast(res.message, 'danger');
    }
  },

  openAddFamilyMemberModal() {
    const nameInput = document.getElementById('fam-member-name');
    const relSelect = document.getElementById('fam-member-relation');
    const notesInput = document.getElementById('fam-member-notes');

    if (nameInput) nameInput.value = '';
    if (relSelect) relSelect.selectedIndex = 0;
    if (notesInput) notesInput.value = '';

    this.showModal('modal-family-member');
  },

  saveFamilyMemberForm(e) {
    e.preventDefault();
    const name = document.getElementById('fam-member-name').value;
    const relationship = document.getElementById('fam-member-relation').value;
    const notes = document.getElementById('fam-member-notes').value;

    const res = Storage.addFamilyMember({ name, relationship, notes });
    if (res.success) {
      this.closeAllModals();
      this.showToast('Miembro añadido al grupo familiar.', 'success');
      this.renderFamilyView();
    } else {
      this.showToast(res.message, 'danger');
    }
  },

  confirmDeleteFamilyMember(memberId) {
    this.confirmModal('¿Eliminar miembro familiar?', 'El miembro será removido del grupo familiar compartido.', () => {
      const res = Storage.deleteFamilyMember(memberId);
      if (res.success) {
        this.showToast('Miembro removido.', 'info');
        this.renderFamilyView();
      } else {
        this.showToast(res.message, 'danger');
      }
    });
  },

  confirmDeleteFamilyGroup() {
    this.confirmModal('¿Disolver grupo familiar?', 'Se eliminará el grupo y podrás crear uno nuevo desde cero.', () => {
      Storage.deleteFamilyGroup();
      this.showToast('Grupo familiar disuelto.', 'info');
      this.renderFamilyView();
    });
  },

  // =========================================================================
  // VISTA: PERFIL
  // =========================================================================
  renderProfileView() {
    const session = Storage.getSession();
    if (!session || !session.user) return;

    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');

    if (nameInput) nameInput.value = session.user.name;
    if (emailInput) emailInput.value = session.user.email;
  },

  // =========================================================================
  // VISTA: METAS DE AHORRO
  // =========================================================================
  renderSavingsView() {
    const container = document.getElementById('savings-cards-container');
    const savings = Storage.getSavings();

    if (!container) return;

    if (!savings.length) {
      container.innerHTML = `
        <div class="card-3d" style="grid-column:1/-1; text-align:center; padding:36px; color:var(--muted);">
          <svg width="40" height="40" style="color:var(--accent); margin-bottom:12px;"><use href="#i-savings"/></svg>
          <h3 style="margin:0 0 6px; color:var(--fg);">No tienes metas de ahorro registradas</h3>
          <p style="margin:0 0 16px; font-size:0.85rem;">Establece objetivos como tu Fondo de Emergencia, vacaciones o compras programadas.</p>
          <button class="btn-3d" onclick="App.openAddSavingModal()">+ Crear Primera Meta</button>
        </div>
      `;
    } else {
      container.innerHTML = savings.map(s => `
        <div class="card-3d">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
            <div>
              <span class="badge-3d ${s.isCompleted ? 'badge-3d--success' : 'badge-3d--accent'}" style="font-size:0.75rem;">
                ${s.isCompleted ? '✓ META CUMPLIDA' : 'EN PROCESO'}
              </span>
              <h3 style="margin:6px 0 2px; font-family:var(--font-head); font-size:1.3rem;">${this.escapeHtml(s.name)}</h3>
              <small style="color:var(--muted); font-size:0.75rem;">Meta: <strong>${Storage.formatCOP(s.targetAmount)}</strong></small>
            </div>
            <span class="badge-3d ${s.isCompleted ? 'badge-3d--success' : 'badge-3d--accent'}">${s.percentage}%</span>
          </div>

          <!-- Barra de progreso 3D -->
          <div style="height:12px; background:var(--surface-2); border-radius:999px; overflow:hidden; border:1px solid var(--border); margin-bottom:12px;">
            <div style="width:${s.percentage}%; height:100%; background:${s.isCompleted ? 'var(--success)' : 'var(--accent)'}; border-radius:999px; transition:width 0.4s var(--ease);"></div>
          </div>

          <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--muted); margin-bottom:14px;">
            <span>Ahorrado: <strong style="color:var(--fg);">${Storage.formatCOP(s.currentAmount)}</strong></span>
            <span>Resta: <strong style="color:var(--accent);">${Storage.formatCOP(s.remainingAmount)}</strong></span>
          </div>

          ${s.notes ? `<p style="margin:0 0 14px; font-size:0.8rem; color:var(--muted); font-style:italic;">"${this.escapeHtml(s.notes)}"</p>` : ''}

          <div style="display:flex; justify-content:space-between; align-items:center; padding-top:12px; border-top:1px solid var(--border);">
            <button class="btn-3d btn-3d--danger btn-3d--sm" onclick="App.confirmDeleteSaving('${s.id}')">Eliminar</button>
            <button class="btn-3d btn-3d--sm" onclick="App.openDepositSavingModal('${s.id}', '${this.escapeHtml(s.name)}')">+ Abonar</button>
          </div>
        </div>
      `).join('');
    }
  },

  // =========================================================================
  // BUSCADOR GLOBAL RÁPIDO (Ctrl + K)
  // =========================================================================
  openQuickSearchModal() {
    const modal = document.getElementById('modal-quick-search');
    const input = document.getElementById('quick-search-input');
    const results = document.getElementById('quick-search-results');

    if (input) input.value = '';
    if (results) results.innerHTML = `<p style="text-align:center; padding:24px; color:var(--muted); font-size:0.85rem;">Escribe una descripción, monto o persona para buscar en MoneyTrack.</p>`;

    if (modal) modal.style.display = 'flex';
    if (input) setTimeout(() => input.focus(), 50);
  },

  handleQuickSearch(query) {
    const results = document.getElementById('quick-search-results');
    if (!results) return;

    const q = (query || '').trim().toLowerCase();
    if (!q) {
      results.innerHTML = `<p style="text-align:center; padding:24px; color:var(--muted); font-size:0.85rem;">Escribe para iniciar la búsqueda en tiempo real.</p>`;
      return;
    }

    const txs = Storage.getTransactions({ search: q });
    const loans = Storage.getLoans({ search: q });
    const savings = Storage.getSavings().filter(s => s.name.toLowerCase().includes(q));

    let html = '';

    if (txs.length) {
      html += `<div style="padding:8px 20px; font-size:0.7rem; font-weight:700; color:var(--muted); text-transform:uppercase; background:var(--surface-2);">Movimientos (${txs.length})</div>`;
      html += txs.slice(0, 5).map(t => `
        <div class="quick-search-item" onclick="App.closeAllModals(); App.navigateTo('${t.type === 'ingreso' ? 'incomes' : 'expenses'}');">
          <div>
            <strong>${this.escapeHtml(t.description)}</strong>
            <small style="display:block; color:var(--muted); font-size:0.75rem;">${t.date} · ${t.type.toUpperCase()}</small>
          </div>
          <strong style="color:${t.type === 'ingreso' ? 'var(--success)' : 'var(--danger)'};">${Storage.formatCOP(t.amount)}</strong>
        </div>
      `).join('');
    }

    if (loans.length) {
      html += `<div style="padding:8px 20px; font-size:0.7rem; font-weight:700; color:var(--muted); text-transform:uppercase; background:var(--surface-2);">Préstamos / Deudas (${loans.length})</div>`;
      html += loans.slice(0, 4).map(l => `
        <div class="quick-search-item" onclick="App.closeAllModals(); App.navigateTo('loans');">
          <div>
            <strong>${this.escapeHtml(l.personName)}</strong>
            <small style="display:block; color:var(--muted); font-size:0.75rem;">${l.type === 'me_deben' ? 'Me deben' : 'Debo'} · ${l.status.toUpperCase()}</small>
          </div>
          <strong style="color:var(--accent);">${Storage.formatCOP(l.amount)}</strong>
        </div>
      `).join('');
    }

    if (savings.length) {
      html += `<div style="padding:8px 20px; font-size:0.7rem; font-weight:700; color:var(--muted); text-transform:uppercase; background:var(--surface-2);">Metas de Ahorro (${savings.length})</div>`;
      html += savings.slice(0, 3).map(s => `
        <div class="quick-search-item" onclick="App.closeAllModals(); App.navigateTo('savings');">
          <div>
            <strong>${this.escapeHtml(s.name)}</strong>
            <small style="display:block; color:var(--muted); font-size:0.75rem;">Progreso: ${s.percentage}%</small>
          </div>
          <strong style="color:var(--success);">${Storage.formatCOP(s.currentAmount)}</strong>
        </div>
      `).join('');
    }

    if (!html) {
      results.innerHTML = `<p style="text-align:center; padding:32px; color:var(--muted);">No se encontraron resultados para "${this.escapeHtml(query)}".</p>`;
    } else {
      results.innerHTML = html;
    }
  },

  // =========================================================================
  // CONTROLADORES DE MODALES Y FORMULARIOS
  // =========================================================================
  bindModals() {
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', e => {
        if (e.target === backdrop) this.closeAllModals();
      });
    });
  },

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
  },

  closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.style.display = 'none');
    const qs = document.getElementById('modal-quick-search');
    if (qs) qs.style.display = 'none';
  },

  // Modal Movimiento (Ingreso / Gasto)
  openAddTransactionModal(type, prefilledDate = null) {
    const title = document.getElementById('modal-tx-title');
    const idInput = document.getElementById('tx-id');
    const typeInput = document.getElementById('tx-type');
    const amountInput = document.getElementById('tx-amount');
    const descInput = document.getElementById('tx-desc');
    const dateInput = document.getElementById('tx-date');
    const catSelect = document.getElementById('tx-category');

    if (title) title.textContent = type === 'ingreso' ? 'Registrar Ingreso' : 'Registrar Gasto';
    if (idInput) idInput.value = '';
    if (typeInput) typeInput.value = type;
    if (amountInput) amountInput.value = '';
    if (descInput) descInput.value = '';
    if (dateInput) dateInput.value = prefilledDate || new Date().toISOString().slice(0, 10);

    // Poblar categorías de ese tipo
    if (catSelect) {
      catSelect.innerHTML = '';
      const cats = Storage.getCategories(type);
      cats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        catSelect.appendChild(opt);
      });
    }

    this.showModal('modal-transaction');
  },

  openEditTransactionModal(id) {
    const tx = Storage.getTransactions().find(t => t.id === id);
    if (!tx) return;

    this.openAddTransactionModal(tx.type);
    document.getElementById('modal-tx-title').textContent = 'Editar Movimiento';
    document.getElementById('tx-id').value = tx.id;
    document.getElementById('tx-amount').value = tx.amount;
    document.getElementById('tx-desc').value = tx.description;
    document.getElementById('tx-date').value = tx.date;
    document.getElementById('tx-category').value = tx.categoryId;
  },

  saveTransactionForm(e) {
    e.preventDefault();
    const id = document.getElementById('tx-id').value;
    const type = document.getElementById('tx-type').value;
    const amount = document.getElementById('tx-amount').value;
    const categoryId = document.getElementById('tx-category').value;
    const description = document.getElementById('tx-desc').value;
    const date = document.getElementById('tx-date').value;

    let res;
    if (id) {
      res = Storage.updateTransaction(id, { type, amount, categoryId, description, date });
    } else {
      res = Storage.addTransaction({ type, amount, categoryId, description, date });
    }

    if (res.success) {
      this.closeAllModals();
      this.showToast(id ? 'Movimiento actualizado.' : '¡Movimiento guardado con éxito!', 'success');
      this.renderCurrentView();
    } else {
      this.showToast(res.message, 'danger');
    }
  },

  confirmDeleteTransaction(id) {
    this.confirmModal('¿Eliminar movimiento?', 'Esta acción no se puede deshacer y afectará el balance.', () => {
      const res = Storage.deleteTransaction(id);
      if (res.success) {
        this.showToast('Movimiento eliminado.', 'info');
        this.renderCurrentView();
      } else {
        this.showToast(res.message, 'danger');
      }
    });
  },

  // Modal Presupuesto
  openAddBudgetModal(prefilledCatId = null, prefilledLimit = null) {
    const catSelect = document.getElementById('budget-category');
    const limitInput = document.getElementById('budget-limit');

    if (catSelect) {
      catSelect.innerHTML = '';
      const cats = Storage.getCategories('gasto');
      cats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        if (c.id === prefilledCatId) opt.selected = true;
        catSelect.appendChild(opt);
      });
    }

    if (limitInput) limitInput.value = prefilledLimit || '';
    this.showModal('modal-budget');
  },

  saveBudgetForm(e) {
    e.preventDefault();
    const categoryId = document.getElementById('budget-category').value;
    const limit = document.getElementById('budget-limit').value;

    const res = Storage.setBudget(categoryId, limit);
    if (res.success) {
      this.closeAllModals();
      this.showToast('Presupuesto fijado correctamente.', 'success');
      this.renderCurrentView();
    } else {
      this.showToast(res.message, 'danger');
    }
  },

  confirmDeleteBudget(id) {
    this.confirmModal('¿Eliminar presupuesto?', 'Dejarás de tener un límite asignado a esta categoría.', () => {
      Storage.deleteBudget(id);
      this.showToast('Presupuesto eliminado.', 'info');
      this.renderCurrentView();
    });
  },

  // Modal Categoría Personalizada
  openAddCategoryModal() {
    const nameInput = document.getElementById('cat-custom-name');
    if (nameInput) nameInput.value = '';
    this.showModal('modal-category');
  },

  saveCustomCategoryForm(e) {
    e.preventDefault();
    const name = document.getElementById('cat-custom-name').value;
    const type = document.getElementById('cat-custom-type').value;
    const color = document.getElementById('cat-custom-color').value;

    const res = Storage.addCustomCategory({ name, type, color });
    if (res.success) {
      this.closeAllModals();
      this.showToast('¡Categoría creada con éxito!', 'success');
      this.renderCurrentView();
    } else {
      this.showToast(res.message, 'danger');
    }
  },

  confirmDeleteCategory(catId) {
    this.confirmModal('¿Eliminar categoría?', 'Se borrará la categoría si no contiene transacciones activas.', () => {
      const res = Storage.deleteCategory(catId);
      if (res.success) {
        this.showToast('Categoría eliminada.', 'info');
        this.renderCurrentView();
      } else {
        this.showToast(res.message, 'danger');
      }
    });
  },

  // Modal Préstamos (Me Deben / Debo)
  openAddLoanModal() {
    const person = document.getElementById('loan-person');
    const amount = document.getElementById('loan-amount');
    const start = document.getElementById('loan-start-date');
    const due = document.getElementById('loan-due-date');
    const notes = document.getElementById('loan-notes');

    if (person) person.value = '';
    if (amount) amount.value = '';
    if (start) start.value = new Date().toISOString().slice(0, 10);
    if (due) due.value = '';
    if (notes) notes.value = '';

    this.selectLoanFormType('me_deben');
    this.showModal('modal-loan');
  },

  selectLoanFormType(type) {
    this.selectedLoanType = type;
    const valInput = document.getElementById('loan-type-val');
    if (valInput) valInput.value = type;

    const meDebenBtn = document.getElementById('loan-type-me-deben');
    const deboBtn = document.getElementById('loan-type-debo');

    if (type === 'me_deben') {
      if (meDebenBtn) meDebenBtn.className = 'btn-3d btn-3d--sm is-active-tab';
      if (deboBtn) deboBtn.className = 'btn-3d btn-3d--secondary btn-3d--sm';
    } else {
      if (meDebenBtn) meDebenBtn.className = 'btn-3d btn-3d--secondary btn-3d--sm';
      if (deboBtn) deboBtn.className = 'btn-3d btn-3d--sm is-active-tab';
    }
  },

  saveLoanForm(e) {
    e.preventDefault();
    const type = document.getElementById('loan-type-val').value;
    const personName = document.getElementById('loan-person').value;
    const amount = document.getElementById('loan-amount').value;
    const startDate = document.getElementById('loan-start-date').value;
    const dueDate = document.getElementById('loan-due-date').value;
    const notes = document.getElementById('loan-notes').value;

    const res = Storage.addLoan({ type, personName, amount, startDate, dueDate, notes });
    if (res.success) {
      this.closeAllModals();
      this.showToast('Registro de préstamo guardado.', 'success');
      this.renderLoansView();
    } else {
      this.showToast(res.message, 'danger');
    }
  },

  openAddLoanPaymentModal(loanId, personName, remainingAmount) {
    document.getElementById('loan-payment-loan-id').value = loanId;
    document.getElementById('loan-payment-person').textContent = personName;
    document.getElementById('loan-payment-pending').textContent = Storage.formatCOP(remainingAmount);
    document.getElementById('loan-payment-amount').value = '';
    document.getElementById('loan-payment-date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('loan-payment-note').value = '';

    this.showModal('modal-loan-payment');
  },

  saveLoanPaymentForm(e) {
    e.preventDefault();
    const loanId = document.getElementById('loan-payment-loan-id').value;
    const amount = document.getElementById('loan-payment-amount').value;
    const date = document.getElementById('loan-payment-date').value;
    const notes = document.getElementById('loan-payment-note').value;

    const res = Storage.addLoanPayment(loanId, { amount, date, notes });
    if (res.success) {
      this.closeAllModals();
      this.showToast(res.loan.status === 'saldado' ? '¡Préstamo saldado por completo!' : 'Abono registrado con éxito.', 'success');
      this.renderLoansView();
    } else {
      this.showToast(res.message, 'danger');
    }
  },

  confirmDeleteLoan(id) {
    this.confirmModal('¿Eliminar préstamo?', 'Se borrará el registro y todo su historial de abonos.', () => {
      Storage.deleteLoan(id);
      this.showToast('Registro eliminado.', 'info');
      this.renderLoansView();
    });
  },

  // Modal Metas de Ahorro
  openAddSavingModal() {
    document.getElementById('saving-name').value = '';
    document.getElementById('saving-target').value = '';
    document.getElementById('saving-current').value = '0';
    document.getElementById('saving-date').value = '';
    document.getElementById('saving-notes').value = '';
    this.showModal('modal-saving');
  },

  saveSavingGoalForm(e) {
    e.preventDefault();
    const name = document.getElementById('saving-name').value;
    const targetAmount = parseFloat(document.getElementById('saving-target').value);
    const currentAmount = parseFloat(document.getElementById('saving-current').value) || 0;
    const targetDate = document.getElementById('saving-date').value;
    const notes = document.getElementById('saving-notes').value;

    if (!name.trim() || !targetAmount || targetAmount <= 0) {
      this.showToast('Ingresa un nombre y monto objetivo válidos.', 'danger');
      return;
    }

    const res = Storage.addSavingGoal({ name, targetAmount, currentAmount, targetDate, notes });
    if (res.success) {
      this.closeAllModals();
      this.showToast('¡Meta de ahorro creada!', 'success');
      this.renderCurrentView();
    } else {
      this.showToast(res.message, 'danger');
    }
  },

  openDepositSavingModal(id, name) {
    document.getElementById('deposit-saving-id').value = id;
    document.getElementById('deposit-saving-name').textContent = name;
    document.getElementById('deposit-amount').value = '';
    this.showModal('modal-deposit');
  },

  saveDepositForm(e) {
    e.preventDefault();
    const id = document.getElementById('deposit-saving-id').value;
    const amount = parseFloat(document.getElementById('deposit-amount').value);

    if (!amount || amount <= 0) {
      this.showToast('Ingresa un monto de abono mayor a cero.', 'danger');
      return;
    }

    const res = Storage.depositToSaving(id, amount);
    if (res.success) {
      this.closeAllModals();
      this.showToast('¡Abono registrado! Tu meta está más cerca.', 'success');
      this.renderCurrentView();
    } else {
      this.showToast(res.message, 'danger');
    }
  },

  confirmDeleteSaving(id) {
    this.confirmModal('¿Eliminar meta de ahorro?', 'Se borrará la meta y su historial acumulado.', () => {
      const res = Storage.deleteSavingGoal(id);
      if (res.success) {
        this.showToast('Meta eliminada.', 'info');
        this.renderCurrentView();
      } else {
        this.showToast(res.message, 'danger');
      }
    });
  },

  // Modal Confirmación Genérico
  confirmModal(title, message, onConfirm) {
    const titleEl = document.getElementById('modal-confirm-title');
    const msgEl = document.getElementById('modal-confirm-message');
    const btn = document.getElementById('modal-confirm-btn');

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;
    if (btn) {
      btn.onclick = () => {
        this.closeAllModals();
        if (typeof onConfirm === 'function') onConfirm();
      };
    }

    this.showModal('modal-confirm');
  },

  // Toasts Accesibles
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-3d toast--${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <div style="flex:1;">${this.escapeHtml(message)}</div>
      <button style="background:none; border:none; color:inherit; font-weight:bold; cursor:pointer;" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 4000);
  },

  // PWA (Service Worker)
  initPWA() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => {
          console.log('SW registration error:', err);
        });
      });
    }
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
