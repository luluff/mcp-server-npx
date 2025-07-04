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
  const archMap = { x64: 'amd64', ia32: '386', arm64: 'arm64', arm: 'armv7' };

  const plat = platMap[os.platform()];
  const arch = archMap[os.arch()];

  if (!plat || !arch) {
    console.error(`❌ 不支持的平台：${os.platform()} ${os.arch()}`);
    process.exit(1);
  }

  let version = pkg.version;               // 与 package.json 同步
  const fileName = (v) => `mcpserver_${v}_${plat}_${arch}.tar.gz`;
  const buildUrl = (v) => `https://github.com/luluff/mcp-server-binaries/releases/download/v${v}/${fileName(v)}`;
  const tmpDir = os.tmpdir();

  async function download(src, dest) {
    const res = await fetch(src, { headers: { 'User-Agent': 'mcp-server-installer' } });
    if (!res.ok) {
      const err = new Error(`Download failed: ${res.status} ${res.statusText}`);
      err.status = res.status;
      throw err;
    }
    await pipeline(res.body, fs.createWriteStream(dest));
  }

  async function downloadAndExtract(srcUrl, v) {
    const tmp = path.join(tmpDir, fileName(v));
    console.log('➡️  正在下载', srcUrl);
    await download(srcUrl, tmp);
    console.log('✅ 下载完成，开始解压…');
    await tar.x({ file: tmp, cwd: __dirname });   // 解压到包根目录
    if (plat !== 'windows') {
      fs.chmodSync(path.join(__dirname, 'mcpserver'), 0o755);
    }
  }

  try {
    await downloadAndExtract(buildUrl(version), version);
  } catch (err) {
    if (err.status === 404) {
      // 当前版本未发布，回退到 GitHub 最新 Release
      console.log('⚠️ 指定版本资源不存在，尝试下载最新版本…');
      const latest = await fetch('https://api.github.com/repos/luluff/mcp-server-binaries/releases/latest', {
        headers: { 'User-Agent': 'mcp-server-installer' }
      }).then(r => r.json());

      version = latest.tag_name.replace(/^v/, '');
      const asset = latest.assets?.find(a => a.name === fileName(version));
      if (!asset) {
        console.error('❌ 最新版本未包含当前平台二进制，请检查发布流程');
        process.exit(1);
      }
      await downloadAndExtract(asset.browser_download_url, version);
    } else {
      console.error('❌ 下载失败', err);
      process.exit(1);
    }
  }

  console.log(`🎉 mcpserver ${version} 安装完毕`);
})().catch(err => {
  console.error('❌ 安装出错', err);
  process.exit(1);
});
