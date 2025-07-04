#!/usr/bin/env node
/**
 * 启动 mcpserver，可把接收到的全部 CLI 参数透传给二进制
 */
const { spawn } = require('child_process');
const { join } = require('path');
const { existsSync } = require('fs');

const exe = join(__dirname, process.platform === 'win32' ? 'mcpserver.exe' : 'mcpserver');

if (!existsSync(exe)) {
    console.error('❌ 找不到 mcpserver 可执行文件，请重新安装包！');
    process.exitCode = 1;
    return;
}

const child = spawn(exe, process.argv.slice(2), { stdio: 'inherit' });

child.on('error', (err) => {
    console.error('❌ 启动 mcpserver 失败：', err);
    process.exitCode = 1;
});

child.on('exit', (code, signal) => {
    if (signal) {
        // 让当前进程以相同信号退出，方便上层脚本捕获
        process.kill(process.pid, signal);
    } else {
        process.exitCode = code ?? 0;
    }
});
