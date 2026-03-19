const fs = require('fs');
const https = require('https');
const path = require('path');
const readline = require('readline');

function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

function findPackageJson(startDir) {
  let currentDir = path.resolve(startDir || process.cwd());
  const root = path.parse(currentDir).root;
  
  while (true) {
    const pkgPath = path.join(currentDir, 'package.json');
    
    console.log(`Looking for package.json in: ${currentDir}`);
    
    if (fs.existsSync(pkgPath)) {
      console.log(`✓ Found package.json at: ${pkgPath}\n`);
      return pkgPath;
    }
    
    if (currentDir === root) {
      console.log('✗ Reached root directory without finding package.json\n');
      return null;
    }
    
    currentDir = path.dirname(currentDir);
  }
}

// Find package.json or use provided path
let pkgPath;
if (process.argv[2]) {
  pkgPath = process.argv[2];
} else {
  pkgPath = findPackageJson();
  if (!pkgPath) {
    console.error('Error: Could not find a package.json in this or any parent directory.');
    process.exit(1);
  }
}

const outputPath = process.argv[3] || 'package-updated.json';

function fetchLatestVersion(packageName) {
  return new Promise((resolve, reject) => {
    const url = `https://registry.npmjs.org/${packageName}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const latestVersion = json['dist-tags']?.latest;
          resolve(latestVersion || null);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function updateDependencies(deps) {
  if (!deps) return deps;
  
  const updated = {};
  const packages = Object.keys(deps);
  
  for (const pkg of packages) {
    try {
      console.log(`Fetching latest version for ${pkg}...`);
      const latestVersion = await fetchLatestVersion(pkg);
      
      if (latestVersion) {
        // Preserve the prefix (^, ~, etc.) if it exists
        const currentVersion = deps[pkg];
        const prefix = currentVersion.match(/^[\^~]/)?.[0] || '';
        updated[pkg] = `${prefix}${latestVersion}`;
        console.log(`  ${pkg}: ${deps[pkg]} → ${updated[pkg]}`);
      } else {
        updated[pkg] = deps[pkg];
        console.log(`  ${pkg}: keeping ${deps[pkg]} (couldn't fetch latest)`);
      }
    } catch (err) {
      console.error(`  Error fetching ${pkg}:`, err.message);
      updated[pkg] = deps[pkg];
    }
  }
  
  return updated;
}

async function main() {
  try {
    console.log(`Reading ${pkgPath}...`);
    const pkgContent = fs.readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(pkgContent);
    const originalPkg = JSON.parse(pkgContent);
    
    // Check if bump-changes.txt exists
    const diffPath = path.join(path.dirname(pkgPath), 'bump-changes.txt');
    if (fs.existsSync(diffPath)) {
      console.log('\n⚠️  WARNING: bump-changes.txt already exists!');
      console.log('Please make sure you have checked all functionality from the previous bump.');
      const answer = await promptUser('\nDo you really want to continue? (yes/no): ');
      
      if (answer !== 'yes' && answer !== 'y') {
        console.log('\nOperation cancelled.');
        process.exit(0);
      }
      
      console.log('\nDeleting old bump-changes.txt...');
      fs.unlinkSync(diffPath);
      console.log('✓ Deleted old bump-changes.txt\n');
    }
    
    console.log('\nUpdating dependencies...');
    pkg.dependencies = await updateDependencies(pkg.dependencies);
    
    console.log('\nUpdating devDependencies...');
    pkg.devDependencies = await updateDependencies(pkg.devDependencies);
    
    console.log(`\nWriting updated package.json to ${outputPath}...`);
    fs.writeFileSync(outputPath, JSON.stringify(pkg, null, 2) + '\n');
    
    // Create diff file
    console.log('\nGenerating bump-changes.txt...');
    const diffLines = [];
    diffLines.push('Dependency Version Changes\n');
    diffLines.push('='.repeat(50) + '\n\n');
    
    if (pkg.dependencies) {
      diffLines.push('Dependencies:\n');
      for (const [name, newVer] of Object.entries(pkg.dependencies)) {
        const oldVer = originalPkg.dependencies?.[name];
        if (oldVer !== newVer) {
          diffLines.push(`  ${name}: ${oldVer} → ${newVer}\n`);
        }
      }
      diffLines.push('\n');
    }
    
    if (pkg.devDependencies) {
      diffLines.push('Dev Dependencies:\n');
      for (const [name, newVer] of Object.entries(pkg.devDependencies)) {
        const oldVer = originalPkg.devDependencies?.[name];
        if (oldVer !== newVer) {
          diffLines.push(`  ${name}: ${oldVer} → ${newVer}\n`);
        }
      }
    }
    
    fs.writeFileSync(diffPath, diffLines.join(''));
    console.log(`✓ Changes saved to ${diffPath}`);
    
    // Overwrite original package.json
    console.log(`\nOverwriting ${pkgPath}...`);
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`✓ Updated ${pkgPath}`);
    
    // Delete temporary file
    console.log(`\nCleaning up ${outputPath}...`);
    fs.unlinkSync(outputPath);
    console.log(`✓ Deleted ${outputPath}`);
    
    console.log('\nDone! ✓');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
