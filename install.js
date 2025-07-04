#!/usr/bin/env node
/**
 * postinstall 脚本：根据当前操作系统&架构
 * 从 GitHub Release 下载对应的 mcpserver 二进制并解压到本包根目录
 */
const os = require('os');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const tar = require('tar');
const pkg = require('./package.json');

(async () => {
  const platMap = { darwin: 'darwin', linux: 'linux', win32: 'windows' };
  const archMap = { x64: 'amd64', arm64: 'arm64' };

  const plat = platMap[os.platform()];
  const arch = archMap[os.arch()];

  if (!plat || !arch) {
    console.error(`❌ 不支持的平台：${os.platform()} ${os.arch()}`);
    process.exit(1);
  }

  const version = pkg.version;               // 与 package.json 同步
  const fileName = `mcpserver_${version}_${plat}_${arch}.tar.gz`;
  const url = `https://github.com/luluff/mcp-server-binaries/releases/download/v${version}/${fileName}`;
  const tmp = path.join(os.tmpdir(), fileName);

  console.log('➡️  正在下载', url);
  const res = await fetch(url);
  if (!res.ok) {
    console.error('❌ 下载失败', res.status, res.statusText);
    process.exit(1);
  }
  await pipeline(res.body, fs.createWriteStream(tmp));
  console.log('✅ 下载完成，开始解压…');

  await tar.x({ file: tmp, cwd: __dirname });   // 解压到包根目录
  if (plat !== 'windows') {
    fs.chmodSync(path.join(__dirname, 'mcpserver'), 0o755);
  }
  console.log('🎉 mcpserver 安装完毕');
})().catch(err => {
  console.error('❌ 安装出错', err);
  process.exit(1);
});
