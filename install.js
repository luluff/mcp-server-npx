#!/usr/bin/env node
/**
 * postinstall：始终下载 mcpserver 最新版（按平台 + 架构匹配）
 */
const os = require('os');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const tar = require('tar');

(async () => {
  /* 平台 / 架构映射 -------------------------------------------------------- */
  const platMap = { darwin: 'darwin', linux: 'linux', win32: 'windows' };
  const archMap = { x64: 'amd64', ia32: '386', arm64: 'arm64', arm: 'armv7' };

  const plat = platMap[os.platform()];
  const arch = archMap[os.arch()];

  if (!plat || !arch) {
    console.error(`❌ 不支持的平台：${os.platform()} ${os.arch()}`);
    process.exit(1);
  }

  /* 工具函数 --------------------------------------------------------------- */
  const fileName = (v) => `mcpserver_${v}_${plat}_${arch}.tar.gz`;
  const tmpDir = os.tmpdir();

  async function download(src, dest) {
    const res = await fetch(src, { headers: { 'User-Agent': 'mcp-server-installer' } });
    if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
    await pipeline(res.body, fs.createWriteStream(dest));
  }

  async function downloadAndExtract(srcUrl, v) {
    const tmp = path.join(tmpDir, fileName(v));
    console.log('➡️  正在下载', srcUrl);
    await download(srcUrl, tmp);
    console.log('✅ 下载完成，开始解压…');
    await tar.x({ file: tmp, cwd: __dirname });     // 解压到包根目录
    if (plat !== 'windows') {
      fs.chmodSync(path.join(__dirname, 'mcpserver'), 0o755);
    }
  }

  /* 主流程 ----------------------------------------------------------------- */
  try {
    // 1. 拉取最新 release 元数据
    const latest = await fetch(
        'https://api.github.com/repos/luluff/mcp-server-binaries/releases/latest',
        { headers: { 'User-Agent': 'mcp-server-installer' } }
    ).then((r) => r.json());

    const version = latest.tag_name.replace(/^v/, '');
    const asset = latest.assets?.find((a) => a.name === fileName(version));

    if (!asset) {
      console.error('❌ 最新版本未包含当前平台二进制，请检查发布流程');
      process.exit(1);
    }

    // 2. 下载并解压
    await downloadAndExtract(asset.browser_download_url, version);
    console.log(`🎉 mcpserver ${version} 安装完毕`);
  } catch (err) {
    console.error('❌ 安装出错', err);
    process.exit(1);
  }
})();
