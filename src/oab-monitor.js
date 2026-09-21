/**
 * OAB Monitoring Service for Gubernajur
 *
 * Complete Diário da Justiça monitoring system that surpasses Advcontroller:
 * - Monitor multiple OABs across multiple states
 * - Track movements mentioning specific OABs
 * - Extract deadlines from movements
 * - Create alerts and notifications
 * - Historical tracking
 */

const datajud = require('./datajud');

class OABMonitor {
  constructor(options = {}) {
    this.interval = options.interval || 3600000; // Default 1 hour
    this.lastCheck = new Map();
    this.cache = new Map();
    this.cacheTTL = options.cacheTTL || 300000; // 5 minutes
    this.subscribers = new Map();
    this.monitoringActive = false;
  }

  /**
   * Extract deadline from movement text
   */
  extractDeadline(movementText) {
    const patterns = [
      /prazo\s+(?:de\s+)?(\d+)\s+dias?/i,
      /prazo\s+(?:de\s+)?(\d+)\s+horas?/i,
      /dentro\s+de\s+(\d+)\s+dias?/i,
      /(?:até|ate|em)\s+(\d{2}\/\d{2}\/\d{4})/i,
      /(?:até|ate|para)\s+(\d{1,2})\s+de\s+(\w+)/i,
      /(?:decisão|julgamento)\s+(?:em|em\s+)\s*(\d+)\s+dias?/i,
      /prazo\s+(?:fatal|ex fatal|improrrogável)/i,
    ];

    const results = {
      days: null,
      hours: null,
      specificDate: null,
      isFatal: false
    };

    for (const pattern of patterns) {
      const match = movementText.match(pattern);
      if (match) {
        if (pattern.source.includes('dias') && !pattern.source.includes('horas')) {
          results.days = parseInt(match[1]);
        } else if (pattern.source.includes('horas')) {
          results.hours = parseInt(match[1]);
        } else if (match[1] && match[1].includes('/')) {
          results.specificDate = match[1];
        } else if (pattern.source.includes('fatal')) {
          results.isFatal = true;
        }
        break;
      }
    }

    return results;
  }

  /**
   * Calculate deadline date from today
   */
  calculateDeadlineDate(deadlineInfo) {
    if (!deadlineInfo) return null;

    const today = new Date();

    if (deadlineInfo.specificDate) {
      const [day, month, year] = deadlineInfo.specificDate.split('/');
      return new Date(year, month - 1, day);
    }

    if (deadlineInfo.days) {
      const result = new Date(today);
      result.setDate(result.getDate() + deadlineInfo.days);
      return result;
    }

    if (deadlineInfo.hours) {
      const result = new Date(today);
      result.setHours(result.getHours() + deadlineInfo.hours);
      return result;
    }

    return null;
  }

  /**
   * Search for OAB mentions across tribunals
   */
  async searchOAB(oab, options = {}) {
    const { uf, tribunalCode, days = 30 } = options;

    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - days);

