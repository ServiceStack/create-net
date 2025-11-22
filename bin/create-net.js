#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const AdmZip = require('adm-zip');

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error('Usage: npx create-net <repo|ls> [ProjectName]');
  console.error('');
  console.error('Commands:');
  console.error('  ls [org]            List available project templates');
  console.error('  <repo> [name]       Create a project from a template');
  console.error('');
  console.error('If ProjectName is not specified, uses current directory name and extracts into current directory.');
  console.error('');
  console.error('Examples:');
  console.error('  npx create-net ls');
  console.error('  npx create-net ls <organization>');
  console.error('  npx create-net <template> ProjectName');
  console.error('  npx create-net <organization>/<template> ProjectName');
  console.error('  npx create-net <template>  (uses current directory name)');
  process.exit(1);
}

// Handle ls command to list available templates
if (args[0] === 'ls' || args[0] === 'list') {
  const targetOrg = args[1]; // Optional organization/user name
  listTemplates(targetOrg);
  return;
}

const repo = args[0];
let projectName = args[1];
let extractToCurrentDir = false;

// If no project name specified, use current directory name
if (!projectName) {
  projectName = path.basename(process.cwd());
  extractToCurrentDir = true;
  console.log(`No project name specified, using current directory name: "${projectName}"`);
}

// Determine organization and repository
let organization = 'NetCoreTemplates';
let repository = repo;

if (repo.includes('/')) {
  const parts = repo.split('/');
  organization = parts[0];
  repository = parts[1];
}

// Construct GitHub archive URL
const archiveUrl = `https://github.com/${organization}/${repository}/archive/refs/heads/main.zip`;
const tempZipPath = path.join(process.cwd(), 'temp-download.zip');
const projectPath = extractToCurrentDir ? process.cwd() : path.join(process.cwd(), projectName);

console.log(`Creating project "${projectName}" from ${organization}/${repository}...`);
console.log(`Downloading from: ${archiveUrl}`);

// Check if project directory already exists (only when creating a new directory)
if (!extractToCurrentDir && fs.existsSync(projectPath)) {
  console.error(`Error: Directory "${projectName}" already exists.`);
  process.exit(1);
}

// Check if current directory is not empty (when extracting to current dir)
if (extractToCurrentDir) {
  const currentDirContents = fs.readdirSync(process.cwd()).filter(item =>
    item !== 'node_modules' &&
    item !== '.git' &&
    !item.startsWith('.')
  );

  if (currentDirContents.length > 0) {
    console.error(`Error: Current directory is not empty. Please run this command in an empty directory.`);
    console.error(`Found: ${currentDirContents.join(', ')}`);
    process.exit(1);
  }
}

// Function to fetch JSON from GitHub API
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'create-net'
      }
    }, (response) => {
      let data = '';

      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        return fetchJSON(response.headers.location).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        return reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
      }

      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

// Function to list available templates
async function listTemplates(targetOrg) {
  console.log('Fetching available project templates...\n');

  let organizations;

  if (targetOrg) {
    // List templates from specific organization
    organizations = [{ name: targetOrg, title: `${targetOrg} Templates` }];
  } else {
    // List templates from default organizations
    organizations = [
      { name: 'NetCoreTemplates', title: '.NET Templates' },
    ];
  }

  try {
    for (const org of organizations) {
      console.log(`\x1b[1m${org.title}\x1b[0m`);
      console.log('─'.repeat(80));

      try {
        const repos = await fetchJSON(`https://api.github.com/orgs/${org.name}/repos?per_page=100&sort=updated`);

        if (!repos || repos.length === 0) {
          console.log('  No templates found');
        } else {
          // Find the longest repo name for padding
          const maxNameLength = Math.max(...repos.map(r => r.name.length));
          const padding = Math.max(maxNameLength + 2, 25);

          repos.forEach(repo => {
            const name = repo.name.padEnd(padding);
            const description = repo.description || 'No description available';
            console.log(`  ${name}  ${description}`);
          });
        }
      } catch (err) {
        console.log(`  Error fetching templates: ${err.message}`);
      }

      console.log('');
    }

    console.log('\x1b[1mUsage:\x1b[0m');
    console.log('  npx create-net <repo> [ProjectName]');
    console.log('  npx create-net <org>/<repo> [ProjectName]');
    console.log('  npx create-net ls [org]');
    console.log('\n\x1b[1mExamples:\x1b[0m');
    console.log('  npx create-net ls                            # List all templates');
    console.log('  npx create-net ls <org>                      # List specific org templates');
    console.log('  npx create-net <template> ProjectName        # Create from NetCoreTemplates');
    console.log('  npx create-net <org>/<template> ProjectName  # Create from specific org');

  } catch (err) {
    console.error('Error listing templates:', err.message);
    process.exit(1);
  }
}

// Function to download file from URL
function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);

    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(destination);
        return downloadFile(response.headers.location, destination)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destination);
        return reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      fs.unlinkSync(destination);
      reject(err);
    });
  });
}

// Function to convert string to different case variations
function getNameVariations(name) {
  // Convert ProjectName to different formats

  // Split by capital letters to get words
  const words = name.split(/(?=[A-Z])/).filter(w => w.length > 0);

  return {
    // my_app
    snake_case: words.map(w => w.toLowerCase()).join('_'),
    // my-app
    kebab_case: words.map(w => w.toLowerCase()).join('-'),
    // myapp
    lowercase: words.map(w => w.toLowerCase()).join(''),
    // my.app
    dot_case: words.map(w => w.toLowerCase()).join('.'),
    // My_App
    pascal_snake: words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('_'),
    // My App
    title_space: words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
    // MyApp (PascalCase)
    pascal_case: words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('')
  };
}

