/**
 * MONEYTRACK · Data & Storage Layer
 * Persistencia estructurada local con soporte completo de:
 * - Autenticación y aislamiento de sesión
 * - Ingresos y Gastos (COP)
 * - Módulo "Me Deben / Debo" (Préstamos Personales y Abonos)
 * - Calendario Financiero Interactivo
 * - Simulador "¿Puedo Permitírmelo?" (Asesor de Compras)
 * - Diagnóstico de Salud Financiera (Score 1 a 100)
 * - Gestor de Categorías Personalizadas
 * - Grupo Familiar sin valores predeterminados
 * - Gamificación y Retos de Ahorro (30 días y Medallas)
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
    PREFERENCES: 'mt_preferences',
    LOANS: 'mt_loans',
    CHALLENGES: 'mt_savings_challenges'
  },

  // Inicializar almacén con estructura base limpia
  init() {
    if (!localStorage.getItem(this.KEYS.USERS)) {
      this.seedInitialData();
    }
  },

  // Semilla de datos iniciales limpia (sin datos hardcodeados de personas)
  seedInitialData() {
    const defaultUsers = [];

    const defaultCategories = [
      { id: 'cat_salario', name: 'Salario / Nómina', type: 'ingreso', icon: 'i-cash', color: '#10B981', isCustom: false },
      { id: 'cat_freelance', name: 'Honorarios / Freelance', type: 'ingreso', icon: 'i-briefcase', color: '#38BDF8', isCustom: false },
      { id: 'cat_inversiones', name: 'Rendimientos e Inversiones', type: 'ingreso', icon: 'i-trending', color: '#6366F1', isCustom: false },
      { id: 'cat_otros_ing', name: 'Otros Ingresos', type: 'ingreso', icon: 'i-plus', color: '#A855F7', isCustom: false },
      
      { id: 'cat_alimentacion', name: 'Alimentación y Supermercado', type: 'gasto', icon: 'i-cart', color: '#F59E0B', isCustom: false },
      { id: 'cat_vivienda', name: 'Vivienda y Servicios', type: 'gasto', icon: 'i-home', color: '#EF4444', isCustom: false },
      { id: 'cat_transporte', name: 'Transporte y Movilidad', type: 'gasto', icon: 'i-truck', color: '#F97316', isCustom: false },
      { id: 'cat_salud', name: 'Salud y Bienestar', type: 'gasto', icon: 'i-heart', color: '#EC4899', isCustom: false },
      { id: 'cat_educacion', name: 'Educación y Cursos', type: 'gasto', icon: 'i-book', color: '#8B5CF6', isCustom: false },
      { id: 'cat_ocio', name: 'Ocio y Entretenimiento', type: 'gasto', icon: 'i-film', color: '#06B6D4', isCustom: false },
      { id: 'cat_otros_gas', name: 'Gastos Varios', type: 'gasto', icon: 'i-tag', color: '#64748B', isCustom: false }
    ];

    // Listas vacías para un inicio limpio y personal
    localStorage.setItem(this.KEYS.USERS, JSON.stringify(defaultUsers));
    localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(defaultCategories));
    localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify([]));
    localStorage.setItem(this.KEYS.BUDGETS, JSON.stringify([]));
    localStorage.setItem(this.KEYS.SAVINGS, JSON.stringify([]));
    localStorage.setItem(this.KEYS.FAMILY, JSON.stringify([]));
    localStorage.setItem(this.KEYS.LOANS, JSON.stringify([]));
    localStorage.setItem(this.KEYS.CHALLENGES, JSON.stringify({}));
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

  // =========================================================================
  // SESIÓN Y AUTENTICACIÓN
  // =========================================================================
  getSession() {
    const raw = localStorage.getItem(this.KEYS.SESSION);
    if (!raw) return null;
    let session;
    try {
      session = JSON.parse(raw);
    } catch (e) {
      return null;
    }

    const now = Date.now();
    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutos
    const MAX_SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 horas

    if (now - session.lastActivity > INACTIVITY_LIMIT) {
      this.clearSession();
      return { expired: true, reason: 'inactivity' };
    }

    if (now - session.sessionStart > MAX_SESSION_DURATION) {
      this.clearSession();
      return { expired: true, reason: 'duration' };
    }

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
        email: user.email
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

  login(email, pin) {
    const users = JSON.parse(localStorage.getItem(this.KEYS.USERS) || '[]');
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.trim().toLowerCase());

    if (userIndex === -1) {
      return { success: false, message: 'Usuario no encontrado en el sistema. Puedes hacer clic en "Registrarse" para crear tu cuenta personal.' };
    }

    const user = users[userIndex];
    const now = Date.now();

    if (user.lockedUntil && now < user.lockedUntil) {
      const remainingMin = Math.ceil((user.lockedUntil - now) / 60000);
      return {
        success: false,
        message: `Cuenta bloqueada temporalmente por seguridad. Intenta de nuevo en ${remainingMin} minuto(s).`
      };
    }

    if (user.pin !== pin) {
      user.failedAttempts = (user.failedAttempts || 0) + 1;
      if (user.failedAttempts >= 5) {
        user.lockedUntil = now + (15 * 60 * 1000);
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

    user.failedAttempts = 0;
    user.lockedUntil = null;
    users[userIndex] = user;
    localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));

    this.startSession(user);
    return { success: true, user };
  },

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
      failedAttempts: 0,
      lockedUntil: null,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    users.push(newUser);
    localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
    this.startSession(newUser);
    return { success: true, user: newUser };
  },

  // =========================================================================
  // CRUD TRANSACCIONES (INGRESOS Y GASTOS)
  // =========================================================================
  getTransactions(filter = {}) {
    const txs = JSON.parse(localStorage.getItem(this.KEYS.TRANSACTIONS) || '[]');
    const session = this.getSession();
    const currentUserId = session && session.user ? session.user.id : null;

    return txs.filter(t => {
      if (currentUserId && t.userId && t.userId !== currentUserId) {
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

    if (typeof SoundEngine !== 'undefined') {
      if (newTx.type === 'ingreso') SoundEngine.playCoin();
      else SoundEngine.playClick();
    }

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

  // =========================================================================
  // GESTIÓN DE CATEGORÍAS (PREDEFINIDAS + PERSONALIZADAS)
  // =========================================================================
  getCategories(type = null) {
    const cats = JSON.parse(localStorage.getItem(this.KEYS.CATEGORIES) || '[]');
    if (!type) return cats;
    return cats.filter(c => c.type === type);
  },

  getCategoryById(id) {
    const cats = this.getCategories();
    return cats.find(c => c.id === id) || { name: 'Sin Categoría', color: '#64748B', icon: 'i-tag' };
  },

  addCustomCategory(data) {
    const session = this.getSession();
    if (!session || !session.user) return { success: false, message: 'Sesión no válida.' };

    const name = (data.name || '').trim();
    if (!name) return { success: false, message: 'El nombre de la categoría es obligatorio.' };

    const cats = this.getCategories();
    if (cats.some(c => c.name.toLowerCase() === name.toLowerCase() && c.type === data.type)) {
      return { success: false, message: 'Ya existe una categoría con este nombre y tipo.' };
    }

    const newCat = {
      id: 'cat_custom_' + Date.now(),
      name: name,
      type: data.type === 'ingreso' ? 'ingreso' : 'gasto',
      icon: data.icon || 'i-tag',
      color: data.color || '#6C5CE7',
      isCustom: true,
      createdBy: session.user.id
    };

    cats.push(newCat);
    localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(cats));
    return { success: true, category: newCat };
  },

  deleteCategory(id) {
    const session = this.getSession();
    if (!session || !session.user) return { success: false, message: 'Sesión no válida.' };

    let cats = this.getCategories();
    const cat = cats.find(c => c.id === id);
    if (!cat) return { success: false, message: 'Categoría no encontrada.' };

    // Verificar si hay transacciones asociadas
    const txs = this.getTransactions();
    if (txs.some(t => t.categoryId === id)) {
      return { success: false, message: 'No puedes eliminar una categoría que contiene transacciones registradas.' };
    }

    cats = cats.filter(c => c.id !== id);
    localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(cats));
    return { success: true };
  },

  // =========================================================================
  // PRESUPUESTOS Y CUMPLIMIENTO
  // =========================================================================
  getBudgets(month = null) {
    const currentMonth = month || new Date().toISOString().slice(0, 7);
    const budgets = JSON.parse(localStorage.getItem(this.KEYS.BUDGETS) || '[]');
    const txs = this.getTransactions({ type: 'gasto' });

    return budgets
      .filter(b => b.month === currentMonth)
      .map(b => {
        const spent = txs
          .filter(t => t.categoryId === b.categoryId && t.date.startsWith(currentMonth))
          .reduce((sum, t) => sum + t.amount, 0);

        const percentage = b.limitAmount > 0 ? (spent / b.limitAmount) * 100 : 0;
        const category = this.getCategoryById(b.categoryId);

        return {
          ...b,
          categoryName: category.name,
          categoryColor: category.color,
          categoryIcon: category.icon,
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

  deleteBudget(id) {
    let budgets = JSON.parse(localStorage.getItem(this.KEYS.BUDGETS) || '[]');
    budgets = budgets.filter(b => b.id !== id);
    localStorage.setItem(this.KEYS.BUDGETS, JSON.stringify(budgets));
    return { success: true };
  },

  // =========================================================================
  // METAS DE AHORRO
  // =========================================================================
  getSavings() {
    const savings = JSON.parse(localStorage.getItem(this.KEYS.SAVINGS) || '[]');
    return savings.map(s => {
      const percentage = s.targetAmount > 0 ? (s.currentAmount / s.targetAmount) * 100 : 0;
      return {
        ...s,
        percentage: Math.min(100, Math.round(percentage)),
        remainingAmount: Math.max(0, s.targetAmount - s.currentAmount),
        isCompleted: s.currentAmount >= s.targetAmount
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

    if (typeof SoundEngine !== 'undefined') SoundEngine.playSuccess();
    return { success: true, goal: newGoal };
  },

  depositToSaving(id, amount) {
    const savings = JSON.parse(localStorage.getItem(this.KEYS.SAVINGS) || '[]');
    const index = savings.findIndex(s => s.id === id);
    if (index === -1) return { success: false, message: 'Meta no encontrada.' };

    const depositVal = parseFloat(amount) || 0;
    savings[index].currentAmount += depositVal;
    localStorage.setItem(this.KEYS.SAVINGS, JSON.stringify(savings));

    if (typeof SoundEngine !== 'undefined') {
      if (savings[index].currentAmount >= savings[index].targetAmount) {
        SoundEngine.playSuccess();
      } else {
        SoundEngine.playCoin();
      }
    }

    return { success: true, goal: savings[index] };
  },

  deleteSavingGoal(id) {
    let savings = JSON.parse(localStorage.getItem(this.KEYS.SAVINGS) || '[]');
    savings = savings.filter(s => s.id !== id);
    localStorage.setItem(this.KEYS.SAVINGS, JSON.stringify(savings));
    return { success: true };
  },

  // =========================================================================
  // MÓDULO "ME DEBEN / DEBO" (CONTROL DE PRÉSTAMOS PERSONALES)
  // =========================================================================
  getLoans(filter = {}) {
    const loans = JSON.parse(localStorage.getItem(this.KEYS.LOANS) || '[]');
    const session = this.getSession();
    const currentUserId = session && session.user ? session.user.id : null;
    const today = new Date().toISOString().slice(0, 10);

    return loans
      .filter(l => {
        if (currentUserId && l.userId && l.userId !== currentUserId) return false;
        if (filter.type && l.type !== filter.type) return false;
        if (filter.status) {
          if (filter.status === 'vencido') {
            return l.status !== 'saldado' && l.dueDate && l.dueDate < today;
          }
          if (l.status !== filter.status) return false;
        }
        if (filter.search) {
          const q = filter.search.toLowerCase();
          return l.personName.toLowerCase().includes(q) || (l.notes && l.notes.toLowerCase().includes(q));
        }
        return true;
      })
      .map(l => {
        const remaining = Math.max(0, l.amount - (l.paidAmount || 0));
        const isOverdue = l.status !== 'saldado' && l.dueDate && l.dueDate < today;
        return {
          ...l,
          remainingAmount: remaining,
          progressPct: l.amount > 0 ? Math.min(100, Math.round(((l.paidAmount || 0) / l.amount) * 100)) : 0,
          isOverdue
        };
      })
      .sort((a, b) => new Date(b.startDate || b.createdAt) - new Date(a.startDate || a.createdAt));
  },

  addLoan(data) {
    const session = this.getSession();
    if (!session || !session.user) return { success: false, message: 'Sesión no válida.' };

    const loans = JSON.parse(localStorage.getItem(this.KEYS.LOANS) || '[]');
    const newLoan = {
      id: 'loan_' + Date.now(),
      userId: session.user.id,
      type: data.type === 'debo' ? 'debo' : 'me_deben', // 'me_deben' o 'debo'
      personName: data.personName.trim(),
      amount: parseFloat(data.amount) || 0,
      paidAmount: 0,
      startDate: data.startDate || new Date().toISOString().slice(0, 10),
      dueDate: data.dueDate || '',
      notes: data.notes ? data.notes.trim() : '',
      status: 'pendiente', // 'pendiente', 'parcial', 'saldado'
      payments: [],
      createdAt: new Date().toISOString()
    };

    loans.unshift(newLoan);
    localStorage.setItem(this.KEYS.LOANS, JSON.stringify(loans));

    if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
    return { success: true, loan: newLoan };
  },

  addLoanPayment(loanId, paymentData) {
    const session = this.getSession();
    if (!session || !session.user) return { success: false, message: 'Sesión no válida.' };

    const loans = JSON.parse(localStorage.getItem(this.KEYS.LOANS) || '[]');
    const index = loans.findIndex(l => l.id === loanId);
    if (index === -1) return { success: false, message: 'Registro de préstamo no encontrado.' };

    const loan = loans[index];
    const amount = parseFloat(paymentData.amount) || 0;
    if (amount <= 0) return { success: false, message: 'El monto del abono debe ser mayor a cero.' };

    const payment = {
      id: 'pay_' + Date.now(),
      amount: amount,
      date: paymentData.date || new Date().toISOString().slice(0, 10),
      notes: paymentData.notes ? paymentData.notes.trim() : ''
    };

    loan.payments = loan.payments || [];
    loan.payments.unshift(payment);
    loan.paidAmount = (loan.paidAmount || 0) + amount;

    if (loan.paidAmount >= loan.amount) {
      loan.status = 'saldado';
    } else {
      loan.status = 'parcial';
    }

    loans[index] = loan;
    localStorage.setItem(this.KEYS.LOANS, JSON.stringify(loans));

    if (typeof SoundEngine !== 'undefined') {
      if (loan.status === 'saldado') SoundEngine.playSuccess();
      else SoundEngine.playCoin();
    }

    return { success: true, loan };
  },

  deleteLoan(id) {
    let loans = JSON.parse(localStorage.getItem(this.KEYS.LOANS) || '[]');
    loans = loans.filter(l => l.id !== id);
    localStorage.setItem(this.KEYS.LOANS, JSON.stringify(loans));
    return { success: true };
  },

  getLoansSummary() {
    const loans = this.getLoans();
    let totalMeDeben = 0;
    let totalDebo = 0;
    let pendingMeDeben = 0;
    let pendingDebo = 0;
    let overdueCount = 0;

    loans.forEach(l => {
      const remaining = Math.max(0, l.amount - (l.paidAmount || 0));
      if (l.type === 'me_deben') {
        totalMeDeben += l.amount;
        pendingMeDeben += remaining;
      } else {
        totalDebo += l.amount;
        pendingDebo += remaining;
      }
      if (l.isOverdue) overdueCount++;
    });

    return {
      totalMeDeben,
      totalDebo,
      pendingMeDeben, // Saldo neto que me deben cobrar
      pendingDebo,    // Saldo neto que tengo pendiente pagar
      netBalance: pendingMeDeben - pendingDebo,
      overdueCount
    };
  },

  // =========================================================================
  // GRUPO FAMILIAR (FLUJO DINÁMICO: CREAR PRIMERO, LUEGO AÑADIR MIEMBROS)
  // =========================================================================
  getFamilyGroup() {
    const session = this.getSession();
    if (!session || !session.user) return null;

    const families = JSON.parse(localStorage.getItem(this.KEYS.FAMILY) || '[]');
    // Buscar si el usuario actual tiene un grupo creado o pertenece a uno
    const fam = families.find(f => f.createdBy === session.user.id || (f.members && f.members.some(m => m.userId === session.user.id)));
    return fam || null;
  },

  createFamilyGroup(name) {
    const session = this.getSession();
    if (!session || !session.user) return { success: false, message: 'Sesión no válida.' };

    const groupName = (name || '').trim();
    if (!groupName) return { success: false, message: 'Por favor asigna un nombre a tu grupo familiar.' };

    let families = JSON.parse(localStorage.getItem(this.KEYS.FAMILY) || '[]');
    
    // Si ya tiene un grupo, actualizarlo en vez de duplicar
    const existingIndex = families.findIndex(f => f.createdBy === session.user.id);
    const newGroup = {
      id: existingIndex >= 0 ? families[existingIndex].id : 'fam_' + Date.now(),
      name: groupName,
      createdBy: session.user.id,
      createdByName: session.user.name,
      createdAt: new Date().toISOString().slice(0, 10),
      members: existingIndex >= 0 ? families[existingIndex].members : [
        {
          id: 'mem_owner_' + Date.now(),
          userId: session.user.id,
          name: session.user.name,
          relationship: 'Titular / Administrador',
          isOwner: true,
          joinedAt: new Date().toISOString().slice(0, 10)
        }
      ]
    };

    if (existingIndex >= 0) {
      families[existingIndex] = newGroup;
    } else {
      families.push(newGroup);
    }

    localStorage.setItem(this.KEYS.FAMILY, JSON.stringify(families));
    if (typeof SoundEngine !== 'undefined') SoundEngine.playSuccess();
    return { success: true, family: newGroup };
  },

  updateFamilyGroupName(name) {
    const session = this.getSession();
    if (!session || !session.user) return { success: false, message: 'Sesión no válida.' };

    const groupName = (name || '').trim();
    if (!groupName) return { success: false, message: 'El nombre no puede estar vacío.' };

    let families = JSON.parse(localStorage.getItem(this.KEYS.FAMILY) || '[]');
    const index = families.findIndex(f => f.createdBy === session.user.id);
    if (index === -1) return { success: false, message: 'Grupo no encontrado.' };

    families[index].name = groupName;
    localStorage.setItem(this.KEYS.FAMILY, JSON.stringify(families));
    return { success: true, family: families[index] };
  },

  addFamilyMember(data) {
    const session = this.getSession();
    if (!session || !session.user) return { success: false, message: 'Sesión no válida.' };

    const name = (data.name || '').trim();
    const relationship = (data.relationship || '').trim();

    if (!name) return { success: false, message: 'Ingresa el nombre completo del miembro.' };
    if (!relationship) return { success: false, message: 'Selecciona el parentesco o relación.' };

    let families = JSON.parse(localStorage.getItem(this.KEYS.FAMILY) || '[]');
    let fam = families.find(f => f.createdBy === session.user.id);

    if (!fam) {
      return { success: false, message: 'Primero debes crear tu grupo familiar antes de añadir miembros.' };
    }

    const member = {
      id: 'mem_' + Date.now(),
      name: name,
      relationship: relationship,
      notes: data.notes ? data.notes.trim() : '',
      isOwner: false,
      joinedAt: new Date().toISOString().slice(0, 10)
    };

    fam.members = fam.members || [];
    fam.members.push(member);
    localStorage.setItem(this.KEYS.FAMILY, JSON.stringify(families));

    if (typeof SoundEngine !== 'undefined') SoundEngine.playCoin();
    return { success: true, member, family: fam };
  },

  deleteFamilyMember(memberId) {
    const session = this.getSession();
    if (!session || !session.user) return { success: false, message: 'Sesión no válida.' };

    let families = JSON.parse(localStorage.getItem(this.KEYS.FAMILY) || '[]');
    let fam = families.find(f => f.createdBy === session.user.id);
    if (!fam) return { success: false, message: 'Grupo no encontrado.' };

    const member = fam.members.find(m => m.id === memberId);
    if (member && member.isOwner) {
      return { success: false, message: 'No puedes eliminar al titular del grupo familiar.' };
    }

    fam.members = fam.members.filter(m => m.id !== memberId);
    localStorage.setItem(this.KEYS.FAMILY, JSON.stringify(families));
    return { success: true };
  },

  deleteFamilyGroup() {
    const session = this.getSession();
    if (!session || !session.user) return { success: false, message: 'Sesión no válida.' };

    let families = JSON.parse(localStorage.getItem(this.KEYS.FAMILY) || '[]');
    families = families.filter(f => f.createdBy !== session.user.id);
    localStorage.setItem(this.KEYS.FAMILY, JSON.stringify(families));
    return { success: true };
  },

  // =========================================================================
  // SIMULADOR "¿PUEDO PERMITÍRMELO?" (ASESOR DE COMPRAS INTELIGENTE)
  // =========================================================================
  simulatePurchase(itemName, amount, categoryId = null) {
    const price = parseFloat(amount) || 0;
    const name = (itemName || '').trim() || 'Este artículo';

    if (price <= 0) {
      return {
        verdict: 'invalid',
        headline: 'Monto inválido',
        color: '#64748B',
        badge: 'ERROR',
        description: 'Por favor ingresa un monto mayor a $ 0 COP para simular.'
      };
    }

    const kpis = this.getDashboardKPIs();
    const currentBalance = kpis.balance;
    const monthlyIncome = kpis.totalIncomes;
    const monthlyExpenses = kpis.totalExpenses;

    const budgets = this.getBudgets();
    const remainingBudgetCommitments = budgets.reduce((acc, b) => acc + Math.max(0, b.remainingAmount), 0);
    const savings = this.getSavings();
    const currentSavingsTotal = savings.reduce((acc, s) => acc + s.currentAmount, 0);

    // Saldo libre real descontando compromisos fijos del mes
    const freeLiquidity = Math.max(0, currentBalance - remainingBudgetCommitments);
    const postPurchaseBalance = currentBalance - price;

    // Métricas relativas
    const incomeRatio = monthlyIncome > 0 ? (price / monthlyIncome) * 100 : 100;
    const daysOfWork = monthlyIncome > 0 ? Math.round((price / (monthlyIncome / 30)) * 10) / 10 : 0;

    let verdict, color, badge, headline, explanation, advice;

    if (postPurchaseBalance < 0) {
      verdict = 'danger';
      color = '#EF4444';
      badge = '🔴 NO RECOMENDADO';
      headline = 'Sobrepasa tu saldo actual';
      explanation = `Comprar "${name}" por ${this.formatCOP(price)} dejaría tu balance en números rojos (${this.formatCOP(postPurchaseBalance)}). Te obligaría a endeudarte o generar un sobregiro.`;
      advice = 'Te sugerimos crear una Meta de Ahorro específica para este objetivo y programar cuotas mensuales sin descapitalizarte.';
    } else if (price > freeLiquidity && remainingBudgetCommitments > 0) {
      verdict = 'warning';
      color = '#F59E0B';
      badge = '🟡 CON PRECAUCIÓN';
      headline = 'Compromete tus presupuestos del mes';
      explanation = `Tienes saldo para pagarlo hoy, pero te dejaría sin liquidez para cubrir los presupuestos básicos y facturas pactadas de este mes (faltarían ${this.formatCOP(remainingBudgetCommitments - (currentBalance - price))}).`;
      advice = 'Espera a cubrir tus gastos prioritarios del mes o busca posponer la compra para el siguiente ciclo presupuestal.';
    } else if (incomeRatio > 40 && monthlyIncome > 0) {
      verdict = 'warning';
      color = '#F59E0B';
      badge = '🟡 IMPACTO ALTO';
      headline = 'Representa una porción muy alta de tu ingreso';
      explanation = `Esta compra equivale al ${Math.round(incomeRatio)}% de tus ingresos mensuales (${daysOfWork} días de trabajo). Aunque puedes pagarla, reducirá tu flexibilidad ante imprevistos.`;
      advice = 'Asegúrate de no tener gastos médicos, impuestos o mantenimientos pendientes antes de dar el paso.';
    } else {
      verdict = 'success';
      color = '#10B981';
      badge = '🟢 ¡ADELANTE!';
      headline = 'Compra financieramente viable';
      explanation = `¡Buenas noticias! Puedes adquirir "${name}" sin comprometer tus presupuestos obligatorios. Tras la compra mantendrás un saldo positivo de ${this.formatCOP(postPurchaseBalance)}.`;
      advice = 'Tu colchón financiero se mantiene saludable. ¡Disfruta de tu compra con tranquilidad!';
    }

    return {
      itemName: name,
      price,
      verdict,
      color,
      badge,
      headline,
      explanation,
      advice,
      metrics: {
        currentBalance,
        postPurchaseBalance,
        freeLiquidity,
        incomeRatio: Math.round(incomeRatio),
        daysOfWork,
        currentSavingsTotal
      }
    };
  },

  // =========================================================================
  // DIAGNÓSTICO DE SALUD FINANCIERA (SCORE 1 A 100)
  // =========================================================================
  calculateFinancialHealthScore() {
    const kpis = this.getDashboardKPIs();
    const incomes = kpis.totalIncomes;
    const expenses = kpis.totalExpenses;
    const loansSummary = this.getLoansSummary();
    const budgets = this.getBudgets();
    const savings = this.getSavings();

    let score = 0;
    const breakdown = {
      savingsRate: { score: 0, max: 30, label: 'Tasa de Ahorro' },
      budgetControl: { score: 0, max: 25, label: 'Control de Presupuestos' },
      emergencyFund: { score: 0, max: 25, label: 'Colchón y Metas' },
      debtLevel: { score: 0, max: 20, label: 'Nivel de Deuda' }
    };
    const tips = [];

    // 1. Tasa de Ahorro (Máx 30 puntos)
    if (incomes > 0) {
      const netSavings = incomes - expenses;
      const rate = (netSavings / incomes) * 100;
      if (rate >= 25) {
        breakdown.savingsRate.score = 30;
      } else if (rate >= 15) {
        breakdown.savingsRate.score = 22;
        tips.push('Aumenta tu ahorro al 20%-25% de tus ingresos para blindar tu patrimonio.');
      } else if (rate >= 5) {
        breakdown.savingsRate.score = 14;
        tips.push('Tu margen de ahorro es estrecho (menos del 10%). Revisa y recorta gastos secundarios.');
      } else if (rate >= 0) {
        breakdown.savingsRate.score = 6;
        tips.push('Estás gastando casi todo lo que ganas. Prioriza apartar un porcentaje fijo al inicio de mes.');
      } else {
        breakdown.savingsRate.score = 0;
        tips.push('🚨 Tus gastos superan tus ingresos este mes. Es imperativo frenar compras no esenciales.');
      }
    } else {
      breakdown.savingsRate.score = 10;
      tips.push('Registra tus ingresos mensuales para poder evaluar tu capacidad de ahorro.');
    }

    // 2. Control Presupuestario (Máx 25 puntos)
    if (budgets.length > 0) {
      const withinLimit = budgets.filter(b => !b.isOverbudget).length;
      const budgetPct = (withinLimit / budgets.length) * 100;
      if (budgetPct === 100) {
        breakdown.budgetControl.score = 25;
      } else if (budgetPct >= 70) {
        breakdown.budgetControl.score = 18;
        tips.push('Algunas categorías sobrepasaron su límite de gasto. Ajusta montos o modera consumos.');
      } else {
        breakdown.budgetControl.score = 8;
        tips.push('Más del 30% de tus presupuestos están desbordados. Revisa tus gastos en vivienda u ocio.');
      }
    } else {
      breakdown.budgetControl.score = 12;
      tips.push('Define al menos 2 presupuestos mensuales (ej. Alimentación y Transporte) para ganar puntos de control.');
    }

    // 3. Colchón de Emergencia y Metas (Máx 25 puntos)
    const totalSavings = savings.reduce((acc, s) => acc + s.currentAmount, 0);
    const monthsOfCushion = expenses > 0 ? totalSavings / expenses : 0;

    if (monthsOfCushion >= 3) {
      breakdown.emergencyFund.score = 25;
    } else if (monthsOfCushion >= 1) {
      breakdown.emergencyFund.score = 18;
      tips.push('Tienes 1 mes de respaldo. Intenta alcanzar entre 3 y 6 meses de gastos fijos como colchón.');
    } else if (totalSavings > 0) {
      breakdown.emergencyFund.score = 10;
      tips.push('Buen inicio en tus ahorros. Sigue aportando regularmente para alcanzar tu primer fondo de seguridad.');
    } else {
      breakdown.emergencyFund.score = 4;
      tips.push('Crea una Meta de Ahorro ("Fondo de Emergencia") para protegerte contra imprevistos.');
    }

    // 4. Nivel de Deuda Personal (Máx 20 puntos)
    const pendingDebo = loansSummary.pendingDebo;
    if (pendingDebo === 0) {
      breakdown.debtLevel.score = 20;
    } else if (incomes > 0) {
      const debtRatio = (pendingDebo / incomes) * 100;
      if (debtRatio <= 15) {
        breakdown.debtLevel.score = 16;
      } else if (debtRatio <= 40) {
        breakdown.debtLevel.score = 10;
        tips.push('Tus deudas personales representan entre 15% y 40% de tus ingresos. Diseña un plan de pago anticipado.');
      } else {
        breakdown.debtLevel.score = 4;
        tips.push('🚨 Nivel de deuda elevado frente a tus ingresos. Prioriza abonar a "Me Deben / Debo" cuanto antes.');
      }
    } else {
      breakdown.debtLevel.score = 10;
    }

    // Sumatoria
    score = breakdown.savingsRate.score + breakdown.budgetControl.score + breakdown.emergencyFund.score + breakdown.debtLevel.score;
    score = Math.max(1, Math.min(100, Math.round(score)));

    // Categorización
    let tier, tierLabel, tierColor;
    if (score >= 80) {
      tier = 'excelente';
      tierLabel = 'Excelente (Finanzas de Hierro)';
      tierColor = '#10B981';
    } else if (score >= 65) {
      tier = 'saludable';
      tierLabel = 'Saludable y Estable';
      tierColor = '#38BDF8';
    } else if (score >= 45) {
      tier = 'riesgo';
      tierLabel = 'En Riesgo Moderado';
      tierColor = '#F59E0B';
    } else {
      tier = 'critico';
      tierLabel = 'Alerta Crítica';
      tierColor = '#EF4444';
    }

    if (tips.length === 0) {
      tips.push('¡Excelente disciplina! Mantén tus hábitos de registro, control de presupuestos y ahorro constante.');
    }

    return {
      score,
      tier,
      tierLabel,
      tierColor,
      breakdown,
      tips
    };
  },

  // =========================================================================
  // GAMIFICACIÓN: MEDALLAS Y RETO DE LOS 30 DÍAS
  // =========================================================================
  getAchievements() {
    const txs = this.getTransactions();
    const savings = this.getSavings();
    const budgets = this.getBudgets();
    const loansSummary = this.getLoansSummary();
    const health = this.calculateFinancialHealthScore();
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthTxs = txs.filter(t => t.date.startsWith(currentMonth));

    const list = [
      {
        id: 'ach_first_step',
        title: 'Primer Despegue',
        desc: 'Registraste tu primer movimiento en MoneyTrack.',
        icon: '🚀',
        color: '#38BDF8',
        unlocked: txs.length >= 1,
        progress: `${Math.min(1, txs.length)}/1`
      },
      {
        id: 'ach_saver_mind',
        title: 'Ahorrador Consciente',
        desc: 'Creaste tu primera meta de ahorro personal.',
        icon: '💰',
        color: '#10B981',
        unlocked: savings.length >= 1,
        progress: `${Math.min(1, savings.length)}/1`
      },
      {
        id: 'ach_bullseye',
        title: 'Tiro al Blanco',
        desc: 'Completaste el 100% de una meta de ahorro.',
        icon: '🎯',
        color: '#F59E0B',
        unlocked: savings.some(s => s.isCompleted),
        progress: savings.some(s => s.isCompleted) ? 'Completado' : 'Pendiente'
      },
      {
        id: 'ach_strategist',
        title: 'Estratega Financiero',
        desc: 'Configuraste presupuestos para al menos 3 categorías.',
        icon: '📊',
        color: '#6366F1',
        unlocked: budgets.length >= 3,
        progress: `${Math.min(3, budgets.length)}/3`
      },
      {
        id: 'ach_debt_free',
        title: 'Libre de Deudas',
        desc: 'No tienes deudas pendientes de pago en "Me Deben / Debo".',
        icon: '🛡️',
        color: '#06B6D4',
        unlocked: loansSummary.pendingDebo === 0,
        progress: loansSummary.pendingDebo === 0 ? 'Sin Deudas' : `${this.formatCOP(loansSummary.pendingDebo)} pendiente`
      },
      {
        id: 'ach_hercules',
        title: 'Hércules del Ahorro',
        desc: 'Alcanzaste un Score de Salud Financiera superior a 80 pts.',
        icon: '👑',
        color: '#A855F7',
        unlocked: health.score >= 80,
        progress: `${health.score}/80 pts`
      },
      {
        id: 'ach_consistency',
        title: 'Constancia de Oro',
        desc: 'Registraste 5 o más movimientos durante el mes actual.',
        icon: '📅',
        color: '#EC4899',
        unlocked: monthTxs.length >= 5,
        progress: `${Math.min(5, monthTxs.length)}/5`
      }
    ];

    const unlockedCount = list.filter(a => a.unlocked).length;
    return {
      badges: list,
      unlockedCount,
      totalCount: list.length,
      percentage: Math.round((unlockedCount / list.length) * 100)
    };
  },

  getSavingsChallenge() {
    const raw = localStorage.getItem(this.KEYS.CHALLENGES);
    let state = {};
    try {
      state = raw ? JSON.parse(raw) : {};
    } catch (e) {
      state = {};
    }

    const completedDays = state.completedDays || [];
    const days = [];
    let totalTarget = 0;
    let totalAccumulated = 0;

    for (let i = 1; i <= 30; i++) {
      const amount = i * 1000; // Día 1: $1.000, Día 2: $2.000, ... Día 30: $30.000 (Total: $465.000 COP)
      totalTarget += amount;
      const isDone = completedDays.includes(i);
      if (isDone) totalAccumulated += amount;

      days.push({
        day: i,
        amount,
        isDone
      });
    }

    return {
      days,
      completedCount: completedDays.length,
      totalDays: 30,
      totalTarget,
      totalAccumulated,
      percentage: Math.round((totalAccumulated / totalTarget) * 100)
    };
  },

  toggleChallengeDay(dayNumber, savingGoalId = null) {
    const num = parseInt(dayNumber, 10);
    if (!num || num < 1 || num > 30) return { success: false };

    const raw = localStorage.getItem(this.KEYS.CHALLENGES);
    let state = {};
    try {
      state = raw ? JSON.parse(raw) : {};
    } catch (e) {
      state = {};
    }

    state.completedDays = state.completedDays || [];
    const isAlreadyDone = state.completedDays.includes(num);

    if (isAlreadyDone) {
      state.completedDays = state.completedDays.filter(d => d !== num);
    } else {
      state.completedDays.push(num);
      // Si se especificó una meta de ahorro, realizar abono automático
      if (savingGoalId) {
        const depositAmount = num * 1000;
        this.depositToSaving(savingGoalId, depositAmount);
      }
      if (typeof SoundEngine !== 'undefined') SoundEngine.playCoin();
    }

    localStorage.setItem(this.KEYS.CHALLENGES, JSON.stringify(state));
    return { success: true, isDone: !isAlreadyDone };
  },

  // =========================================================================
  // RESUMEN KPI DASHBOARD
  // =========================================================================
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

  // =========================================================================
  // ANALÍTICA Y REPORTES (Media, Mediana, Agrupación)
  // =========================================================================
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
