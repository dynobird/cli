#!/usr/bin/env node
import program from "commander"
import { Generator } from "./generator";
import fs from "fs"
import { GenerateConfig } from "./lib/type";
program
    .version('0.0.1')
    .description("An example CLI for ordering pizza's")
    .option('export migration:latest', 'get latest design migration un tag')
    .option('import migration', 'Add pineapple')
    .parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
}

let command = process.argv[2]

if (command === 'generate:migration') {
    // new Generator().migration()
    let thisDir = process.cwd()
    let dynoJsonPath = `${thisDir}/dyno.json`
    if (!fs.existsSync(dynoJsonPath)) {
        console.error("dyno.json not found in this directory")
        process.exit(1)
    }
    let raw = fs.readFileSync(dynoJsonPath);
    let dynoConfig: GenerateConfig
    try {
        dynoConfig = JSON.parse(raw.toString())
    } catch (error) {
        console.error("invalid dyno.json")
        process.exit(1)
    }
    if (!dynoConfig.entitiesDir) {
        console.error("key entitiesDir not found")
        process.exit(1)
    }

    if (!dynoConfig.migrationsDir) {
        console.error("key migrationDir not found")
        process.exit(1)
    }
    new Generator().migration(dynoConfig)
}
console.log(process.argv);
console.log(process.cwd())