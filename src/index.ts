#!/usr/bin/env node
import program from "commander"
import { Generator } from "./generator";
import fs from "fs"
import { GenerateConfig } from "./lib/type";
import chalk from "chalk";
import { Import } from './import'
// program
//     .version('0.0.1')
//     .description("dynobird cli")
//     .option('migration:generate', 'generate migration based on tag of your history')
//     .option('import', 'import database to design')
//     .option('init', 'For initital dynobird.json configuration project')
//     .parse(process.argv);

// if (!process.argv.slice(2).length) {
//     program.outputHelp();
// }

async function main() {
    let command = process.argv[2]

    if (command === 'migration:generate') {
        let thisDir = process.cwd()
        let dynoJsonPath = `${thisDir}/dynobird.json`
        if (!fs.existsSync(dynoJsonPath)) {
            await new Generator().dynobirdJSON(dynoJsonPath)
        }
        let raw = fs.readFileSync(dynoJsonPath);
        let dynoConfig: GenerateConfig
        try {
            dynoConfig = JSON.parse(raw.toString())
        } catch (error) {
            console.log(chalk.red(" Invalid dynobird.json"))
            process.exit(1)
        }
        if (!dynoConfig.entitiesDir) {
            console.log(chalk.red(" Key entitiesDir not found"))
            process.exit(1)
        }

        if (!dynoConfig.migrationsDir) {
            console.log(chalk.red(" Key migrationDir not found"))
            process.exit(1)
        }

        if (!dynoConfig.token) {
            console.log(chalk.red(" Key token not found"))
            process.exit(1)
        }

        new Generator().migration(dynoConfig)
    }
    else if (command === 'import') {
        new Import().main()
    }
    else if (command === 'init') {
        let thisDir = process.cwd()
        let dynoJsonPath = `${thisDir}/dynobird.json`
        if (fs.existsSync(dynoJsonPath)) {
            console.log(chalk.red(" dynobird.json found in this directory"))
            process.exit(1)
        }
        new Generator().dynobirdJSON(dynoJsonPath)


    } else {
        console.log(chalk.red(" Command not found "))
    }
}
main();