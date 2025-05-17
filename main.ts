import { Plugin, TFile, Notice } from 'obsidian';


export default class DailyReadStatsPlugin extends Plugin {
	isModifyed: boolean = false;
	folderDailyNotes: string;

	async onload() {
		const dailyNotesPluginConfig = await (this.app.vault as any).readConfigJson("daily-notes")
		if (!dailyNotesPluginConfig || !dailyNotesPluginConfig.folder) {
			new Notice(`Для работы плагина "${this.manifest.name}" необходим настроенный плагин "Ежедневные заметки" `, 0)
			this.unload()
			return
		}

		this.folderDailyNotes = dailyNotesPluginConfig.folder

		console.log("Load plugin DailyReadStats!")
		this.registerEvent(
			this.app.vault.on('modify', async (file) => {
				let tfile = file as TFile

				if (this.checkConditionsFile(tfile)) {
					console.log(this.isModifyed)

					this.isModifyed = !this.isModifyed;

					if (this.isModifyed) {
						let content = await this.app.vault.read(tfile!)
						await this.writeReadStats(tfile!, content)
					}
				} 
			})
		
		)
	}

	async writeReadStats(file: TFile, content: string) {
		const lines = content.split('\n')

		let readPropertyIndex = 0
		let isReadStatTitle = false
		let pagesRead = 0

		lines.forEach((element, index) => {
			if (element.contains("read: ")) readPropertyIndex = index
			else if (element === "# Чтение") isReadStatTitle = true
			else if (isReadStatTitle && element.contains("#") ) isReadStatTitle = false
			else if (isReadStatTitle) {
				if (!element.startsWith("-")) return

				let lineSplited = element.split(":").map((value, _) => value.trim())
				let _number = parseInt(lineSplited[lineSplited.length-1])

				pagesRead += Number.isNaN(_number) ? 0 : _number
			}

		});

		if (readPropertyIndex == 0) return

		lines[readPropertyIndex] = "read: " + pagesRead
		
		let data = lines.join("\n")

		await this.app.vault.modify(file, data)
	}

	private checkConditionsFile(file: TFile | null) {
		return file && file.path.contains(this.folderDailyNotes)
	}

	async onunload() {
		console.log("Unload plugin DailyReadStats...")
	}

}
