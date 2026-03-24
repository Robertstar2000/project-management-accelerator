
const LOG_BUFFER: string[] = [`# System Logs - Session Started: ${new Date().toISOString()}`];

export const logAction = (action: string, element: string, details: any = {}) => {
  try {
    // Create a sanitized copy of details to avoid memory bloat from large strings (base64, long content)
    const sanitize = (obj: any): any => {
      if (!obj) return obj;
      if (typeof obj !== 'object') return obj;
      
      // Handle arrays
      if (Array.isArray(obj)) {
        return obj.map(item => sanitize(item));
      }

      const newObj: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          
          // Truncate long strings (likely content or base64)
          if (typeof value === 'string' && value.length > 200) {
            newObj[key] = `${value.substring(0, 50)}... [TRUNCATED ${value.length} chars]`;
          } 
          // Recursively sanitize objects
          else if (typeof value === 'object') {
             if (key === 'phasesData' || key === 'documents' || key === 'images' || key === 'attachments') {
                 newObj[key] = '[DATA OMITTED FOR LOGGING]';
             } else {
                 newObj[key] = sanitize(value);
             }
          } else {
            newObj[key] = value;
          }
        }
      }
      return newObj;
    };

    const sanitizedDetails = sanitize(details);
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      element,
      state: sanitizedDetails,
    };
    
    const logString = `- **[${logEntry.timestamp}]** \`${action}\` @ *${element}*: ${JSON.stringify(sanitizedDetails)}`;
    
    // Add to buffer
    LOG_BUFFER.push(logString);

    // Use requestIdleCallback if available to not block main thread
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
            console.log('HMAP_LOG:', logEntry);
        });
    } else {
        console.log('HMAP_LOG:', logEntry);
    }
  } catch (error) {
    console.error('Error during logging:', error);
  }
};

export const downloadLogs = () => {
    try {
        const content = LOG_BUFFER.join('\n');
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `hmap-debug-logs-${Date.now()}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Failed to download logs", e);
    }
};
