// middleware/timeoutMiddleware.js
const { getTimeoutConfig, vercel } = require('../config/timeoutConfig');

// Obter configurações de timeout baseadas no ambiente
const timeouts = getTimeoutConfig();

// Middleware para configurar timeouts específicos para diferentes tipos de rotas
function configureTimeout(timeoutMs = timeouts.apiStandard) {
  return (req, res, next) => {
    // Configurar timeout no request
    req.setTimeout(timeoutMs, () => {
      console.log(`Request timeout após ${timeoutMs}ms para rota: ${req.path}`);
      if (!res.headersSent) {
        res.status(408).json({
          error: 'Request Timeout',
          message: `A requisição excedeu o limite de tempo de ${timeoutMs / 1000} segundos`,
          path: req.path,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Configurar timeout no response
    res.setTimeout(timeoutMs, () => {
      console.log(`Response timeout após ${timeoutMs}ms para rota: ${req.path}`);
      if (!res.headersSent) {
        res.status(408).json({
          error: 'Response Timeout',
          message: `A resposta excedeu o limite de tempo de ${timeoutMs / 1000} segundos`,
          path: req.path,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Adicionar headers de controle
    res.setHeader('X-Timeout-Config', `${timeoutMs}ms`);
    res.setHeader('X-Environment', process.env.NODE_ENV || 'development');
    
    next();
  };
}

// Middleware específico para diferentes tipos de operações
const apiLongTimeout = configureTimeout(timeouts.apiLong);
const apiStandardTimeout = configureTimeout(timeouts.apiStandard);
const apiExtendedTimeout = configureTimeout(timeouts.apiExtended);
const pageTimeout = configureTimeout(timeouts.pageLoad);
const pdfTimeout = configureTimeout(timeouts.pdfGeneration);
const authTimeout = configureTimeout(timeouts.authentication);

// Middleware específico para Vercel (respeitando limites do plano)
const vercelTimeout = configureTimeout(vercel.recommended);
const vercelCriticalTimeout = configureTimeout(vercel.critical);

module.exports = {
  configureTimeout,
  apiLongTimeout,
  apiStandardTimeout,
  apiExtendedTimeout,
  pageTimeout,
  pdfTimeout,
  authTimeout,
  vercelTimeout,
  vercelCriticalTimeout,
  timeouts
};
