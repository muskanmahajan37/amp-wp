<?php
/**
 * Class PluginRegistry.
 *
 * @package AmpProject\AmpWP
 */

namespace AmpProject\AmpWP;

use AmpProject\AmpWP\Infrastructure\Service;

/**
 * Suppress plugins from running by removing their hooks and nullifying their shortcodes, widgets, and blocks.
 *
 * @package AmpProject\AmpWP
 */
final class PluginRegistry implements Service {

	/**
	 * Plugin folder.
	 *
	 * @var string
	 */
	private $plugin_folder = '';

	/**
	 * Get absolute path to plugin directory.
	 *
	 * @see WP_PLUGIN_DIR
	 * @return string Plugin directory.
	 */
	public function get_plugin_dir() {
		$plugin_dir = WP_PLUGIN_DIR;
		if ( $this->plugin_folder ) {
			$plugin_dir .= '/' . trim( $this->plugin_folder, '/' );
		}
		return $plugin_dir;
	}

	/**
	 * Get plugin slug from file.
	 *
	 * If the plugin file is in a directory, then the slug is just the directory name. Otherwise, if the file is not
	 * inside of a directory and is just a single-file plugin, then the slug is the filename of the PHP file.
	 *
	 * @see \WP_CLI\Utils\get_plugin_name()
	 *
	 * @param string $plugin_file Plugin file.
	 * @return string Plugin slug.
	 */
	public function get_plugin_slug_from_file( $plugin_file ) {
		return strtok( $plugin_file, '/' );
	}

	/**
	 * Get array of installed plugins, keyed by slug.
	 *
	 * @param bool $active_only Limit the returned plugins to just those which are active.
	 * @param bool $omit_core   Omit core plugins that should never be listed. These are in particular AMP and Gutenberg.
	 * @return array Plugins keyed by slug.
	 */
	public function get_plugins( $active_only = false, $omit_core = true ) {
		$active_plugins = get_option( 'active_plugins', [] );

		$plugins = [];
		foreach ( $this->get_plugins_data() as $plugin_file => $plugin ) {
			if ( $active_only && ! in_array( $plugin_file, $active_plugins, true ) ) {
				continue;
			}

			$plugin_slug = $this->get_plugin_slug_from_file( $plugin_file );

			/*
			 * When a plugin has a nested plugin, such as foo/foo.php also having foo/extra.php, discard the extra.php
			 * instance from the registry in favor of only keeping the "main" plugin file entry for foo.php. This is
			 * done because when the Reflection API is being used to determine which plugin a given piece of markup is
			 * coming from, it cannot absolutely determine which plugin file was responsible for including the PHP file
			 * that the function was defined inside of.
			 */
			if ( isset( $plugins[ $plugin_slug ] ) && basename( $plugins[ $plugin_slug ]['File'] ) === "{$plugin_slug}.php" ) {
				continue;
			}

			$plugins[ $plugin_slug ] = array_merge(
				[ 'File' => $plugin_file ], // PascalCase is used for consistency with the other keys.
				$plugin
			);
		}

		if ( $omit_core ) {
			unset( $plugins['amp'], $plugins['gutenberg'] );
		}

		return $plugins;
	}

	/**
	 * Find a plugin from a slug.
	 *
	 * A slug is a plugin directory name like 'amp' or if the plugin is just a single file, then the PHP file in
	 * the plugins directory.
	 *
	 * @param string $plugin_slug Plugin slug.
	 * @return array|null {
	 *     Plugin data if found, otherwise null.
	 *
	 *     @type string $name Plugin name (file).
	 *     @type array  $data Plugin data.
	 * }
	 */
	public function get_plugin_from_slug( $plugin_slug ) {
		$plugins = $this->get_plugins_data();
		if ( isset( $plugins[ $plugin_slug ] ) ) {
			return [
				'file' => $plugin_slug,
				'data' => $plugins[ $plugin_slug ],
			];
		}
		foreach ( $plugins as $plugin_file => $plugin_data ) {
			if ( strtok( $plugin_file, '/' ) === $plugin_slug ) {
				return [
					'file' => $plugin_file,
					'data' => $plugin_data,
				];
			}
		}
		return null;
	}

	/**
	 * Get the plugins data from WordPress.
	 *
	 * @return array[]
	 */
	private function get_plugins_data() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		return get_plugins(
			$this->plugin_folder ? '/' . trim( $this->plugin_folder, '/' ) : ''
		);
	}
}
