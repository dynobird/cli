import { GenerateConfig } from "../lib/type";
import fs from "fs"
import chalk  from "chalk"

export class FileMaker {
    async makeMigration(config: GenerateConfig, fileName: string, data: string) {

        let thisDirectory = process.cwd()

        let filePath = `${thisDirectory}/${config.migrationsDir}/${fileName}.php`

        fs.writeFileSync(filePath, data)
        console.log(chalk.green(" Generated  : "+filePath))
    }
}