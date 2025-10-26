const winston = require('winston');

// Define os níveis e cores dos logs
const logConfig = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
  },
};

winston.addColors(logConfig.colors);

// Formato do log
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }), // Colore a saída do console
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`
  )
);

// Formato do log para arquivos (JSON)
const fileLogFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json() // Salva em JSON para ser fácil de analisar
);

// Define os "transportes" (para onde os logs irão)
const transports = [
  // Sempre logar no console
  new winston.transports.Console({
    format: logFormat,
  }),
];

// Se NÃO estivermos em produção, também salvar em arquivos
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log', // Salva apenas erros neste arquivo
      level: 'error',
      format: fileLogFormat,
    })
  );
  transports.push(
    new winston.transports.File({
      filename: 'logs/all.log', // Salva tudo (até 'debug') neste arquivo
      level: 'debug',
      format: fileLogFormat,
    })
  );
}

// Cria e exporta a instância do logger
const logger = winston.createLogger({
  levels: logConfig.levels,
  level: process.env.NODE_ENV === 'production' ? 'http' : 'debug', // Nível de log
  transports,
  exitOnError: false, // Não para a aplicação em caso de erro no logger
});

module.exports = logger;