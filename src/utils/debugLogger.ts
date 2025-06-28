// ✅ Utilitaire centralisé pour les logs de debug
interface DebugLogEntry {
  email?: string;
  step: string;
  status: 'success' | 'error' | 'info';
  timestamp: string;
  error?: string;
  data?: any;
}

export class DebugLogger {
  private static readonly STORAGE_KEY = 'signup-debug-log';
  private static readonly MAX_LOGS = 50;

  static log(entry: Omit<DebugLogEntry, 'timestamp'>) {
    const logEntry: DebugLogEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    };

    // Console log avec couleurs
    const emoji = entry.status === 'success' ? '✅' : entry.status === 'error' ? '❌' : 'ℹ️';
    console.log(`${emoji} SIGNUP DEBUG [${logEntry.timestamp}]:`, entry.step, entry.data || '');

    // Stocker dans localStorage
    try {
      const existingLogs = this.getLogs();
      existingLogs.push(logEntry);
      
      // Garder seulement les derniers logs
      const trimmedLogs = existingLogs.slice(-this.MAX_LOGS);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedLogs));
    } catch (error) {
      console.error('Error storing debug log:', error);
    }
  }

  static getLogs(): DebugLogEntry[] {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    } catch (error) {
      console.error('Error reading debug logs:', error);
      return [];
    }
  }

  static clearLogs() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  static exportLogs() {
    const logs = this.getLogs();
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `signup-debug-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}