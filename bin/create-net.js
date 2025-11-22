#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const AdmZip = require('adm-zip');

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: npx create-net <repo> <ProjectName>');
  console.error('Example: npx create-net nextjs MyProject');
  console.error('Example: npx create-net NetFrameworkTemplates/web-netfx MyProject');
  process.exit(1);
}

const [repo, projectName] = args;

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
const projectPath = path.join(process.cwd(), projectName);

console.log(`Creating project "${projectName}" from ${organization}/${repository}...`);
console.log(`Downloading from: ${archiveUrl}`);

// Check if project directory already exists
if (fs.existsSync(projectPath)) {
  console.error(`Error: Directory "${projectName}" already exists.`);
  process.exit(1);
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

    // Move the extracted folder to the project name
    const extractedPath = path.join(tempExtractPath, rootFolder);
    fs.renameSync(extractedPath, projectPath);

    // Clean up temp extract directory
    fs.rmdirSync(tempExtractPath, { recursive: true });

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
    console.log(`\nNext steps:`);
    console.log(`  cd ${projectName}`);
    console.log(`  npm start (or appropriate command for your template)`);

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
