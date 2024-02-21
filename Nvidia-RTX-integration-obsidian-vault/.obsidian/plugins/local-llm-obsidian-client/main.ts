import { App, DataAdapter , Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, Vault } from 'obsidian';
import axios, { AxiosRequestConfig, AxiosPromise } from 'axios';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	vaultDirectory: string;
	localLLMHost: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	vaultDirectory: '',
	localLLMHost: ''
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();
		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Connecting to local LLM gateway...');

		if (!this.settings.vaultDirectory) {
			new Notice('Please set the vaultDirectory in the plugin settings.');
		} else if (!this.settings.localLLMHost) {
			new Notice('Please set the localLLMHost in the plugin settings.');
		} 
		else {
			statusBarItemEl.setText('LLM gateway configured.');
			// TODO: ping the server for connectivity confirmation.
		}
		
		this.addCommand({
			id: 'generate-content',
			name: 'Generate Content',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				const gateway_url = `${this.settings.localLLMHost}/api/predict`;
				const vaultDirectory =`${this.settings.vaultDirectory}`;
				class GatewayAPI{
					async generateContent() {
						const data = {
							data: [
										editor.getSelection(), // query
										"", // chat_history
										"0", // session_id
										vaultDirectory, //data_dir
										false //refresh_index
							]
						};
						try {
							const response = await axios.post(gateway_url, data);
							editor.replaceSelection(
								editor.getSelection() + '\n\n' + response.data.data)
						} catch (error) {
							new Notice(error);
						}
					}
				}
				const gatewayAPI = new GatewayAPI();
				gatewayAPI.generateContent();
			}
		});

		this.addCommand({
			id: 'construct-index',
			name: 'Construct Index',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				const gateway_url = `${this.settings.localLLMHost}/api/predict`;
				const vaultDirectory =`${this.settings.vaultDirectory}`;
				class GatewayAPI{
					async constructIndex() {
						const data = {
							data: [
										"", // query
										"", // chat_history
										"0", // session_id
										vaultDirectory, //data_dir
										true //refresh_index
							]
						};
						try {
							const response = await axios.post(gateway_url, data);
							new Notice('Index construction complete.');
						} catch (error) {
							new Notice(error);
						}
					}
				}
				const gatewayAPI = new GatewayAPI();
				gatewayAPI.constructIndex();
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('vaultDirectory')
			.setDesc('The vault location to run inference against')
			.addText(text => text
				.setPlaceholder('C:\\Path\\to\\vault')
				.setValue(this.plugin.settings.vaultDirectory)
				.onChange(async (value) => {
					this.plugin.settings.vaultDirectory = value;
					await this.plugin.saveSettings();
				}));

			new Setting(containerEl)
				.setName('localLLMHost')
				.setDesc('The protocol://host:ip for the local LLM gateway')
				.addText(text => text
					.setPlaceholder('http://127.0.0.1:4242')
					.setValue(this.plugin.settings.localLLMHost)
					.onChange(async (value) => {
						this.plugin.settings.localLLMHost = value;
						await this.plugin.saveSettings();
					}));
	}
}
