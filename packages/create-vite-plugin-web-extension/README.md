# Starter Kit

This package contains a starter kit for bootstrapping a new project with `vite-plugin-web-extension`.

```bash
npm create vite-plugin-web-extension
pnpm create vite-plugin-web-extension
yarn create vite-plugin-web-extension
```

## Development

When making changes to this package, you can run the starter kit via the `start` script. You'll likely want to run it against your fork, like so:

```bash
pnpm start --repo <your-https-remote-url> --branch <your-branch-name>
```

If you're not working off a fork (basically just for maintainers with direct access to the repo), you can use:

```bash
pnpm start --branch <your-branch-name>
```

You can run `pnpm test-all` to run all templates based on your current branch.

> TODO: Add support for forks with this command.

### Adding/Fixing Templates

You do not need to publish an update the the NPM package to add or fix templates. Templates are consumed by the create command by cloning the `main` branch of the repo - so changes just need to be merged into `main`!

Here's the steps the starter kit follows to create a project using a template:

1. Clone the repo
2. Get a list of templates from the `templates/templates.json` file via the raw github URL
3. Copy `templates/shared` folder into the project folder
4. Copy the `templates/<template-name>` folder into the project folder (overwriting any files from the shared folder)

To add a new template, add a new folder inside `templates` directory named after the template name, and add files for that template inside it.

> All templates should result in a similar extension, see the other templates for an example.

## Deployment

When making change to the `indext.ts` or `src` directory, a deployment is required.

To deploy, use the "Publish Starter Kit" action on GitHub. It will verify all the templates build successfully, bump the version, then deploy the package to NPM.
