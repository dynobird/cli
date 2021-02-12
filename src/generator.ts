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
        if (config.framework === 'laravel') {
            new LaravelGenerator().migration(config)
        }
    }
    async dynobirdJSON(dynoJsonPath: string) {
        console.log()
        console.log()
        console.log(chalk.grey('-----------------------------------------'))
        console.log(chalk.green(`     Dynobird init project 🎉🎉🎉 `))
        console.log(chalk.grey('-----------------------------------------'))
        console.log()
        
        const tokenResponse = await prompts({
            type: 'text',
            name: 'token',
            message: 'What is your project token ?'
        });

        const tagResponse = await prompts({
            type: 'text',
            name: 'tag',
            message: 'What is your main tag ?',
            initial: '--latest'
        });

        const spinner = ora(' Validating project',).start()
        spinner.color = 'yellow'
        var respond = await axios.get(`http://localhost:8081/api/v1/integration/access?tag=${tagResponse.tag}&token=${tokenResponse.token}`)
        if (respond.data.success === false) {
            console.log(chalk.red(" Error : " + respond.data.message))
            process.exit(1)
        }
        spinner.succeed("Project token valid ✔")
        console.log(chalk.grey('-----------------------------------------'))
        console.log(chalk.green(` Project  name  : `) + respond.data.payload.properties.name)
        console.log(chalk.green(` Database type  : `) + respond.data.payload.properties.databaseType)
        console.log(chalk.green(` Schema version : `) + respond.data.payload.properties.schemaVersion)
        console.log(chalk.green(` Total history  : `) + respond.data.payload.total)
        console.log(chalk.grey('-----------------------------------------'))





        const framework = await prompts({
            type: 'select',
            name: 'framework',
            choices: [
                { title: 'laravel', value: 'laravel', disabled: false },
                { title: 'doctrine', value: 'doctrine', disabled: true },
                // { title: 'django', value: 'django', disabled: true },
                // { title: 'ruby on rails', value: 'ror', disabled: true },
                // { title: 'type orm', value: 'type_orm', disabled: true },
                // { title: 'squelize', value: 'squelize', disabled: true },
            ],
            initial: 1,
            message: 'What is your target framework ?'
        });


        const frameworkVersion = await prompts({
            type: 'select',
            name: 'version',
            choices: [
                { title: '8', value: '8', disabled: false },
                { title: '7', value: '7', disabled: true },
            ],
            initial: 1,
            message: 'What is your framework version ?'
        });



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
            framework: framework.framework,
            frameworkVersion: frameworkVersion.version,
            token: tokenResponse.token,
            tag: tagResponse.tag
        }

        fs.writeFileSync(dynoJsonPath, jsonFormat(dynobirdJSON))
    }
}