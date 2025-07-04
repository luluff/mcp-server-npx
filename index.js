#!/usr/bin/env node
/**
 * 启动 mcpserver，可把接收到的全部 CLI 参数透传给二进制
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const exe = path.join(__dirname,
    process.platform === 'win32' ? 'mcpserver.exe' : 'mcpserver');

if (!fs.existsSync(exe)) {
    console.error('❌ 找不到 mcpserver 可执行文件，请重新安装包！');
    process.exit(1);
}

const child = spawn(exe, process.argv.slice(2), { stdio: 'inherit' });
child.on('exit', code => process.exit(code));
