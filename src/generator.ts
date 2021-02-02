import { LaravelGenerator } from "./laravel/generator";
import { GenerateConfig } from "./lib/type";
import prompts from "prompts"
import axios from "axios"
import chalk from "chalk"
import ora from "ora"
import fs from "fs"
// @ts-ignore
import jsonFormat from "json-format"


export class Generator {
    migration(config: GenerateConfig) {
        new LaravelGenerator().migration(config)
    }
    async dynobirdJSON(dynoJsonPath: string) {


        const tokenResponse = await prompts({
            type: 'text',
            name: 'token',
            message: 'What is your project token ?'
        });

        const tagResponse = await prompts({
            type: 'text',
            name: 'tag',
            message: 'What is your main tag ?'
        });

        const spinner = ora(' Validating project',).start()
        spinner.color = 'yellow'
        var respond = await axios.get(`https://app.dynobird.com/api/v1/integration/access?tag=${tagResponse.tag}&token=${tokenResponse.token}`)
        if (respond.data.success === false) {
            console.log(chalk.red(" Error : " + respond.data.message))
            process.exit(1)
        }
        spinner.succeed("Project token valid ✔")
        console.log(chalk.grey('-----------------------------------------'))
        console.log(chalk.green(` Project  name     : `) + respond.data.payload.properties.name)
        console.log(chalk.green(` Database type     : `) + respond.data.payload.properties.databaseType)
        console.log(chalk.green(` Schema version    : `) + respond.data.payload.properties.schemaVersion)
        console.log(chalk.green(` Framework target  : `) + respond.data.payload.properties.frameworkType)
        console.log(chalk.green(` Framweork version : `) + respond.data.payload.properties.frameworkVersion)
        console.log(chalk.green(` Total history     : `) + respond.data.payload.total)
        console.log(chalk.grey('-----------------------------------------'))




        const entitiesDir = await prompts({
            type: 'text',
            name: 'value',
            message: 'Where is your entities dir ?',
            initial: 'app/Models',
        });



        const migrationDir = await prompts({
            type: 'text',
            name: 'migrationDir',
            message: 'Where is your migration dir ?',
            initial: 'database/migrations'
        });





        let dynobirdJSON = {
            entitiesDir: entitiesDir.value,
            migrationsDir: migrationDir.migrationDir,
            token: tokenResponse.token,
            tag: tagResponse.tag
        }

        fs.writeFileSync(dynoJsonPath, jsonFormat(dynobirdJSON))
    }
}