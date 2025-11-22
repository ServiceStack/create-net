# create-net

Create .NET and other projects from NetCoreTemplates GitHub repositories.

## Usage

```bash
npx create-net <repo> <ProjectName>
```

### Examples

**Create a project from NetCoreTemplates organization:**

```bash
npx create-net nextjs MyProject
```

This downloads from: `https://github.com/NetCoreTemplates/nextjs`

**Create a project from a different organization:**

```bash
npx create-net NetFrameworkTemplates/web-netfx MyProject
```

This downloads from: `https://github.com/NetFrameworkTemplates/web-netfx`

## What it does

1. **Downloads** the GitHub repository archive from the specified repository
2. **Extracts** the archive into a folder named `<ProjectName>`
3. **Replaces** all variations of `MyApp` with variations of your `<ProjectName>`:
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

## Publishing

To publish this package to npm:

```bash
npm publish
```

## License

MIT
