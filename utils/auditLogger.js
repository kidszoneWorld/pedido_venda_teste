let logsMemoria = [];

let redis = null;

try {
  const Redis = require("ioredis");
  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL);
  }
} catch (e) {
  console.log("Redis não configurado, usando memória.");
}

async function logAudit(action, email, details = {}) {
  const log = {
    action,
    email,
    details,
    date: new Date().toISOString()
  };

  try {
    if (redis) {
      await redis.lpush("auditoria_logs", JSON.stringify(log));
      await redis.ltrim("auditoria_logs", 0, 500);
    } else {
      logsMemoria.unshift(log);
      logsMemoria = logsMemoria.slice(0, 500);
    }
  } catch (error) {
    console.error("Erro ao salvar auditoria:", error);
  }
}

async function getAuditLogs() {
  try {
    if (redis) {
      const logs = await redis.lrange("auditoria_logs", 0, 100);
      return logs.map(l => JSON.parse(l));
    }

    return logsMemoria;
  } catch (error) {
    console.error("Erro ao buscar auditoria:", error);
    return [];
  }
}

module.exports = {
  logAudit,
  getAuditLogs
};