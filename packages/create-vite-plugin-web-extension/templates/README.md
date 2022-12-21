# `create-vite-plugin-web-extension/templates`

This directory contains all the files for each template. Some files are shared by multiple templates, but most are for a single template.

Adding a template does not require a new release of the package. You just need to create the template directory, then add the template name to the `templates.json` file.

When `create-vite-plugin-web-extension` is setting up a new project using a template, it copies the `shared` directory first, then the template's directory second.
