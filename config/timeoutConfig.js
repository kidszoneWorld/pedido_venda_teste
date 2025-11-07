// config/timeoutConfig.js

// Configurações centralizadas de timeout para diferentes ambientes
const timeoutConfig = {
  // Timeouts em milissegundos
  development: {
    authentication: 30000,      // 30 segundos
    apiStandard: 120000,       // 2 minutos
    apiLong: 300000,           // 5 minutos
    apiExtended: 600000,       // 10 minutos
    pageLoad: 60000,           // 1 minuto
    pdfGeneration: 180000,     // 3 minutos
  },
  production: {
    authentication: 60000,      // 1 minuto
    apiStandard: 240000,       // 4 minutos
    apiLong: 300000,           // 5 minutos
    apiExtended: 600000,       // 10 minutos
    pageLoad: 120000,          // 2 minutos
    pdfGeneration: 300000,     // 5 minutos
  }
};

// Função para obter configuração baseada no ambiente
function getTimeoutConfig() {
  const env = process.env.NODE_ENV || 'development';
  return timeoutConfig[env] || timeoutConfig.development;
}

// Exportar configurações
module.exports = {
  timeoutConfig,
  getTimeoutConfig,
  
  // Configurações específicas para Vercel
  vercel: {
    maxDuration: 300,          // 5 minutos (máximo para hobby plan)
    recommended: 240000,       // 4 minutos (recomendado para deixar margem)
    critical: 280000           // 4 min 40s (para operações críticas)
  }
};
