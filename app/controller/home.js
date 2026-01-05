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

  // 获取系统信息接口（跨平台）
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
}

module.exports = HomeController;
