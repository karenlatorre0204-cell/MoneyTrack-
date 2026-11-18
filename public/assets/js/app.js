/**
 * MONEYTRACK · Main Application Controller
 * Navegación modular por tabs, renderizado dinámico, validación de formularios,
 * modales de confirmación y toasts accesibles.
 */

const App = {
  currentView: 'dashboard',
  currentPage: 1,
  pageSize: 8,
  sortField: 'date',
  sortAsc: false,
  deleteTarget: null,

  init() {
    this.checkSession();
    this.bindNavigation();
    this.bindModals();
    this.renderCurrentView();
    this.initPWA();
  },

  // 1. Control de Sesión
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

    // Actualizar nombre y rol en la cabecera
    const userNameEl = document.getElementById('header-user-name');
    const userRoleEl = document.getElementById('header-user-role');
    if (userNameEl) userNameEl.textContent = session.user.name;
    if (userRoleEl) userRoleEl.textContent = session.user.role.toUpperCase();

    return true;
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

    // Botón menú hamburguesa móvil
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
  },

  renderCurrentView() {
    switch (this.currentView) {
      case 'dashboard':
        this.renderDashboard();
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
      case 'savings':
        this.renderSavingsView();
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

  // 3. Render Dashboard
  renderDashboard() {
    const kpis = Storage.getDashboardKPIs();

    // Actualizar valores monetarios
    const balanceEl = document.getElementById('dash-balance');
    const incomeEl = document.getElementById('dash-incomes');
    const expenseEl = document.getElementById('dash-expenses');
    const budgetPctEl = document.getElementById('dash-budget-pct');
    const savingsPctEl = document.getElementById('dash-savings-pct');

    if (balanceEl) balanceEl.textContent = Storage.formatCOP(kpis.balance);
    if (incomeEl) incomeEl.textContent = Storage.formatCOP(kpis.totalIncomes);
    if (expenseEl) expenseEl.textContent = Storage.formatCOP(kpis.totalExpenses);
    if (budgetPctEl) budgetPctEl.textContent = `${kpis.budgetCompliance}%`;
    if (savingsPctEl) savingsPctEl.textContent = `${kpis.savingsProgress}%`;

    // Renderizar tabla de movimientos recientes
    const tbody = document.getElementById('dash-recent-tbody');
    if (tbody) {
      if (!kpis.recentTransactions.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:var(--muted);">No hay movimientos recientes registrados.</td></tr>`;
      } else {
        tbody.innerHTML = kpis.recentTransactions.map(t => {
          const cat = Storage.getCategoryById(t.categoryId);
          const isIncome = t.type === 'ingreso';
          return `
            <tr>
              <td><strong>${t.date}</strong></td>
              <td>${this.escapeHtml(t.description)}</td>
              <td><span class="badge-3d" style="border-color:${cat.color}; color:${cat.color}">${this.escapeHtml(cat.name)}</span></td>
              <td style="color:${isIncome ? 'var(--success)' : 'var(--danger)'}; font-weight:700; font-family:var(--font-mono)">
                ${isIncome ? '+' : '-'} ${Storage.formatCOP(t.amount)}
              </td>
              <td>
                <span class="badge-3d badge-3d--${isIncome ? 'success' : 'danger'}">
                  ${isIncome ? 'Ingreso' : 'Gasto'}
                </span>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // Inicializar gráficas
    setTimeout(() => {
      Charts.renderDashboardComparison('chart-dash-comparison');
      Charts.renderCategoryDoughnut('chart-dash-category');
    }, 50);
  },

  // 4. Render Ingresos y Gastos
  renderTransactionsView(type) {
    const isIncome = type === 'ingreso';
    const titleEl = document.getElementById(`${type}-view-title`);
    if (titleEl) titleEl.textContent = isIncome ? 'Gestión de Ingresos' : 'Gestión de Gastos';

    const searchInput = document.getElementById(`${type}-search-input`);
    const categorySelect = document.getElementById(`${type}-category-filter`);

    const filter = {
      type: type,
      search: searchInput ? searchInput.value : '',
      categoryId: categorySelect ? categorySelect.value : ''
    };

    const txs = Storage.getTransactions(filter);

    // Llenar select de filtro de categoría
    if (categorySelect && categorySelect.options.length <= 1) {
      const cats = Storage.getCategories(type);
      cats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        categorySelect.appendChild(opt);
      });
    }

    // Renderizar tabla
    const tbody = document.getElementById(`${type}-tbody`);
    if (!tbody) return;

    if (!txs.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding: 40px; color: var(--muted);">
            <div style="font-size:1.1rem; font-weight:700; margin-bottom:6px;">No se encontraron registros</div>
            <p style="margin:0;">Registra un nuevo ${type} haciendo clic en el botón superior.</p>
          </td>
        </tr>
      `;
      return;
    }

    // Paginación
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const paginatedTxs = txs.slice(startIndex, startIndex + this.pageSize);

    tbody.innerHTML = paginatedTxs.map(t => {
      const cat = Storage.getCategoryById(t.categoryId);
      return `
        <tr>
          <td style="font-family:var(--font-mono); font-weight:600;">${t.date}</td>
          <td>${this.escapeHtml(t.description)}</td>
          <td><span class="badge-3d" style="border-color:${cat.color}; color:${cat.color}">${this.escapeHtml(cat.name)}</span></td>
          <td style="font-weight:700; font-family:var(--font-mono); color:${isIncome ? 'var(--success)' : 'var(--danger)'}">
            ${Storage.formatCOP(t.amount)}
          </td>
          <td style="text-align:right;">
            <button class="btn-3d btn-3d--secondary btn-3d--sm" onclick="App.openEditTransactionModal('${t.id}')">Editar</button>
            <button class="btn-3d btn-3d--danger btn-3d--sm" onclick="App.confirmDeleteTransaction('${t.id}')">Eliminar</button>
          </td>
        </tr>
      `;
    }).join('');

    // Actualizar paginador
    this.renderPagination(`${type}-pagination`, txs.length);
  },

  // 5. Render Presupuestos
  renderBudgetsView() {
    const budgets = Storage.getBudgets();
    const container = document.getElementById('budgets-cards-container');
    if (!container) return;

    if (!budgets.length) {
      container.innerHTML = `
        <div class="card-3d" style="grid-column: 1/-1; text-align:center; padding: 40px;">
          <h3>No hay presupuestos activos este mes</h3>
          <p style="color:var(--muted)">Establece límites de gastos por categoría para mantener tus finanzas bajo control.</p>
          <button class="btn-3d" onclick="App.openAddBudgetModal()">+ Crear Presupuesto</button>
        </div>
      `;
      return;
    }

    container.innerHTML = budgets.map(b => {
      const isOver = b.spentAmount > b.limitAmount;
      const isWarning = b.percentage >= 80 && !isOver;
      let badgeClass = 'badge-3d--success';
      let progressClass = '';

      if (isOver) {
        badgeClass = 'badge-3d--danger';
        progressClass = 'progress-3d-fill--danger';
      } else if (isWarning) {
        badgeClass = 'badge-3d--warning';
        progressClass = 'progress-3d-fill--warning';
      }

      return `
        <div class="card-3d">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
            <div>
              <span class="badge-3d" style="border-color:${b.categoryColor}; color:${b.categoryColor}">${this.escapeHtml(b.categoryName)}</span>
              <h3 style="margin:10px 0 4px; font-family:var(--font-head); font-size:1.3rem;">
                ${Storage.formatCOP(b.spentAmount)} <span style="font-size:0.85rem; color:var(--muted); font-weight:normal;">/ ${Storage.formatCOP(b.limitAmount)}</span>
              </h3>
            </div>
            <span class="badge-3d ${badgeClass}">
              ${isOver ? 'Sobregirado ' : ''}${b.percentage}%
            </span>
          </div>

          <div class="progress-3d" style="margin-bottom:12px;">
            <div class="progress-3d-fill ${progressClass}" style="width: ${Math.min(100, b.percentage)}%"></div>
          </div>

          <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--muted); font-family:var(--font-mono);">
            <span>Restante: ${Storage.formatCOP(b.remainingAmount)}</span>
            <button class="btn-3d btn-3d--secondary btn-3d--sm" onclick="App.openEditBudgetModal('${b.categoryId}', ${b.limitAmount})">Ajustar Límite</button>
          </div>
        </div>
      `;
    }).join('');
  },

  // 6. Render Metas de Ahorro
  renderSavingsView() {
    const savings = Storage.getSavings();
    const container = document.getElementById('savings-cards-container');
    if (!container) return;

    if (!savings.length) {
      container.innerHTML = `
        <div class="card-3d" style="grid-column: 1/-1; text-align:center; padding: 40px;">
          <h3>Aún no has creado metas de ahorro</h3>
          <p style="color:var(--muted)">Define tus objetivos (vacaciones, fondo de emergencia, compras) y haz seguimiento de tu progreso.</p>
          <button class="btn-3d" onclick="App.openAddSavingModal()">+ Nueva Meta de Ahorro</button>
        </div>
      `;
      return;
    }

    container.innerHTML = savings.map(s => {
      return `
        <div class="card-3d">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
            <div>
              <span class="badge-3d badge-3d--accent">Meta de Ahorro</span>
              <h3 style="margin:10px 0 4px; font-family:var(--font-head); font-size:1.25rem;">${this.escapeHtml(s.name)}</h3>
              <p style="margin:0; font-size:0.82rem; color:var(--muted);">${this.escapeHtml(s.notes || 'Sin notas adicionales')}</p>
            </div>
            <span class="badge-3d badge-3d--success">${s.percentage}%</span>
          </div>

          <div style="margin:16px 0;">
            <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:6px;">
              <strong style="color:var(--accent-text); font-family:var(--font-mono);">${Storage.formatCOP(s.currentAmount)}</strong>
              <span style="color:var(--muted); font-family:var(--font-mono);">${Storage.formatCOP(s.targetAmount)}</span>
            </div>
            <div class="progress-3d">
              <div class="progress-3d-fill" style="width: ${s.percentage}%"></div>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; color:var(--muted); border-top:1px solid var(--border); padding-top:12px;">
            <span>Fecha objetivo: ${s.targetDate || 'Sin fecha fija'}</span>
            <div style="display:flex; gap:6px;">
              <button class="btn-3d btn-3d--sm" onclick="App.openDepositSavingModal('${s.id}', '${this.escapeHtml(s.name)}')">+ Abonar</button>
              <button class="btn-3d btn-3d--danger btn-3d--sm" onclick="App.confirmDeleteSaving('${s.id}')">Eliminar</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // 7. Render Reportes y Estadísticas
  renderReportsView() {
    const analytics = Storage.getAnalytics();

    const expMeanEl = document.getElementById('report-exp-mean');
    const expMedianEl = document.getElementById('report-exp-median');
    const incMeanEl = document.getElementById('report-inc-mean');
    const incMedianEl = document.getElementById('report-inc-median');

    if (expMeanEl) expMeanEl.textContent = Storage.formatCOP(analytics.expenseMean);
    if (expMedianEl) expMedianEl.textContent = Storage.formatCOP(analytics.expenseMedian);
    if (incMeanEl) incMeanEl.textContent = Storage.formatCOP(analytics.incomeMean);
    if (incMedianEl) incMedianEl.textContent = Storage.formatCOP(analytics.incomeMedian);

    setTimeout(() => {
      Charts.renderReportsTrend('chart-reports-trend');
    }, 50);
  },

  // 8. Render Grupos Familiares
  renderFamilyView() {
    const families = JSON.parse(localStorage.getItem(Storage.KEYS.FAMILY) || '[]');
    const container = document.getElementById('family-container');
    if (!container) return;

    if (!families.length) {
      container.innerHTML = `<div class="card-3d" style="text-align:center; padding:40px;">No perteneces a ningún grupo familiar aún.</div>`;
      return;
    }

    const fam = families[0];
    container.innerHTML = `
      <div class="card-3d" style="margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <div>
            <h3 style="margin:0; font-size:1.4rem;">${this.escapeHtml(fam.name)}</h3>
            <p style="margin:4px 0 0; color:var(--muted); font-size:0.85rem;">Gestión compartida de presupuestos y registros familiares</p>
          </div>
          <button class="btn-3d btn-3d--sm" onclick="App.openAddFamilyMemberModal()">+ Invitar Miembro</button>
        </div>

        <div class="table-container">
          <table class="table-3d">
            <thead>
              <tr>
                <th>Miembro</th>
                <th>Rol Asignado</th>
                <th>Permisos</th>
              </tr>
            </thead>
            <tbody>
              ${fam.members.map(m => `
                <tr>
                  <td><strong>${this.escapeHtml(m.name)}</strong></td>
                  <td><span class="badge-3d badge-3d--accent">${m.role.toUpperCase()}</span></td>
                  <td style="color:var(--muted); font-size:0.82rem;">
                    ${m.role === 'admin' ? 'Control total, gestión de usuarios y ajustes' : (m.role === 'editor' ? 'Registro, edición de movimientos y presupuestos' : 'Solo lectura de saldos y reportes')}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 9. Render Perfil de Usuario
  renderProfileView() {
    const session = Storage.getSession();
    if (!session || !session.user) return;

    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const roleBadge = document.getElementById('profile-role-badge');

    if (nameInput) nameInput.value = session.user.name;
    if (emailInput) emailInput.value = session.user.email;
    if (roleBadge) roleBadge.textContent = session.user.role.toUpperCase();
  },

  // Paginador
  renderPagination(elementId, totalItems) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const totalPages = Math.ceil(totalItems / this.pageSize);
    if (totalPages <= 1) {
      el.innerHTML = '';
      return;
    }

    el.innerHTML = `
      <div style="display:flex; justify-content:center; align-items:center; gap:8px; margin-top:16px;">
        <button class="btn-3d btn-3d--secondary btn-3d--sm" ${this.currentPage === 1 ? 'disabled' : ''} onclick="App.changePage(${this.currentPage - 1})">« Anterior</button>
        <span style="font-family:var(--font-mono); font-size:0.8rem; color:var(--muted);">Página ${this.currentPage} de ${totalPages}</span>
        <button class="btn-3d btn-3d--secondary btn-3d--sm" ${this.currentPage === totalPages ? 'disabled' : ''} onclick="App.changePage(${this.currentPage + 1})">Siguiente »</button>
      </div>
    `;
  },

  changePage(newPage) {
    this.currentPage = newPage;
    this.renderCurrentView();
  },

  // MODALES & TOASTS
  bindModals() {
    // Cerrar modal al hacer clic en backdrop o botón de cerrar
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', e => {
        if (e.target === modal) this.closeAllModals();
      });
    });
  },

  closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.style.display = 'none');
  },

  showModal(modalId) {
    this.closeAllModals();
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'grid';
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <div style="flex:1;">
        <strong>${type === 'success' ? 'Éxito' : (type === 'danger' ? 'Atención' : (type === 'warning' ? 'Aviso' : 'Información'))}</strong>
        <p style="margin:2px 0 0; color:var(--muted); font-size:0.82rem;">${this.escapeHtml(message)}</p>
      </div>
      <button style="background:none; border:none; color:var(--muted); cursor:pointer; font-size:1.1rem;" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 4500);
  },

  // Confirmación destructiva accesible
  confirmModal(title, message, onConfirm) {
    const modal = document.getElementById('modal-confirm');
    if (!modal) return;

    document.getElementById('modal-confirm-title').textContent = title;
    document.getElementById('modal-confirm-message').textContent = message;

    const confirmBtn = document.getElementById('modal-confirm-btn');
    confirmBtn.onclick = () => {
      this.closeAllModals();
      onConfirm();
    };

    this.showModal('modal-confirm');
  },

  // ACCIONES CRUD DESDE MODALES
  openAddTransactionModal(type) {
    const modal = document.getElementById('modal-transaction');
    document.getElementById('modal-tx-title').textContent = type === 'ingreso' ? 'Registrar Ingreso' : 'Registrar Gasto';
    document.getElementById('tx-id').value = '';
    document.getElementById('tx-type').value = type;
    document.getElementById('tx-amount').value = '';
    document.getElementById('tx-desc').value = '';
    document.getElementById('tx-date').value = new Date().toISOString().slice(0, 10);

    // Llenar select de categorías
    const catSelect = document.getElementById('tx-category');
    catSelect.innerHTML = Storage.getCategories(type).map(c => `
      <option value="${c.id}">${this.escapeHtml(c.name)}</option>
    `).join('');

    this.showModal('modal-transaction');
  },

  openEditTransactionModal(id) {
    const tx = Storage.getTransactions().find(t => t.id === id);
    if (!tx) return;

    document.getElementById('modal-tx-title').textContent = tx.type === 'ingreso' ? 'Editar Ingreso' : 'Editar Gasto';
    document.getElementById('tx-id').value = tx.id;
    document.getElementById('tx-type').value = tx.type;
    document.getElementById('tx-amount').value = tx.amount;
    document.getElementById('tx-desc').value = tx.description;
    document.getElementById('tx-date').value = tx.date;

    const catSelect = document.getElementById('tx-category');
    catSelect.innerHTML = Storage.getCategories(tx.type).map(c => `
      <option value="${c.id}" ${c.id === tx.categoryId ? 'selected' : ''}>${this.escapeHtml(c.name)}</option>
    `).join('');

    this.showModal('modal-transaction');
  },

  saveTransactionForm(e) {
    e.preventDefault();
    const id = document.getElementById('tx-id').value;
    const type = document.getElementById('tx-type').value;
    const amount = parseFloat(document.getElementById('tx-amount').value);
    const categoryId = document.getElementById('tx-category').value;
    const description = document.getElementById('tx-desc').value;
    const date = document.getElementById('tx-date').value;

    if (!amount || amount <= 0) {
      this.showToast('El monto debe ser superior a cero.', 'danger');
      return;
    }

    if (!description.trim()) {
      this.showToast('Debes ingresar una descripción.', 'danger');
      return;
    }

    let res;
    if (id) {
      res = Storage.updateTransaction(id, { type, amount, categoryId, description, date });
    } else {
      res = Storage.addTransaction({ type, amount, categoryId, description, date });
    }

    if (res.success) {
      this.closeAllModals();
      this.showToast(id ? 'Movimiento actualizado correctamente.' : 'Movimiento registrado con éxito.', 'success');
      this.renderCurrentView();
    } else {
      this.showToast(res.message, 'danger');
    }
  },

  confirmDeleteTransaction(id) {
    this.confirmModal(
      '¿Eliminar movimiento?',
      'Esta acción no se puede deshacer y ajustará tus balances y reportes.',
      () => {
        const res = Storage.deleteTransaction(id);
        if (res.success) {
          this.showToast('Movimiento eliminado.', 'info');
          this.renderCurrentView();
        } else {
          this.showToast(res.message, 'danger');
        }
      }
    );
  },

  // Presupuesto Modal
  openAddBudgetModal() {
    const catSelect = document.getElementById('budget-category');
    catSelect.innerHTML = Storage.getCategories('gasto').map(c => `
      <option value="${c.id}">${this.escapeHtml(c.name)}</option>
    `).join('');
    document.getElementById('budget-limit').value = '';
    this.showModal('modal-budget');
  },

  openEditBudgetModal(categoryId, currentLimit) {
    this.openAddBudgetModal();
    document.getElementById('budget-category').value = categoryId;
    document.getElementById('budget-limit').value = currentLimit;
  },

  saveBudgetForm(e) {
    e.preventDefault();
    const categoryId = document.getElementById('budget-category').value;
    const limit = parseFloat(document.getElementById('budget-limit').value);

    if (!limit || limit <= 0) {
      this.showToast('El límite presupuestado debe ser mayor a cero.', 'danger');
      return;
    }

    const res = Storage.setBudget(categoryId, limit);
    if (res.success) {
      this.closeAllModals();
      this.showToast('Presupuesto configurado con éxito.', 'success');
      this.renderCurrentView();
    } else {
      this.showToast(res.message, 'danger');
    }
  },

  // Metas de Ahorro Modal
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
      this.showToast('Meta de ahorro creada.', 'success');
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
