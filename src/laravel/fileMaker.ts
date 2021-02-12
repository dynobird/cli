import { GenerateConfig } from "../lib/type";
import fs from "fs"
import chalk  from "chalk"
import prettier from "prettier"
// @ts-ignore
import phpPlugin from "@prettier/plugin-php";
export class FileMaker {
    async makeMigration(config: GenerateConfig, fileName: string, data: string) {

        let thisDirectory = process.cwd()

        let filePath = `${thisDirectory}/${config.migrationsDir}/${fileName}.php`

        let formated = prettier.format(data, {
            plugins: phpPlugin,
            parser: "php"
          });

        fs.writeFileSync(filePath, formated)
        console.log(chalk.green(" Generated  : "+filePath))
    }
}