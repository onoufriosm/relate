/**
 * Configuration service for managing application settings
 * Provides centralized configuration management with environment-specific values
 */

export interface AppConfig {
  // API Configuration
  backendUrl: string;
  apiTimeout: number;
  maxRetryAttempts: number;
  retryDelay: number;
  
  // Streaming Configuration
  streamingEnabled: boolean;
  streamingTimeout: number;
  typingAnimationSpeed: number;
  
  // Chat Configuration
  maxMessageLength: number;
  autoScrollEnabled: boolean;
  
  // Development Configuration
  isDevelopment: boolean;
  debugMode: boolean;
  
  // Feature Flags
  features: {
    interrupts: boolean;
    typing: boolean;
    searchResults: boolean;
    statusMessages: boolean;
  };
}

class ConfigService {
  private static instance: ConfigService;
  private config: AppConfig;

  private constructor() {
    this.config = this.initializeConfig();
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  private initializeConfig(): AppConfig {
    const isDevelopment = import.meta.env.MODE === 'development';
    
    return {
      // API Configuration
      backendUrl: this.getEnvVar('VITE_BACKEND_URL', 'http://127.0.0.1:8000'),
      apiTimeout: this.getEnvVarNumber('VITE_API_TIMEOUT', 120000), // 2 minutes
      maxRetryAttempts: this.getEnvVarNumber('VITE_MAX_RETRY_ATTEMPTS', 3),
      retryDelay: this.getEnvVarNumber('VITE_RETRY_DELAY', 1000),
      
      // Streaming Configuration
      streamingEnabled: this.getEnvVarBoolean('VITE_STREAMING_ENABLED', true),
      streamingTimeout: this.getEnvVarNumber('VITE_STREAMING_TIMEOUT', 300000), // 5 minutes
      typingAnimationSpeed: this.getEnvVarNumber('VITE_TYPING_ANIMATION_SPEED', 20),
      
      // Chat Configuration
      maxMessageLength: this.getEnvVarNumber('VITE_MAX_MESSAGE_LENGTH', 10000),
      autoScrollEnabled: this.getEnvVarBoolean('VITE_AUTO_SCROLL_ENABLED', true),
      
      // Development Configuration
      isDevelopment,
      debugMode: this.getEnvVarBoolean('VITE_DEBUG_MODE', isDevelopment),
      
      // Feature Flags
      features: {
        interrupts: this.getEnvVarBoolean('VITE_FEATURE_INTERRUPTS', true),
        typing: this.getEnvVarBoolean('VITE_FEATURE_TYPING', true),
        searchResults: this.getEnvVarBoolean('VITE_FEATURE_SEARCH_RESULTS', true),
        statusMessages: this.getEnvVarBoolean('VITE_FEATURE_STATUS_MESSAGES', true),
      }
    };
  }

  private getEnvVar(key: string, defaultValue: string): string {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[key] || defaultValue;
    }
    return defaultValue;
  }

  private getEnvVarNumber(key: string, defaultValue: number): number {
    const value = this.getEnvVar(key, defaultValue.toString());
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  private getEnvVarBoolean(key: string, defaultValue: boolean): boolean {
    const value = this.getEnvVar(key, defaultValue.toString());
    return value.toLowerCase() === 'true';
  }

  public getConfig(): AppConfig {
    return { ...this.config };
  }

  public get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  public updateConfig(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  public isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.config.features[feature];
  }

  public isDev(): boolean {
    return this.config.isDevelopment;
  }

  public isDebug(): boolean {
    return this.config.debugMode;
  }
}

// Export singleton instance
export const configService = ConfigService.getInstance();
export default configService;