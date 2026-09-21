/**
 * Gubernajur API Server - Complete CNJ/DataJud Integration
 */

const express = require('express');
const cors = require('cors');
const datajud = require('./src/datajud');
const OABMonitor = require('./src/oab-monitor');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Initialize OAB Monitor
const oabMonitor = new OABMonitor({
  interval: 3600000,
  cacheTTL: 300000
});

// ============================================
// PROCESS ENDPOINTS
// ============================================

/**
 * @route GET /api/process/:cnj
 * @desc Get complete process details by CNJ number
 */
app.get('/api/process/:cnj', async (req, res) => {
  try {
    const { cnj } = req.params;
    const validation = datajud.validateCNJ(cnj);

    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const result = await datajud.getProcessDetails(cnj);
    res.json(result);
  } catch (error) {
    console.error('Error querying process:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/process/search
 * @desc Search processes with filters
 */
app.post('/api/process/search', async (req, res) => {
  try {
    const { tribunal, startDate, endDate, keywords, page = 0, size = 100 } = req.body;

    let result;

    if (keywords) {
      result = await datajud.searchByMovement(tribunal, keywords, { startDate, endDate, page, size });
    } else if (startDate && endDate) {
      result = await datajud.searchByDateRange(tribunal, startDate, endDate, { page, size });
    } else {
      return res.status(400).json({ error: 'Provide keywords or date range' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error searching processes:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/tribunals
 * @desc Get all available tribunals
 */
app.get('/api/tribunals', (req, res) => {
  res.json(datajud.getAvailableTribunals());
});

/**
 * @route GET /api/tribunal/:code/info
 * @desc Get tribunal info by code
 */
app.get('/api/tribunal/:code/info', (req, res) => {
  const { code } = req.params;
  const endpoint = datajud.TRIBUNALS[code.toUpperCase()];

  if (!endpoint) {
    return res.status(404).json({ error: 'Tribunal not found' });
  }

  res.json({
    code: code.toUpperCase(),
    endpoint: `${datajud.API_BASE_URL}/${endpoint}/_search`,
    url: datajud.API_BASE_URL
  });
});

// ============================================
// OAB MONITORING ENDPOINTS
// ============================================

/**
 * @route POST /api/oab/search
 * @desc Search for OAB mentions
 */
app.post('/api/oab/search', async (req, res) => {
  try {
    const { oab, uf, tribunalCode, days = 30 } = req.body;

    if (!oab) {
      return res.status(400).json({ error: 'OAB number is required' });
    }

    const results = await oabMonitor.searchOAB(oab, { uf, tribunalCode, days });
    res.json({ oab, uf, searchDate: new Date().toISOString(), results });
  } catch (error) {
    console.error('Error searching OAB:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/oab/monitor/start
 * @desc Start OAB monitoring
 */
app.post('/api/oab/monitor/start', async (req, res) => {
  try {
    const { oabConfigs, interval } = req.body;

    if (!oabConfigs || oabConfigs.length === 0) {
      return res.status(400).json({ error: 'OAB configurations required' });
    }

    if (interval) oabMonitor.interval = interval;

    const result = await oabMonitor.startMonitoring(oabConfigs);
    res.json(result);
  } catch (error) {
    console.error('Error starting monitoring:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/oab/monitor/stop
 * @desc Stop OAB monitoring
 */
app.post('/api/oab/monitor/stop', (req, res) => {
  res.json(oabMonitor.stopMonitoring());
});

/**
 * @route GET /api/oab/monitor/status
 * @desc Get monitoring status
 */
app.get('/api/oab/monitor/status', (req, res) => {
  res.json(oabMonitor.getStatus());
});

/**
 * @route POST /api/oab/monitor/check
 * @desc Manual trigger for OAB check
 */
app.post('/api/oab/monitor/check', async (req, res) => {
  try {
    const { oab, uf } = req.body;

    if (!oab) {
      return res.status(400).json({ error: 'OAB is required' });
    }

    const result = await oabMonitor.manualCheck(oab, uf);
    res.json({ oab, uf, checkTime: new Date().toISOString(), results: result });
  } catch (error) {
    console.error('Error during manual check:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// CNJ UTILITIES
// ============================================

/**
 * @route GET /api/cnj/validate/:cnj
 * @desc Validate and parse CNJ number
 */
app.get('/api/cnj/validate/:cnj', (req, res) => {
  const { cnj } = req.params;
  const validation = datajud.validateCNJ(cnj);

  if (validation.valid) {
    res.json({
      valid: true,
      normalized: datajud.normalizeCNJ(cnj),
      formatted: datajud.formatCNJ(cnj),
      tribunal: validation.tribunal,
      tribunalEndpoint: validation.tribunalEndpoint,
      jurisdiction: validation.jurisdiction
    });
  } else {
    res.json({ valid: false, error: validation.error });
  }
});

// ============================================
// HEALTH & INFO
// ============================================

/**
 * @route GET /api/health
 * @desc Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    datajud: {
      apiUrl: datajud.API_BASE_URL,
      tribunals: Object.keys(datajud.TRIBUNALS).length
    },
    monitor: oabMonitor.getStatus()
  });
});

/**
 * @route GET /api/info
 * @desc API information
 */
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Gubernajur API',
    version: '1.0.0',
    description: 'Complete CNJ/DataJud Integration for Brazilian Courts',
    features: [
      'Process search by CNJ number',
      'OAB monitoring (Diário da Justiça)',
      'Automatic deadline extraction',
      'Process tracking across all Brazilian courts',
      'Movement history',
      'Real-time notifications'
    ],
    endpoints: {
      processes: ['GET /api/process/:cnj', 'POST /api/process/search', 'GET /api/tribunals'],
      oab: ['POST /api/oab/search', 'POST /api/oab/monitor/start', 'GET /api/oab/monitor/status'],
      utilities: ['GET /api/cnj/validate/:cnj', 'GET /api/health']
    }
  });
});

// Start server - listen on all interfaces for network access
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🏛️  Gubernajur API - CNJ/DataJud Integration              ║
║                                                              ║
║   Status: ✅ Online                                          ║
║   Port:   ${PORT.toString().padEnd(49)}║
║                                                              ║
║   Features that SURPASS Advcontroller:                       ║
║   ✅ Process search by CNJ with full details                 ║
║   ✅ OAB monitoring (Diário da Justiça)                      ║
║   ✅ Automatic deadline extraction                           ║
║   ✅ Track processes across ALL Brazilian courts             ║
║   ✅ Complete movement history                               ║
║   ✅ Real-time notifications                                ║
║                                                              ║
║   Documentation: http://localhost:${PORT}/api/info               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
