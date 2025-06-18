const { spawn } = require('child_process');
const { performance } = require('perf_hooks');

/**
 * Конфигурация кластера
 */
const CLUSTER_CONFIG = {
  instances: 5,
  startPort: 3000,
  instances: [
    { port: 3000, name: 'Instance-1' },
    { port: 3001, name: 'Instance-2' },
    { port: 3002, name: 'Instance-3' },
    { port: 3003, name: 'Instance-4' },
    { port: 3004, name: 'Instance-5' }
  ]
};

/**
 * Класс для управления кластером
 */
class ClusterManager {
  constructor() {
    this.processes = new Map();
    this.startTime = null;
  }

  /**
   * Запуск одного инстанса
   */
  startInstance(instanceConfig) {
    console.log(`🚀 Starting ${instanceConfig.name} on port ${instanceConfig.port}...`);
    
    const env = {
      ...process.env,
      PORT: instanceConfig.port.toString(),
      NODE_ENV: 'development',
      INSTANCE_NAME: instanceConfig.name
    };

    const child = spawn('node', ['src/server.js'], {
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false
    });

    // Обработка вывода
    child.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`[${instanceConfig.name}] ${output}`);
      }
    });

    child.stderr.on('data', (data) => {
      const error = data.toString().trim();
      if (error) {
        console.error(`[${instanceConfig.name}] ERROR: ${error}`);
      }
    });

    // Обработка завершения процесса
    child.on('close', (code) => {
      console.log(`[${instanceConfig.name}] Process exited with code ${code}`);
      this.processes.delete(instanceConfig.port);
      
      if (this.processes.size === 0) {
        console.log('🛑 All instances stopped');
        process.exit(0);
      }
    });

    // Обработка ошибок
    child.on('error', (error) => {
      console.error(`[${instanceConfig.name}] Failed to start:`, error.message);
    });

    this.processes.set(instanceConfig.port, {
      process: child,
      config: instanceConfig,
      startTime: Date.now()
    });

    return child;
  }

  /**
   * Запуск всего кластера
   */
  async startCluster() {
    console.log('🏗️  Starting application cluster...');
    console.log(`📊 Configuration: ${CLUSTER_CONFIG.instances.length} instances`);
    console.log(`🌐 Ports: ${CLUSTER_CONFIG.instances.map(i => i.port).join(', ')}`);
    
    this.startTime = performance.now();

    // Запускаем все инстансы с небольшой задержкой
    for (let i = 0; i < CLUSTER_CONFIG.instances.length; i++) {
      const instance = CLUSTER_CONFIG.instances[i];
      
      // Задержка между запусками для избежания конфликтов
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      this.startInstance(instance);
    }

    console.log('\n✅ Cluster startup initiated');
    console.log('📋 Monitoring instances...\n');

    // Мониторинг состояния кластера
    this.startMonitoring();
  }

  /**
   * Мониторинг состояния кластера
   */
  startMonitoring() {
    const monitorInterval = setInterval(() => {
      const runningInstances = this.processes.size;
      const totalInstances = CLUSTER_CONFIG.instances.length;
      
      console.log(`📊 Cluster Status: ${runningInstances}/${totalInstances} instances running`);
      
      // Показываем информацию о каждом инстансе
      this.processes.forEach((instance, port) => {
        const uptime = Math.floor((Date.now() - instance.startTime) / 1000);
        console.log(`  🟢 ${instance.config.name} (port ${port}) - uptime: ${uptime}s`);
      });
      
      console.log(''); // Пустая строка для читаемости
      
      // Если все инстансы остановлены, прекращаем мониторинг
      if (runningInstances === 0) {
        clearInterval(monitorInterval);
      }
    }, 10000); // Каждые 10 секунд

    // Обработка сигналов завершения
    process.on('SIGINT', () => this.stopCluster());
    process.on('SIGTERM', () => this.stopCluster());
  }

  /**
   * Остановка кластера
   */
  async stopCluster() {
    console.log('\n🛑 Stopping cluster...');
    
    const stopPromises = Array.from(this.processes.values()).map(instance => {
      return new Promise((resolve) => {
        console.log(`🛑 Stopping ${instance.config.name}...`);
        instance.process.kill('SIGTERM');
        
        // Ждем завершения процесса
        instance.process.on('close', () => {
          console.log(`✅ ${instance.config.name} stopped`);
          resolve();
        });
        
        // Принудительное завершение через 5 секунд
        setTimeout(() => {
          if (!instance.process.killed) {
            instance.process.kill('SIGKILL');
            console.log(`💀 ${instance.config.name} force killed`);
            resolve();
          }
        }, 5000);
      });
    });

    await Promise.all(stopPromises);
    
    const duration = (performance.now() - this.startTime) / 1000;
    console.log(`\n✅ Cluster stopped. Total uptime: ${duration.toFixed(2)}s`);
    process.exit(0);
  }

  /**
   * Получение статуса кластера
   */
  getStatus() {
    return {
      totalInstances: CLUSTER_CONFIG.instances.length,
      runningInstances: this.processes.size,
      instances: Array.from(this.processes.values()).map(instance => ({
        name: instance.config.name,
        port: instance.config.port,
        uptime: Math.floor((Date.now() - instance.startTime) / 1000)
      }))
    };
  }
}

/**
 * Основная функция
 */
async function main() {
  const cluster = new ClusterManager();
  
  try {
    await cluster.startCluster();
  } catch (error) {
    console.error('💥 Failed to start cluster:', error);
    process.exit(1);
  }
}

// Запуск если файл выполняется напрямую
if (require.main === module) {
  main();
}

module.exports = ClusterManager; 