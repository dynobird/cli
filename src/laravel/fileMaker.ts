import { GenerateConfig } from "../lib/type";
import fs from "fs"

export class FileMaker {
    async makeMigration(config: GenerateConfig, fileName: string, data: string) {
        // fs.writeFileSync()
        let thisDirectory = process.cwd()
        // fs.writeFileSync(`${thisDirectory}/${migrationFileName}.php`, migrationScript);
        let filePath = `${thisDirectory}/${config.migrationsDir}/${fileName}.php`
        // console.log("OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO")
        // console.log(filePath)
        fs.writeFileSync(filePath, data)
    }
}