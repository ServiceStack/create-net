# create-net

Create .NET and other projects from NetCoreTemplates GitHub repositories.

## Usage

```bash
npx create-net <repo> [ProjectName]
```

If `ProjectName` is not specified, the script will use the current directory name and extract the template into the current directory (which must be empty).

### Examples

**Create a project in a new directory:**

```bash
npx create-net nextjs MyProject
```

This downloads from: `https://github.com/NetCoreTemplates/nextjs` and creates a `MyProject` folder.

**Create a project in the current directory:**

```bash
mkdir my-project
cd my-project
npx create-net nextjs
```

This uses the current directory name (`my-project`) and extracts the template into the current directory.

**Create a project from a different organization:**

```bash
npx create-net NetFrameworkTemplates/web-netfx MyProject
```

This downloads from: `https://github.com/NetFrameworkTemplates/web-netfx`

## What it does

1. **Downloads** the GitHub repository archive from the specified repository
2. **Extracts** the archive into a folder named `<ProjectName>` (or current directory if no ProjectName specified)
3. **Replaces** all variations of `MyApp` with variations of your `<ProjectName>` (or current directory name):
   - `My_App` → `Your_Project`
   - `My App` → `Your Project`
   - `my-app` → `your-project`
   - `my_app` → `your_project`
   - `myapp` → `yourproject`
   - `my.app` → `your.project`
   - `MyApp` → `YourProject`
4. **Renames** files and folders containing `MyApp` variations
5. **Runs** `npm install` in all directories containing `package.json`

## Requirements

- Node.js >= 14.0.0

## Testing

Two test scripts are provided to verify the functionality:

### Automated Tests

Run automated tests that verify all scenarios and clean up afterwards:

```bash
./test.sh
```

This tests:
- Creating a project with repo name and ProjectName
- Creating a project with organization/repo and ProjectName
- Creating a project without ProjectName (current directory)
- Error handling for existing directories
- Error handling for non-empty directories

### Manual Tests

Run manual tests that leave the results for inspection:

```bash
./test-manual.sh
```

This creates test projects in `test-manual/` for manual verification. Clean up with `rm -rf test-manual/` when done.

## Publishing

To publish this package to npm:

```bash
npm publish
```

## License

MIT
