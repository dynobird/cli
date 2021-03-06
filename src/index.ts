#!/usr/bin/env node
import program from "commander"
import { Generator } from "./generator";
import fs from "fs"
import { GenerateConfig } from "./lib/type";
import chalk from "chalk";
import { Import } from './import'
import { Utill } from "./util/utill";
import semver from "semver"
import { Migration } from "./laravel/migration";

function checkDynobirdJSON(dynoConfig: GenerateConfig) {

    if (dynoConfig.entitiesDir === undefined) {
        console.log(chalk.red(" Key entitiesDir not found in dynobird.json"))
        process.exit(1)
    }

    if (dynoConfig.migrationsDir === undefined) {
        console.log(chalk.red(" Key migrationDir not found in dynobird.json"))
        process.exit(1)
    }

    if (dynoConfig.framework === undefined) {
        console.log(chalk.red(" Key framework not found in dynobird.json"))
        process.exit(1)
    }

    if (dynoConfig.frameworkVersion === undefined) {
        console.log(chalk.red(" Key frameworkVersion not found in dynobird.json"))
        process.exit(1)
    }

    if (dynoConfig.token === undefined) {
        console.log(chalk.red(" Key token not found in dynobird.json"))
        process.exit(1)
    }

    if (dynoConfig.db === undefined) {
        console.log(chalk.red(" Object db not found in dynobird.json"))
        process.exit(1)
    }

    if (dynoConfig.db.user === undefined) {
        console.log(chalk.red(" Key db.user not found in dynobird.json"))
        process.exit(1)
    }

    if (dynoConfig.db.type === undefined) {
        console.log(chalk.red(" Key db.type not found in dynobird.json"))
        process.exit(1)
    }

    if (dynoConfig.db.port === undefined) {
        console.log(chalk.red(" Key db.port not found in dynobird.json"))
        process.exit(1)
    }

    if (dynoConfig.db.password === undefined) {
        console.log(chalk.red(" Key db.password not found in dynobird.json"))
        process.exit(1)
    }

    if (dynoConfig.db.host === undefined) {
        console.log(chalk.red(" Key db.host not found in dynobird.json"))
        process.exit(1)
    }

    if (!dynoConfig.db.database) {
        console.log(chalk.red(" Key db.database not found in dynobird.json"))
        process.exit(1)
    }
}

async function main() {

    let rawPackage = fs.readFileSync(__dirname + "/../package.json")

    if (!rawPackage) {
        console.log(chalk.red(" Package JSON missing"))
        process.exit(1)
    }


    let jsonPackage = JSON.parse(rawPackage.toString())
    let installedVersion = jsonPackage.version

    program
        .version(installedVersion)
        .description("dynobird cli")
        .option('migration:generate', 'generate migration based of your history and migration')
        .option('migration:import', 'import existing migration to dynobird')
        .option('database:import', 'import database to design')
        .option('init', 'For initital dynobird.json configuration project')
        .parse(process.argv);



    console.log(chalk.green(" Checking last version..."))
    let latestVersion = await new Utill().getLastVersion()
    console.log(chalk.green(` Last version : ${latestVersion}`))
    console.log(chalk.green(` Installed version : ${installedVersion}`))

    if (semver.lt(installedVersion, latestVersion)) {
        console.log(chalk.red(` Installed version is out date `))
        console.log(chalk.red(` Run npm update -g dynobird `))
    } else {
        console.log(chalk.green(` Installed version is up to date date ✔ `))
    }
    console.log(chalk.grey('-----------------------------------------'))

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

        checkDynobirdJSON(dynoConfig)
        await new Generator().migration(dynoConfig)
    }
    else if (command === 'migration:import') {
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
        checkDynobirdJSON(dynoConfig)
        new Migration().import(dynoConfig)
    }
    else if (command === 'database:import') {
        new Import().main()
    }
    else if (command === 'init') {
        let thisDir = process.cwd()
        let dynoJsonPath = `${thisDir}/dynobird.json`
        if (fs.existsSync(dynoJsonPath)) {
            console.log(chalk.red(" dynobird.json found in this directory"))
            process.exit(1)
        }
        await new Generator().dynobirdJSON(dynoJsonPath)
    } else {
        console.log(chalk.red(" Command not found "))
        program.outputHelp();
    }
}
main();