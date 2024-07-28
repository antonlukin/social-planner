# Social Planner

Social Planner is a WordPress plugin for scheduling announcements of posts to your social networks accounts. The following providers are currently supported: Facebook, Twitter, VK.com, OK.ru, Telegram, but you can easily add a new one yourself.

## Documentation

Detailed information about the plugin, its configuration and enhancement, is described on the [official website](https://wpset.org/social-planner/).
Pay attention to the page with available [hooks and filters](https://wpset.org/social-planner/hooks/). Read the [setup instructions](https://wpset.org/social-planner/setup/) before using the plugin.

## Development

1. Fork and clone git repository
2. Install npm modules with `yarn`
3. Add composer packages with `composer update`
4. Run the command `npm run build-dev` in the terminal to build the project. This will generate the necessary files in the dist folder.
    - Note: This execution is only necessary once, unless you need to rebuild the SCSS or JS files. If you are working with the assets file, it is more convenient to use `npm run watch` for building when there are changes.
5. Navigate to the dist folder and create a symbolic link to this folder in the plugins directory of your WordPress installation. 
    - This can be done with the following command in the terminal (adjusting the paths according to your setup):
        ```bash
        ln -s $PWD/dist /path/to/your/wordpress/wp-content/plugins/social-planner
        ```
    - Note: Make sure to replace /path/to/your/wordpress/wp-content/plugins/social-planner with the path to the plugins directory of your WordPress installation.

## Distribution
The master project has CI/CD set up to publish the plugin automatically when a new release is created.

However, if you want to build the project manually, you can do so from the command line using the command `npm run build` in the terminal.

This command generates a zip file with the plugin build, which you can upload manually to WordPress.