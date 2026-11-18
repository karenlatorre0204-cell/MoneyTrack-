/**
 * MONEYTRACK · Charts & Data Visualization (Chart.js)
 * Gráficas interactivas para Dashboard y Reportes
 */

const Charts = {
  instances: {},

  // Colores dinámicos basados en CSS variables
  getThemeColors() {
    const style = getComputedStyle(document.body);
    return {
      accent: style.getPropertyValue('--accent').trim() || '#6C5CE7',
      accent2: style.getPropertyValue('--accent-2').trim() || '#00D2FF',
      surface: style.getPropertyValue('--surface').trim() || '#1A1F33',
      text: style.getPropertyValue('--fg').trim() || '#EEF2FF',
      muted: style.getPropertyValue('--muted').trim() || '#A9B4D0',
      border: style.getPropertyValue('--border').trim() || '#303A5C',
      success: '#10B981',
      danger: '#EF4444',
      warning: '#F59E0B'
    };
  },

  destroy(chartId) {
    if (this.instances[chartId]) {
      this.instances[chartId].destroy();
      delete this.instances[chartId];
    }
  },

  // 1. Gráfica comparativa Ingresos vs Gastos (Dashboard)
  renderDashboardComparison(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;

    this.destroy(canvasId);
    const colors = this.getThemeColors();
    const kpis = Storage.getDashboardKPIs();

    this.instances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Ingresos del Mes', 'Gastos del Mes'],
        datasets: [{
          data: [kpis.totalIncomes, kpis.totalExpenses],
          backgroundColor: [colors.success, colors.danger],
          borderRadius: 8,
          borderWidth: 1,
          borderColor: [colors.success, colors.danger]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => Storage.formatCOP(ctx.raw)
            }
          }
        },
        scales: {
          y: {
            grid: { color: colors.border },
            ticks: {
              color: colors.muted,
              callback: val => '$ ' + (val / 1000).toLocaleString() + 'k'
            }
          },
          x: {
            grid: { display: false },
            ticks: { color: colors.text, font: { weight: 'bold' } }
          }
        }
      }
    });
  },

  // 2. Gráfica Dona de Gastos por Categoría (Dashboard)
  renderCategoryDoughnut(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;

    this.destroy(canvasId);
    const colors = this.getThemeColors();
    const analytics = Storage.getAnalytics();
    const labels = Object.keys(analytics.expensesByCategory);
    const values = Object.values(analytics.expensesByCategory);

    const palette = [
      '#6C5CE7', '#00D2FF', '#10B981', '#F59E0B', '#EF4444',
      '#EC4899', '#8B5CF6', '#F97316', '#14B8A6', '#64748B'
    ];

    if (!labels.length) {
      labels.push('Sin gastos registrados');
      values.push(1);
    }

    this.instances[canvasId] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: palette.slice(0, labels.length),
          borderWidth: 2,
          borderColor: colors.surface
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: colors.muted, boxWidth: 12, padding: 12 }
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${Storage.formatCOP(ctx.raw)}`
            }
          }
        }
      }
    });
  },

  // 3. Gráfica de Tendencia / Evolución (Reportes)
  renderReportsTrend(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;

    this.destroy(canvasId);
    const colors = this.getThemeColors();
    const months = ['Jul', 'Ago', 'Sep', 'Oct', 'Nov'];
    const mockIncomes = [3200000, 3500000, 4100000, 3900000, 4650000];
    const mockExpenses = [2100000, 2400000, 2600000, 2800000, 1810000];

    this.instances[canvasId] = new Chart(canvas, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Ingresos',
            data: mockIncomes,
            borderColor: colors.success,
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.35,
            borderWidth: 2.5
          },
          {
            label: 'Gastos',
            data: mockExpenses,
            borderColor: colors.danger,
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            fill: true,
            tension: 0.35,
            borderWidth: 2.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: colors.text, boxWidth: 14 }
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${Storage.formatCOP(ctx.raw)}`
            }
          }
        },
        scales: {
          y: {
            grid: { color: colors.border },
            ticks: {
              color: colors.muted,
              callback: val => '$ ' + (val / 1000000).toFixed(1) + 'M'
            }
          },
          x: {
            grid: { color: colors.border },
            ticks: { color: colors.muted }
          }
        }
      }
    });
  }
};
