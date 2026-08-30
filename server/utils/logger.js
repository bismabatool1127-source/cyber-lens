/** Console logger that must never receive user-submitted content. */

const isDev = process.env.NODE_ENV !== 'production';

function log(level, msg, meta) {
  const line = `[${new Date().toISOString()}] [${level}] ${msg}`;
  if (level === 'error') console.error(line, meta ?? '');
  else if (isDev) console.log(line, meta ?? '');
}

export const logger = {
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
};