    const startDate = pastDate.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    const cacheKey = `oab:${oab}:${uf || 'all'}:${startDate}:${endDate}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.data;
      }
    }

    console.log(`🔍 Searching for OAB ${oab} in ${uf || 'all states'}...`);

    const results = await datajud.searchByOAB(oab, uf, {
      tribunalCode,
      startDate,
      endDate,
      size: 100
    });

    const enrichedResults = {};

    for (const [tribunal, data] of Object.entries(results)) {
      if (!data.processes || data.processes.length === 0) continue;

      enrichedResults[tribunal] = {
        total: data.total,
        processes: data.processes.map(proc => {
          const movementsWithDeadlines = (proc.matchingMovements || proc.movimentos || [])
            .map(mov => ({
              ...mov,
              deadline: this.extractDeadline(mov.descricao || ''),
              deadlineDate: this.calculateDeadlineDate(this.extractDeadline(mov.descricao || ''))
            }))
            .filter(m => m.deadline.days || m.deadline.hours || m.deadline.specificDate);

          return {
            ...proc,
            movementsWithDeadlines,
            hasDeadlines: movementsWithDeadlines.length > 0,
            urgency: this.calculateUrgency(movementsWithDeadlines)
          };
        })
      };
    }

    this.cache.set(cacheKey, {
      timestamp: Date.now(),
      data: enrichedResults
    });

    return enrichedResults;
  }

  /**
   * Calculate urgency level based on deadlines
   */
  calculateUrgency(deadlines) {
    if (!deadlines || deadlines.length === 0) return 'low';

    const now = new Date();

    for (const dl of deadlines) {
      if (!dl.deadlineDate) continue;

      const diffDays = Math.ceil((dl.deadlineDate - now) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return 'overdue';
      if (diffDays <= 3) return 'critical';
      if (diffDays <= 7) return 'high';
      if (diffDays <= 15) return 'medium';
    }

    return 'low';
  }

  /**
   * Monitor multiple OABs continuously
   */
  async startMonitoring(oabConfigs) {
    if (this.monitoringActive) {
      console.log('⚠️ Monitoring already active');
      return;
    }

    this.monitoringActive = true;
    console.log('🚀 Starting OAB monitoring service...');

    this.oabConfigs = oabConfigs;

    await this.checkAll();

    this.intervalId = setInterval(() => {
      this.checkAll();
    }, this.interval);

    return {
      status: 'active',
      interval: this.interval,
      oabs: oabConfigs.map(c => `${c.oab}/${c.uf}`)
    };
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.monitoringActive = false;
    console.log('⏹️ OAB monitoring stopped');
    return { status: 'stopped' };
  }

  /**
   * Check all configured OABs
   */
  async checkAll() {
    console.log(`\n⏰ [${new Date().toISOString()}] Running OAB check...`);

    if (!this.oabConfigs || this.oabConfigs.length === 0) {
      console.log('⚠️ No OAB configs to check');
      return;
    }

    for (const config of this.oabConfigs) {
      try {
        console.log(`\n📋 Checking ${config.oab}/${config.uf} (${config.nome || 'Unknown'})...`);

        const results = await this.searchOAB(config.oab, {
          uf: config.uf,
          tribunalCode: config.tribunalCode,
          days: config.days || 30
        });

        const lastCheck = this.lastCheck.get(config.oab) || new Set();
        const newResults = [];

        for (const [tribunal, data] of Object.entries(results)) {
          for (const proc of data.processes || []) {
            const procKey = `${tribunal}:${proc.numeroProcesso}`;
            if (!lastCheck.has(procKey)) {
              newResults.push({ tribunal, ...proc });
            }
          }
        }

        if (newResults.length > 0) {
          console.log(`  ✅ Found ${newResults.length} new processes!`);

          this.notifySubscribers({
            type: 'new_processes',
            oab: config.oab,
            nome: config.nome,
            count: newResults.length,
            processes: newResults
          });
        } else {
          console.log(`  ✓ No new processes`);
        }

        const allKeys = new Set();
        for (const [tribunal, data] of Object.entries(results)) {
          for (const proc of data.processes || []) {
            allKeys.add(`${tribunal}:${proc.numeroProcesso}`);
          }
        }
        this.lastCheck.set(config.oab, allKeys);

      } catch (error) {
        console.error(`  ❌ Error checking ${config.oab}:`, error.message);

        this.notifySubscribers({
          type: 'error',
          oab: config.oab,
          error: error.message
        });
      }
    }

    console.log(`\n✅ OAB check complete`);
  }

  /**
   * Subscribe to OAB monitoring updates
   */
  subscribe(id, callback) {
    this.subscribers.set(id, callback);
    console.log(`👤 Subscriber ${id} added`);
    return () => this.subscribers.delete(id);
  }

  /**
   * Notify all subscribers
   */
  notifySubscribers(data) {
    for (const [id, callback] of this.subscribers) {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error notifying subscriber ${id}:`, error);
      }
    }
  }

  /**
   * Get monitoring status
   */
  getStatus() {
    return {
      active: this.monitoringActive,
      interval: this.interval,
      subscribers: this.subscribers.size,
      cachedOABs: Array.from(this.lastCheck.keys()),
      lastChecks: Object.fromEntries(this.lastCheck)
    };
  }

  /**
   * Manual check for specific OAB
   */
  async manualCheck(oab, uf) {
    console.log(`\n🔍 Manual check for ${oab}/${uf}...`);
    return this.searchOAB(oab, { uf, days: 30 });
  }
}

module.exports = OABMonitor;