// Function to replace content in text files
function replaceInFile(filePath, replacements) {
  // Skip binary files
  const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.zip', '.exe', '.dll', '.so', '.dylib', '.pdf', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.webm', '.ogg', '.mp3', '.wav'];
  const ext = path.extname(filePath).toLowerCase();

  if (binaryExtensions.includes(ext)) {
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    for (const [oldStr, newStr] of Object.entries(replacements)) {
      if (content.includes(oldStr)) {
        content = content.split(oldStr).join(newStr);
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
  } catch (err) {
    // If file is binary or can't be read as text, skip it
    if (err.code !== 'ENOENT') {
      // Silently skip files that can't be processed
    }
  }
}

// Function to rename files and directories
function renamePathsRecursive(dirPath, replacements) {
  const items = fs.readdirSync(dirPath);

  // Process files and directories
  for (const item of items) {
    const oldPath = path.join(dirPath, item);
    const stats = fs.statSync(oldPath);

    if (stats.isDirectory()) {
      // Recursively process directory first
      renamePathsRecursive(oldPath, replacements);
    } else {
      // Replace content in files
      replaceInFile(oldPath, replacements);
    }
  }

  // Rename files and directories in this directory
  for (const item of items) {
    const oldPath = path.join(dirPath, item);
    let newName = item;

    // Apply replacements to the name
    for (const [oldStr, newStr] of Object.entries(replacements)) {
      if (newName.includes(oldStr)) {
        newName = newName.split(oldStr).join(newStr);
      }
    }

    if (newName !== item) {
      const newPath = path.join(dirPath, newName);
      fs.renameSync(oldPath, newPath);
      console.log(`Renamed: ${item} -> ${newName}`);
    }
  }
}

// Function to find and run npm install in directories with package.json
function runNpmInstall(dirPath) {
  const items = fs.readdirSync(dirPath);

  // Check if current directory has package.json
  if (items.includes('package.json')) {
    console.log(`Running npm install in ${dirPath}...`);
    try {
      execSync('npm install', {
        cwd: dirPath,
        stdio: 'inherit'
      });
    } catch (err) {
      console.error(`Warning: npm install failed in ${dirPath}`);
    }
  }

  // Recursively check subdirectories
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory() && item !== 'node_modules' && item !== '.git') {
      runNpmInstall(itemPath);
    }
  }
}

// Main execution
async function main() {
  try {
    // Download the archive
    console.log('Downloading archive...');
    await downloadFile(archiveUrl, tempZipPath);
    console.log('Download complete!');

    // Extract the archive
    console.log('Extracting archive...');
    const zip = new AdmZip(tempZipPath);
    const zipEntries = zip.getEntries();

    // Get the root folder name from the zip (usually repo-main)
    const rootFolder = zipEntries[0].entryName.split('/')[0];

    // Extract to temporary location
    const tempExtractPath = path.join(process.cwd(), 'temp-extract');
    zip.extractAllTo(tempExtractPath, true);

    const extractedPath = path.join(tempExtractPath, rootFolder);

    if (extractToCurrentDir) {
      // Move contents of extracted folder to current directory
      const items = fs.readdirSync(extractedPath);
      for (const item of items) {
        const srcPath = path.join(extractedPath, item);
        const destPath = path.join(projectPath, item);
        fs.renameSync(srcPath, destPath);
      }
    } else {
      // Move the extracted folder to the project name
      fs.renameSync(extractedPath, projectPath);
    }

    // Clean up temp extract directory
    fs.rmSync(tempExtractPath, { recursive: true, force: true });

    // Clean up temp zip file
    fs.unlinkSync(tempZipPath);

    console.log('Extraction complete!');

    // Prepare replacements
    console.log('Replacing template names with project name...');

    const sourceVariations = getNameVariations('MyApp');
    const targetVariations = getNameVariations(projectName);

    const replacements = {
      [sourceVariations.pascal_snake]: targetVariations.pascal_snake,  // My_App => Acme_Corp
      [sourceVariations.title_space]: targetVariations.title_space,    // My App => Acme Corp
      [sourceVariations.kebab_case]: targetVariations.kebab_case,      // my-app => acme-corp
      [sourceVariations.snake_case]: targetVariations.snake_case,      // my_app => acme_corp
      [sourceVariations.lowercase]: targetVariations.lowercase,        // myapp => acmecorp
      [sourceVariations.dot_case]: targetVariations.dot_case,          // my.app => acme.corp
      [sourceVariations.pascal_case]: targetVariations.pascal_case     // MyApp => AcmeCorp
    };

    // Apply replacements to all files and rename paths
    renamePathsRecursive(projectPath, replacements);

    console.log('Template name replacement complete!');

    // Run npm install in all directories with package.json
    console.log('Installing dependencies...');
    runNpmInstall(projectPath);

    console.log('\n✓ Project created successfully!');

    if (!extractToCurrentDir) {
      console.log(`\nNext steps:`);
      console.log(`  cd ${projectName}`);
      console.log(`  npm start (or appropriate command for your template)`);
    } else {
      console.log(`\nNext steps:`);
      console.log(`  npm start (or appropriate command for your template)`);
    }

  } catch (err) {
    console.error('Error creating project:', err.message);

    // Clean up on error
    if (fs.existsSync(tempZipPath)) {
      fs.unlinkSync(tempZipPath);
    }
    if (fs.existsSync(projectPath)) {
      fs.rmSync(projectPath, { recursive: true, force: true });
    }

    process.exit(1);
  }
}

main();
