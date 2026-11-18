/**
 * MONEYTRACK · Data & Storage Layer
 * Persistencia estructurada local con soporte de registro de usuarios,
 * rol de Administrador, presupuestos, metas de ahorro y categorías.
 * Moneda: Pesos Colombianos (COP).
 */

const Storage = {
  KEYS: {
    USERS: 'mt_users',
    TRANSACTIONS: 'mt_transactions',
    CATEGORIES: 'mt_categories',
    BUDGETS: 'mt_budgets',
    SAVINGS: 'mt_savings',
    FAMILY: 'mt_family_groups',
    SESSION: 'mt_session',
    PREFERENCES: 'mt_preferences'
  },

  // Inicializar almacén con datos por defecto si está vacío
  init() {
    if (!localStorage.getItem(this.KEYS.USERS)) {
      this.seedInitialData();
    }
  },

  // Semilla de datos iniciales
  seedInitialData() {
    const defaultUsers = [
      {
        id: 'usr_admin',
        name: 'Karen Suárez',
        email: 'admin@moneytrack.com',
        pin: '123456',
        role: 'admin',
        failedAttempts: 0,
        lockedUntil: null,
        createdAt: '2026-11-01'
      }
    ];

    const defaultCategories = [
      { id: 'cat_salario', name: 'Salario / Nómina', type: 'ingreso', icon: 'i-cash', color: '#10B981' },
      { id: 'cat_freelance', name: 'Honorarios / Freelance', type: 'ingreso', icon: 'i-briefcase', color: '#38BDF8' },
      { id: 'cat_inversiones', name: 'Rendimientos e Inversiones', type: 'ingreso', icon: 'i-trending', color: '#6366F1' },
      { id: 'cat_otros_ing', name: 'Otros Ingresos', type: 'ingreso', icon: 'i-plus', color: '#A855F7' },
      
      { id: 'cat_alimentacion', name: 'Alimentación y Supermercado', type: 'gasto', icon: 'i-cart', color: '#F59E0B' },
      { id: 'cat_vivienda', name: 'Vivienda y Servicios', type: 'gasto', icon: 'i-home', color: '#EF4444' },
      { id: 'cat_transporte', name: 'Transporte y Movilidad', type: 'gasto', icon: 'i-truck', color: '#F97316' },
      { id: 'cat_salud', name: 'Salud y Bienestar', type: 'gasto', icon: 'i-heart', color: '#EC4899' },
      { id: 'cat_educacion', name: 'Educación y Cursos', type: 'gasto', icon: 'i-book', color: '#8B5CF6' },
      { id: 'cat_ocio', name: 'Ocio y Entretenimiento', type: 'gasto', icon: 'i-film', color: '#06B6D4' },
      { id: 'cat_otros_gas', name: 'Gastos Varios', type: 'gasto', icon: 'i-tag', color: '#64748B' }
    ];

    const today = new Date().toISOString().slice(0, 10);
    const defaultTransactions = [
      {
        id: 'tx_1',
        userId: 'usr_admin',
        type: 'ingreso',
        categoryId: 'cat_salario',
        amount: 3800000,
        description: 'Pago de nómina primera quincena',
        date: today,
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_2',
        userId: 'usr_admin',
        type: 'ingreso',
        categoryId: 'cat_freelance',
        amount: 850000,
        description: 'Desarrollo web proyecto independiente',
        date: today,
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_3',
        userId: 'usr_admin',
        type: 'gasto',
        categoryId: 'cat_vivienda',
        amount: 1100000,
        description: 'Arriendo mensual apartamento',
        date: today,
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_4',
        userId: 'usr_admin',
        type: 'gasto',
        categoryId: 'cat_alimentacion',
        amount: 450000,
        description: 'Mercado quincenal Éxito',
        date: today,
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_5',
        userId: 'usr_admin',
        type: 'gasto',
        categoryId: 'cat_transporte',
        amount: 140000,
        description: 'Gasolina y pasajes de transporte',
        date: today,
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_6',
        userId: 'usr_admin',
        type: 'gasto',
        categoryId: 'cat_ocio',
        amount: 120000,
        description: 'Cena familiar fin de semana',
        date: today,
        createdAt: new Date().toISOString()
      }
    ];

    const currentMonth = today.slice(0, 7);
    const defaultBudgets = [
      { id: 'bdg_1', userId: 'usr_admin', categoryId: 'cat_alimentacion', month: currentMonth, limitAmount: 700000 },
      { id: 'bdg_2', userId: 'usr_admin', categoryId: 'cat_vivienda', month: currentMonth, limitAmount: 1200000 },
      { id: 'bdg_3', userId: 'usr_admin', categoryId: 'cat_transporte', month: currentMonth, limitAmount: 250000 },
      { id: 'bdg_4', userId: 'usr_admin', categoryId: 'cat_ocio', month: currentMonth, limitAmount: 200000 }
    ];

    const defaultSavings = [
      {
        id: 'svg_1',
        userId: 'usr_admin',
        name: 'Fondo de Emergencia (6 meses)',
        targetAmount: 5000000,
        currentAmount: 2850000,
        targetDate: '2026-12-31',
        notes: 'Ahorro para imprevistos de salud o laborales'
      },
      {
        id: 'svg_2',
        userId: 'usr_admin',
        name: 'Vacaciones Fin de Año',
        targetAmount: 2000000,
        currentAmount: 1300000,
        targetDate: '2026-12-15',
        notes: 'Viaje a la Costa Atlántica'
      }
    ];

    const defaultFamily = [
      {
        id: 'fam_1',
        name: 'Hogar Suárez & Familia',
        createdBy: 'usr_admin',
        members: [
          { userId: 'usr_admin', name: 'Karen Suárez', role: 'admin' }
        ]
      }
    ];

    localStorage.setItem(this.KEYS.USERS, JSON.stringify(defaultUsers));
    localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(defaultCategories));
    localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify(defaultTransactions));
    localStorage.setItem(this.KEYS.BUDGETS, JSON.stringify(defaultBudgets));
    localStorage.setItem(this.KEYS.SAVINGS, JSON.stringify(defaultSavings));
    localStorage.setItem(this.KEYS.FAMILY, JSON.stringify(defaultFamily));
    
    // Iniciar sesión por defecto con usr_admin
    this.startSession(defaultUsers[0]);
  },

  // Formato estándar Moneda Colombiana (COP)
  formatCOP(amount) {
    const num = Number(amount) || 0;
    return '$ ' + Math.round(num).toLocaleString('es-CO') + ' COP';
  },

  formatCOPShort(amount) {
    const num = Number(amount) || 0;
    return '$ ' + Math.round(num).toLocaleString('es-CO');
  },

  // SESIÓN Y AUTENTICACIÓN
  getSession() {
    const raw = localStorage.getItem(this.KEYS.SESSION);
    if (!raw) return null;
    const session = JSON.parse(raw);

    // Timeout por inactividad: 30 minutos (1800000 ms)
    const now = Date.now();
    const INACTIVITY_LIMIT = 30 * 60 * 1000;
    const MAX_SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 horas deslizantes

    if (now - session.lastActivity > INACTIVITY_LIMIT) {
      this.clearSession();
      return { expired: true, reason: 'inactivity' };
    }

    if (now - session.sessionStart > MAX_SESSION_DURATION) {
      this.clearSession();
      return { expired: true, reason: 'duration' };
    }

    // Actualizar actividad deslizante
    session.lastActivity = now;
    localStorage.setItem(this.KEYS.SESSION, JSON.stringify(session));
    return session;
  },

  startSession(user) {
    const now = Date.now();
    const session = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'admin'
      },
      sessionStart: now,
      lastActivity: now
    };
    localStorage.setItem(this.KEYS.SESSION, JSON.stringify(session));
    return session;
  },

  clearSession() {
    localStorage.removeItem(this.KEYS.SESSION);
  },

  // Login con control de 5 intentos fallidos y bloqueo
  login(email, pin) {
    const users = JSON.parse(localStorage.getItem(this.KEYS.USERS) || '[]');
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.trim().toLowerCase());

    if (userIndex === -1) {
      return { success: false, message: 'Usuario no encontrado en el sistema. Puedes hacer clic en "Registrarse" para crear tu cuenta.' };
    }

    const user = users[userIndex];
    const now = Date.now();

    // Comprobar si la cuenta está bloqueada temporalmente
    if (user.lockedUntil && now < user.lockedUntil) {
      const remainingMin = Math.ceil((user.lockedUntil - now) / 60000);
      return {
        success: false,
        message: `Cuenta bloqueada temporalmente por seguridad. Intenta de nuevo en ${remainingMin} minuto(s).`
      };
    }

    // Validación de clave/PIN
    if (user.pin !== pin) {
      user.failedAttempts = (user.failedAttempts || 0) + 1;
      if (user.failedAttempts >= 5) {
        user.lockedUntil = now + (15 * 60 * 1000); // 15 minutos de bloqueo
        user.failedAttempts = 0;
        users[userIndex] = user;
        localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
        return {
          success: false,
          message: 'Has superado 5 intentos fallidos. Tu cuenta ha sido bloqueada temporalmente por 15 minutos.'
        };
      }
      users[userIndex] = user;
      localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
      const remainingAttempts = 5 - user.failedAttempts;
      return {
        success: false,
        message: `Credenciales incorrectas. Te quedan ${remainingAttempts} intento(s) antes del bloqueo.`
      };
    }

    // Éxito: resetear intentos fallidos y arrancar sesión
    user.failedAttempts = 0;
    user.lockedUntil = null;
    user.role = 'admin';
    users[userIndex] = user;
    localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));

    this.startSession(user);
    return { success: true, user };
  },

  // REGISTRO DE NUEVO USUARIO (Con rol Administrador de su cuenta)
  register(name, email, pin) {
    const users = JSON.parse(localStorage.getItem(this.KEYS.USERS) || '[]');
    if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
      return { success: false, message: 'El correo electrónico ya se encuentra registrado. Inicia sesión con tus credenciales.' };
    }

    if (!name || name.trim().length < 3) {
      return { success: false, message: 'Por favor ingresa tu nombre completo.' };
    }

    if (!pin || pin.length < 6) {
      return { success: false, message: 'La contraseña o PIN debe contener al menos 6 caracteres.' };
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      name: name.trim(),
      email: email.trim(),
      pin: pin,
      role: 'admin',
      failedAttempts: 0,
      lockedUntil: null,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    users.push(newUser);
    localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
    this.startSession(newUser);
    return { success: true, user: newUser };
  },

  // CRUD TRANSACCIONES (INGRESOS Y GASTOS)
  getTransactions(filter = {}) {
    const txs = JSON.parse(localStorage.getItem(this.KEYS.TRANSACTIONS) || '[]');
    const session = this.getSession();
    const currentUserId = session && session.user ? session.user.id : null;

    return txs.filter(t => {
      // Filtrar por propietario actual
      if (currentUserId && t.userId && t.userId !== currentUserId && currentUserId !== 'usr_admin') {
        return false;
      }
      if (filter.type && t.type !== filter.type) return false;
      if (filter.categoryId && t.categoryId !== filter.categoryId) return false;
      if (filter.startDate && t.date < filter.startDate) return false;
      if (filter.endDate && t.date > filter.endDate) return false;
      if (filter.search) {
        const q = filter.search.toLowerCase();
        return t.description.toLowerCase().includes(q);
      }
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  addTransaction(data) {
    const session = this.getSession();
    if (!session || !session.user) return { success: false, message: 'Sesión no válida.' };

    const txs = JSON.parse(localStorage.getItem(this.KEYS.TRANSACTIONS) || '[]');
    const newTx = {
      id: 'tx_' + Date.now(),
      userId: session.user.id,
      type: data.type, // 'ingreso' o 'gasto'
      categoryId: data.categoryId,
      amount: parseFloat(data.amount) || 0,
      description: data.description.trim(),
      date: data.date || new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString()
    };

    txs.unshift(newTx);
    localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify(txs));
    return { success: true, transaction: newTx };
  },

  updateTransaction(id, data) {
    const session = this.getSession();
    if (!session || !session.user) return { success: false, message: 'Sesión no válida.' };

    const txs = JSON.parse(localStorage.getItem(this.KEYS.TRANSACTIONS) || '[]');
    const index = txs.findIndex(t => t.id === id);
    if (index === -1) return { success: false, message: 'Movimiento no encontrado.' };

    txs[index] = {
      ...txs[index],
      type: data.type || txs[index].type,
      categoryId: data.categoryId || txs[index].categoryId,
      amount: parseFloat(data.amount) || txs[index].amount,
      description: data.description !== undefined ? data.description.trim() : txs[index].description,
      date: data.date || txs[index].date
    };

    localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify(txs));
    return { success: true, transaction: txs[index] };
  },

  deleteTransaction(id) {
    const session = this.getSession();
    if (!session || !session.user) return { success: false, message: 'Sesión no válida.' };

    let txs = JSON.parse(localStorage.getItem(this.KEYS.TRANSACTIONS) || '[]');
    const tx = txs.find(t => t.id === id);
    if (!tx) return { success: false, message: 'Movimiento no encontrado.' };

    txs = txs.filter(t => t.id !== id);
    localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify(txs));
    return { success: true };
  },

  // CATEGORÍAS
  getCategories(type = null) {
    const cats = JSON.parse(localStorage.getItem(this.KEYS.CATEGORIES) || '[]');
    if (!type) return cats;
    return cats.filter(c => c.type === type);
  },

  getCategoryById(id) {
    const cats = this.getCategories();
    return cats.find(c => c.id === id) || { name: 'Sin Categoría', color: '#64748B' };
  },

  // PRESUPUESTOS Y CUMPLIMIENTO
  getBudgets(month = null) {
    const currentMonth = month || new Date().toISOString().slice(0, 7);
    const budgets = JSON.parse(localStorage.getItem(this.KEYS.BUDGETS) || '[]');
    const txs = this.getTransactions({ type: 'gasto' });

    return budgets
      .filter(b => b.month === currentMonth)
      .map(b => {
        // Calcular gasto real en este mes para la categoría
        const spent = txs
          .filter(t => t.categoryId === b.categoryId && t.date.startsWith(currentMonth))
          .reduce((sum, t) => sum + t.amount, 0);

        const percentage = b.limitAmount > 0 ? (spent / b.limitAmount) * 100 : 0;
        const category = this.getCategoryById(b.categoryId);

        return {
          ...b,
          categoryName: category.name,
          categoryColor: category.color,
          spentAmount: spent,
          remainingAmount: b.limitAmount - spent,
          percentage: Math.round(percentage),
          isOverbudget: spent > b.limitAmount
        };
      });
  },

  setBudget(categoryId, limitAmount, month = null) {
    const session = this.getSession();
    if (!session || !session.user) return { success: false, message: 'Sesión no válida.' };

    const currentMonth = month || new Date().toISOString().slice(0, 7);
    const budgets = JSON.parse(localStorage.getItem(this.KEYS.BUDGETS) || '[]');
    const existingIndex = budgets.findIndex(b => b.categoryId === categoryId && b.month === currentMonth);

    if (existingIndex >= 0) {
      budgets[existingIndex].limitAmount = parseFloat(limitAmount);
    } else {
      budgets.push({
        id: 'bdg_' + Date.now(),
        userId: session.user.id,
        categoryId: categoryId,
        month: currentMonth,
        limitAmount: parseFloat(limitAmount)
      });
    }

    localStorage.setItem(this.KEYS.BUDGETS, JSON.stringify(budgets));
    return { success: true };
  },

  // METAS DE AHORRO
  getSavings() {
    const savings = JSON.parse(localStorage.getItem(this.KEYS.SAVINGS) || '[]');
    return savings.map(s => {
      const percentage = s.targetAmount > 0 ? (s.currentAmount / s.targetAmount) * 100 : 0;
      return {
        ...s,
        percentage: Math.min(100, Math.round(percentage)),
        remainingAmount: Math.max(0, s.targetAmount - s.currentAmount)
      };
    });
  },

  addSavingGoal(data) {
    const session = this.getSession();
    if (!session || !session.user) return { success: false, message: 'Sesión no válida.' };

    const savings = JSON.parse(localStorage.getItem(this.KEYS.SAVINGS) || '[]');
    const newGoal = {
      id: 'svg_' + Date.now(),
      userId: session.user.id,
      name: data.name.trim(),
      targetAmount: parseFloat(data.targetAmount) || 0,
      currentAmount: parseFloat(data.currentAmount) || 0,
      targetDate: data.targetDate || '',
      notes: data.notes ? data.notes.trim() : ''
    };

    savings.push(newGoal);
    localStorage.setItem(this.KEYS.SAVINGS, JSON.stringify(savings));
    return { success: true, goal: newGoal };
  },

  depositToSaving(id, amount) {
    const savings = JSON.parse(localStorage.getItem(this.KEYS.SAVINGS) || '[]');
    const index = savings.findIndex(s => s.id === id);
    if (index === -1) return { success: false, message: 'Meta no encontrada.' };

    savings[index].currentAmount += parseFloat(amount) || 0;
    localStorage.setItem(this.KEYS.SAVINGS, JSON.stringify(savings));
    return { success: true, goal: savings[index] };
  },

  deleteSavingGoal(id) {
    const session = this.getSession();
    if (!session || !session.user) {
      return { success: false, message: 'Sesión no válida.' };
    }

    let savings = JSON.parse(localStorage.getItem(this.KEYS.SAVINGS) || '[]');
    savings = savings.filter(s => s.id !== id);
    localStorage.setItem(this.KEYS.SAVINGS, JSON.stringify(savings));
    return { success: true };
  },

  // RESUMEN KPI DASHBOARD
  getDashboardKPIs() {
    const txs = this.getTransactions();
    const currentMonth = new Date().toISOString().slice(0, 7);

    const monthTxs = txs.filter(t => t.date.startsWith(currentMonth));
    const totalIncomes = monthTxs.filter(t => t.type === 'ingreso').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = monthTxs.filter(t => t.type === 'gasto').reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncomes - totalExpenses;

    const budgets = this.getBudgets(currentMonth);
    const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.limitAmount, 0);
    const totalBudgetSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
    const budgetCompliance = totalBudgetLimit > 0 ? Math.round((totalBudgetSpent / totalBudgetLimit) * 100) : 0;

    const savings = this.getSavings();
    const totalSavingTarget = savings.reduce((sum, s) => sum + s.targetAmount, 0);
    const totalSavingCurrent = savings.reduce((sum, s) => sum + s.currentAmount, 0);
    const savingsProgress = totalSavingTarget > 0 ? Math.round((totalSavingCurrent / totalSavingTarget) * 100) : 0;

    return {
      totalIncomes,
      totalExpenses,
      balance,
      budgetCompliance,
      savingsProgress,
      recentTransactions: txs.slice(0, 7)
    };
  },

  // ANALÍTICA Y REPORTES (Media, Mediana, Agrupación)
  getAnalytics(period = 'month') {
    const txs = this.getTransactions();
    const expenseAmounts = txs.filter(t => t.type === 'gasto').map(t => t.amount).sort((a, b) => a - b);
    const incomeAmounts = txs.filter(t => t.type === 'ingreso').map(t => t.amount).sort((a, b) => a - b);

    const calcMean = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const calcMedian = arr => {
      if (!arr.length) return 0;
      const mid = Math.floor(arr.length / 2);
      return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
    };

    // Gastos agrupados por categoría
    const expensesByCategory = {};
    txs.filter(t => t.type === 'gasto').forEach(t => {
      const cat = this.getCategoryById(t.categoryId);
      expensesByCategory[cat.name] = (expensesByCategory[cat.name] || 0) + t.amount;
    });

    return {
      expenseMean: Math.round(calcMean(expenseAmounts)),
      expenseMedian: Math.round(calcMedian(expenseAmounts)),
      incomeMean: Math.round(calcMean(incomeAmounts)),
      incomeMedian: Math.round(calcMedian(incomeAmounts)),
      expensesByCategory
    };
  }
};

// Auto-inicializar almacenamiento
Storage.init();
