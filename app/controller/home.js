const { Controller } = require('egg');
const { exec } = require('child_process');
const { promisify } = require('util');
const os = require('os');
const execAsync = promisify(exec);

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    ctx.body = 'hi, egg';
  }

  // 添加测试CI/CD自动部署的方法
  async testCicd() {
    const { ctx } = this;
    ctx.body = {
      code: 0,
      msg: 'CI/CD自动部署测试成功',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  // 添加健康检查方法，不依赖数据库
  async health() {
    const { ctx } = this;
    ctx.body = {
      code: 0,
      msg: '应用运行正常',
      timestamp: new Date().toISOString(),
      status: 'healthy',
    };
  }

  /**
   * 获取系统信息接口（跨平台）
   * 
   * 接口路径: GET /system/info
   * 
   * 功能描述: 获取服务器的CPU、内存、磁盘、负载等核心资源数据
   * 
   * 支持平台:
   * - Linux: 使用 get_sys_info.sh 脚本获取系统信息
   * - macOS: 使用 Node.js 内置模块和系统命令获取系统信息
   * - 其他平台: 返回默认值，确保接口不会崩溃
   * 
   * 返回数据格式:
   * {
   *   code: 0,                    // 状态码，0表示成功，1表示失败
   *   msg: "获取系统信息成功",     // 状态消息
   *   data: {
   *     cpu_usage: 4.8,           // CPU使用率（百分比）
   *     mem_total: 1886,          // 总内存（MB）
   *     mem_used: 1116,           // 已用内存（MB）
   *     mem_usage: 59,            // 内存使用率（百分比）
   *     disk_total: 40,           // 总磁盘空间（GB）
   *     disk_used: 17,            // 已用磁盘空间（GB）
   *     disk_usage: 42,           // 磁盘使用率（百分比）
   *     load_1: 0.18,             // 1分钟平均负载
   *     load_5: 0.05,             // 5分钟平均负载
   *     load_15: 0.01,            // 15分钟平均负载
   *     ip_address: "192.168.1.100",  // 服务器内网IP地址
   *     os_info: "Ubuntu 20.04.3 LTS"  // 操作系统详细信息
   *   },
   *   platform: "linux",          // 操作系统平台（linux/darwin/win32等）
   *   timestamp: "2026-01-05T02:48:56.287Z"  // 数据采集时间（ISO 8601格式）
   * }
   * 
   * 使用示例:
   * curl http://localhost:7001/system/info
   * 
   * 应用场景:
   * - 服务器监控面板
   * - 系统资源告警
   * - 性能分析
   * - 运维自动化
   * 
   * 错误处理:
   * - 脚本执行失败时返回 code: 1 和错误信息
   * - JSON解析失败时返回 code: 1 和错误信息
   * - HTTP状态码: 200（成功）或 500（失败）
   */
  /**
   * 获取系统信息
   * 
   * 接口路径: GET /system/info
   * 
   * 功能描述: 获取服务器的CPU、内存、磁盘、负载、网络流量等核心资源数据
   * 
   * 支持平台:
   * - Linux: 使用 get_sys_info.sh 脚本获取系统信息
   * - macOS: 使用 Node.js 内置模块和系统命令获取系统信息
   * - 其他平台: 返回默认值，确保接口不会崩溃
   * 
   * 返回数据格式:
   * {
   *   code: 0,                    // 状态码：0表示成功，1表示失败
   *   msg: "获取系统信息成功",    // 状态消息
   *   data: {
   *     cpu_usage: 4.8,          // CPU使用率（百分比）
   *     mem_total: 1886,         // 总内存（MB）
   *     mem_used: 1116,          // 已用内存（MB）
   *     mem_usage: 59,           // 内存使用率（百分比）
   *     disk_total: 40,          // 总磁盘空间（GB）
   *     disk_used: 17,           // 已用磁盘空间（GB）
   *     disk_usage: 42,          // 磁盘使用率（百分比）
   *     load_1: 0.18,            // 1分钟平均负载
   *     load_5: 0.05,            // 5分钟平均负载
   *     load_15: 0.01,           // 15分钟平均负载
   *     uptime_days: 12.5,        // 服务器运行时间（天数，保留2位小数）
   *     network_interface: "eth0",  // 网络接口名称
   *     network_rx_bytes: 1234567890,  // 网络接收字节数（bytes）
   *     network_tx_bytes: 987654321,   // 网络发送字节数（bytes）
   *     network_rx_mb: 1177.38,   // 网络接收流量（MB）
   *     network_tx_mb: 941.90,    // 网络发送流量（MB）
   *     ip_address: "192.168.1.100",  // 服务器IP地址
   *     os_info: "Ubuntu 20.04.3 LTS"  // 操作系统详细信息
   *   },
   *   platform: "linux",          // 操作系统平台（linux/darwin/win32等）
   *   timestamp: "2026-01-05T02:48:56.287Z"  // 数据采集时间（ISO 8601格式）
   }
   * 
   * 使用示例:
   * curl http://localhost:7001/system/info
   * 
   * 应用场景:
   * - 服务器监控面板
   * - 系统资源告警
   * - 性能分析
   * - 运维自动化
   * - 网络流量监控
   * 
   * 错误处理:
   * - 脚本执行失败时返回 code: 1 和错误信息
   * - JSON解析失败时返回 code: 1 和错误信息
   * - HTTP状态码: 200（成功）或 500（失败）
   */
  async getSystemInfo() {
    const { ctx } = this;
    
    try {
      const platform = os.platform();
      let systemInfo;

      if (platform === 'linux') {
        // Linux系统：执行shell脚本
        const projectRoot = process.cwd();
        const scriptPath = `${projectRoot}/get_sys_info.sh`;
        const { stdout, stderr } = await execAsync(`bash ${scriptPath}`);
        
        if (stderr) {
          ctx.logger.warn('执行系统信息脚本警告:', stderr);
        }
        
        systemInfo = JSON.parse(stdout.trim());
      } else {
        // macOS或其他系统：使用Node.js内置模块获取信息
        systemInfo = await this.getSystemInfoNodeJS();
      }
      
      // 获取IP地址
      const ipAddress = await this.getIPAddress();
      
      // 获取操作系统详细信息
      const osInfo = await this.getOSInfo(platform);
      
      // 添加IP和系统信息到返回数据
      systemInfo.ip_address = ipAddress;
      systemInfo.os_info = osInfo;
      
      ctx.body = {
        code: 0,
        msg: '获取系统信息成功',
        data: systemInfo,
        platform: platform,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      ctx.logger.error('获取系统信息失败:', error);
      ctx.body = {
        code: 1,
        msg: '获取系统信息失败',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
      ctx.status = 500;
    }
  }

  // 使用Node.js获取系统信息（跨平台）
  async getSystemInfoNodeJS() {
    const platform = os.platform();
    const cpus = os.cpus();
    const totalmem = os.totalmem();
    const freemem = os.freemem();
    const usedmem = totalmem - freemem;
    
    // 获取服务器运行时间（天数）
    // os.uptime() 返回系统运行时间（秒）
    const uptimeSeconds = os.uptime();
    // 转换为天数（保留2位小数）
    const uptimeDays = parseFloat((uptimeSeconds / 86400).toFixed(2));
    
    // CPU使用率（简化计算）
    const cpuUsage = await this.getCPUUsage();
    
    // 内存使用情况（单位：MB）
    const memTotal = Math.round(totalmem / 1024 / 1024);
    const memUsed = Math.round(usedmem / 1024 / 1024);
    const memUsage = parseFloat((memUsed / memTotal * 100).toFixed(2));
    
    // 磁盘使用情况（单位：GB）
    let diskTotal, diskUsed, diskUsage;
    
    if (platform === 'darwin') {
      // macOS
      try {
        const { stdout } = await execAsync('df -h / | tail -1');
        const parts = stdout.trim().split(/\s+/);
        diskTotal = parseFloat(parts[1]);
        diskUsed = parseFloat(parts[2]);
        // 转换为GB
        if (parts[1].includes('T')) {
          diskTotal *= 1024;
          diskUsed *= 1024;
        }
        diskUsage = parseFloat((diskUsed / diskTotal * 100).toFixed(2));
      } catch (error) {
        diskTotal = 0;
        diskUsed = 0;
        diskUsage = 0;
      }
    } else if (platform === 'linux') {
      // Linux
      try {
        const { stdout } = await execAsync('df -BG / | tail -1');
        const parts = stdout.trim().split(/\s+/);
        diskTotal = parseInt(parts[1].replace('G', ''));
        diskUsed = parseInt(parts[2].replace('G', ''));
        diskUsage = parseFloat((diskUsed / diskTotal * 100).toFixed(2));
      } catch (error) {
        diskTotal = 0;
        diskUsed = 0;
        diskUsage = 0;
      }
    } else {
      // 其他平台，返回默认值
      diskTotal = 0;
      diskUsed = 0;
      diskUsage = 0;
    }
    
    // 系统负载
    let load1, load5, load15;
    if (platform === 'linux') {
      try {
        const { stdout } = await execAsync('cat /proc/loadavg');
        const parts = stdout.trim().split(/\s+/);
        load1 = parseFloat(parts[0]);
        load5 = parseFloat(parts[1]);
        load15 = parseFloat(parts[2]);
      } catch (error) {
        load1 = 0;
        load5 = 0;
        load15 = 0;
      }
    } else if (platform === 'darwin') {
      // macOS
      try {
        const { stdout } = await execAsync('uptime');
        const match = stdout.match(/load averages?: ([\d.]+) ([\d.]+) ([\d.]+)/);
        if (match) {
          load1 = parseFloat(match[1]);
          load5 = parseFloat(match[2]);
          load15 = parseFloat(match[3]);
        } else {
          load1 = 0;
          load5 = 0;
          load15 = 0;
        }
      } catch (error) {
        load1 = 0;
        load5 = 0;
        load15 = 0;
      }
    } else {
      load1 = 0;
      load5 = 0;
      load15 = 0;
    }
    
    // 获取网络流量信息
    let networkInterface = '';
    let networkRxBytes = 0;
    let networkTxBytes = 0;
    let networkRxMb = 0;
    let networkTxMb = 0;
    
    if (platform === 'darwin') {
      // macOS: 使用 ifconfig 替代 netstat，获取更快的网络流量信息
      try {
        // 获取默认网络接口
        const { stdout: defaultIface } = await execAsync('route get default | grep interface | awk "{print $2}"');
        const networkInterface = defaultIface.trim() || 'en0';
        
        // 使用ifconfig获取指定接口的流量信息
        const { stdout: ifconfigOutput } = await execAsync(`ifconfig ${networkInterface}`);
        
        // 解析接收字节数（RX bytes）和发送字节数（TX bytes）
        const rxMatch = ifconfigOutput.match(/RX bytes:(\d+)/i);
        const txMatch = ifconfigOutput.match(/TX bytes:(\d+)/i);
        
        const networkRxBytes = rxMatch ? parseInt(rxMatch[1]) : 0;
        const networkTxBytes = txMatch ? parseInt(txMatch[1]) : 0;
        const networkRxMb = parseFloat((networkRxBytes / 1024 / 1024).toFixed(2));
        const networkTxMb = parseFloat((networkTxBytes / 1024 / 1024).toFixed(2));
        
        return {
          cpu_usage: cpuUsage,
          mem_total: memTotal,
          mem_used: memUsed,
          mem_usage: memUsage,
          disk_total: diskTotal,
          disk_used: diskUsed,
          disk_usage: diskUsage,
          load_1: load1,
          load_5: load5,
          load_15: load15,
          uptime_days: uptimeDays,
          network_interface: networkInterface,
          network_rx_bytes: networkRxBytes,
          network_tx_bytes: networkTxBytes,
          network_rx_mb: networkRxMb,
          network_tx_mb: networkTxMb,
        };
      } catch (error) {
        console.error('获取macOS网络流量失败:', error);
      }
    } else if (platform === 'linux') {
      // Linux: 读取 /proc/net/dev
      try {
        const { stdout } = await execAsync('cat /proc/net/dev');
        const lines = stdout.trim().split('\n');
        // 跳过表头
        for (let i = 2; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line) {
            const colonIndex = line.indexOf(':');
            const iface = line.substring(0, colonIndex).trim();
            const data = line.substring(colonIndex + 1).trim().split(/\s+/);
            
            // 接收字节数是第一个字段，发送字节数是第9个字段
            const rx = parseInt(data[0]) || 0;
            const tx = parseInt(data[8]) || 0;
            
            // 跳过回环接口
            if (iface !== 'lo' && rx > 0) {
              networkInterface = iface;
              networkRxBytes = rx;
              networkTxBytes = tx;
              networkRxMb = parseFloat((rx / 1024 / 1024).toFixed(2));
              networkTxMb = parseFloat((tx / 1024 / 1024).toFixed(2));
              break;
            }
          }
        }
      } catch (error) {
        console.error('获取Linux网络流量失败:', error);
      }
    }
    
    return {
      cpu_usage: cpuUsage,
      mem_total: memTotal,
      mem_used: memUsed,
      mem_usage: memUsage,
      disk_total: diskTotal,
      disk_used: diskUsed,
      disk_usage: diskUsage,
      load_1: load1,
      load_5: load5,
      load_15: load15,
      uptime_days: uptimeDays,
      network_interface: networkInterface,
      network_rx_bytes: networkRxBytes,
      network_tx_bytes: networkTxBytes,
      network_rx_mb: networkRxMb,
      network_tx_mb: networkTxMb,
    };
  }

  // 获取CPU使用率
  async getCPUUsage() {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        total += cpu.times[type];
      }
      idle += cpu.times.idle;
    });
    
    return parseFloat(((total - idle) / total * 100).toFixed(2));
  }

  /**
   * 获取服务器IP地址
   * 获取服务器IP地址
   * 从请求头中动态获取公网IP地址
   */
  async getIPAddress() {
    try {
      // 从请求头中获取真实IP地址（处理代理和负载均衡器的情况）
      const request = this.ctx.request;
      const headers = request.headers;
      
      // 优先检查常用的代理头
      const ipAddress = headers['x-forwarded-for'] || // 代理服务器头
                       headers['x-real-ip'] || // Nginx头
                       headers['cf-connecting-ip'] || // Cloudflare头
                       request.ip || // Egg.js默认IP
                       '127.0.0.1';
      
      // 将IP地址分割成数组，处理多个IP的情况
      const ipList = ipAddress.split(',').map(ip => ip.trim());
      
      // 遍历所有IP地址，查找有效的公网IP
      for (const ip of ipList) {
        // 验证是否是有效的IP地址
        const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
        if (ipRegex.test(ip)) {
          // 检查是否是回环地址或内网地址
          const isLoopback = ip === '127.0.0.1' || ip === '::1';
          const isPrivate = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(ip);
          
          // 如果不是回环地址和内网地址，就返回它
          if (!isLoopback && !isPrivate) {
            return ip;
          }
        }
      }
      
      // 如果没有找到有效的公网IP，使用配置中的公网IP作为备选
      const knownPublicIp = '120.48.95.51';
      if (knownPublicIp) {
        return knownPublicIp;
      }
      
      // 如果都失败了，返回本地回环地址
      return '127.0.0.1';
    } catch (error) {
      console.error('获取IP地址失败:', error);
      // 错误时使用配置中的公网IP作为备选
      return '120.48.95.51';
    }
  }

  /**
   * 获取操作系统详细信息
   * @param {string} platform - 操作系统平台（linux/darwin/win32等）
   */
  async getOSInfo(platform) {
    try {
      if (platform === 'linux') {
        // Linux系统：读取/etc/os-release文件获取发行版信息
        try {
          const { stdout } = await execAsync('cat /etc/os-release');
          const lines = stdout.split('\n');
          let osName = '';
          let osVersion = '';
          
          for (const line of lines) {
            if (line.startsWith('NAME=')) {
              osName = line.match(/NAME="([^"]+)"/)?.[1] || line.match(/NAME=([^"]+)/)?.[1] || '';
            } else if (line.startsWith('VERSION=')) {
              osVersion = line.match(/VERSION="([^"]+)"/)?.[1] || line.match(/VERSION=([^"]+)/)?.[1] || '';
            }
          }
          
          if (osName) {
            return osVersion ? `${osName} ${osVersion}` : osName;
          }
          
          // 如果/etc/os-release不存在，尝试其他方法
          try {
            const { stdout: lsbOutput } = await execAsync('lsb_release -a 2>/dev/null || cat /etc/issue 2>/dev/null');
            return lsbOutput.trim().split('\n')[0];
          } catch (e) {
            return 'Linux';
          }
        } catch (error) {
          return 'Linux';
        }
      } else if (platform === 'darwin') {
        // macOS系统：使用sw_vers命令获取系统版本
        try {
          const { stdout } = await execAsync('sw_vers');
          const lines = stdout.split('\n');
          const productName = lines[0]?.split(':')[1]?.trim() || '';
          const productVersion = lines[1]?.split(':')[1]?.trim() || '';
          return `${productName} ${productVersion}`;
        } catch (error) {
          return 'macOS';
        }
      } else if (platform === 'win32') {
        // Windows系统
        try {
          const { stdout } = await execAsync('systeminfo | findstr /B /C:"OS Name" /C:"OS Version"');
          return stdout.trim().replace(/OS Name:\s*/, '').replace(/OS Version:\s*/, ' ');
        } catch (error) {
          return 'Windows';
        }
      } else {
        return platform;
      }
    } catch (error) {
      console.error('获取操作系统信息失败:', error);
      return platform;
    }
  }
}

module.exports = HomeController;
