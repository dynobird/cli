import { LaravelGenerator } from "./laravel/generator";
import { GenerateConfig } from "./lib/type";
import prompts from "prompts"
import axios from "axios"
import chalk from "chalk"
import ora from "ora"
import fs from "fs"
// @ts-ignore
import jsonFormat from "json-format"
import mysqldump from 'mysqldump';
import btoa from 'btoa'

export class Import {
    async getSqlCreateMysql(data: {
        host: string,
        user: string,
        password: string,
        databaseName: string,
        port: number
    }) {
        const result = await mysqldump({
            connection: {
                host: data.host,
                user: data.user,
                password: data.password,
                database: data.databaseName,
                port: data.port
            },
            // dumpToFile: './dump.sql',
            dump: {
                tables: [],
                excludeTables: false,
                schema: {
                    format: false,
                    autoIncrement: true,
                    engine: true,
                    table: {
                        ifNotExist: true,
                        dropIfExist: false,
                        charset: true,
                    },
                    view: {
                        createOrReplace: true,
                        algorithm: false,
                        definer: false,
                        sqlSecurity: false,
                    },
                },
                data: {
                    format: true,
                    verbose: true,
                    lockTables: false,
                    includeViewData: false,
                    where: {},
                    returnFromFunction: false,
                    maxRowsPerInsertStatement: 1,
                },
                trigger: {
                    delimiter: ';;',
                    dropIfExist: true,
                    definer: false,
                },
            },
        });
        let cleanSqlSchema = ""

        if (result.dump.schema === null) {
            throw new Error("Error : sql empty")
        }

        let sqlByLine = result.dump.schema.match(/[^\r\n]+/g);
        if (sqlByLine === null) {
            throw new Error("Error : sql empty")
        }

        for (let i = 0; i < sqlByLine.length; i++) {
            const line = sqlByLine[i]
            if (line.trim().indexOf('#') === 0) {
                continue;
            }
            cleanSqlSchema += `${line}\r\n`
        }

        return cleanSqlSchema
    }
    async question() {

        const databaseType = await prompts({
            type: 'select',
            name: 'framework',
            choices: [
                { title: 'MY_SQL', value: 'MySQL', disabled: false },
                { title: 'SQL_SERVER', value: 'SQL Server', disabled: true },
                { title: 'POSTGRE_SQL', value: 'PostgreSQL', disabled: true },
                { title: 'MARIA_DB', value: 'MariaDB', disabled: true },
                { title: 'SQLITE', value: 'SQlite', disabled: true }
            ],
            initial: 0,
            message: 'What is your database type ?'
        });



        const databaseHost = await prompts({
            type: 'text',
            name: 'value',
            message: 'Database host :',
            initial: 'localhost',
        });


        const databaseUser = await prompts({
            type: 'text',
            name: 'value',
            message: 'Database user :',
            initial: 'root',
        });

        const databasePassword = await prompts({
            type: 'password',
            name: 'value',
            message: 'Database password :',
            initial: '',
        });

        const databasePort = await prompts({
            type: 'number',
            name: 'value',
            message: 'Database port?',
            initial: 3306,
        });


        const databaseName = await prompts({
            type: 'text',
            name: 'value',
            message: 'Database name :',
            initial: 'my_db',
        });

        return {
            host: databaseHost.value,
            user: databaseUser.value,
            password: databasePassword.value,
            databaseName: databaseName.value,
            port: databasePort.value
        }
    }

    async getToken() {
        let thisDir = process.cwd()
        let dynoJsonPath = `${thisDir}/dynobird.json`
        if (!fs.existsSync(dynoJsonPath)) {
            const token = await prompts({
                type: 'text',
                name: 'value',
                message: 'Token project :',
                initial: '',
            });
            return token.value
        }

        let raw = fs.readFileSync(dynoJsonPath);
        let dynoConfig: GenerateConfig

        try {
            dynoConfig = JSON.parse(raw.toString())
        } catch (error) {
            console.log(chalk.red(" Invalid dynobird.json"))
            process.exit(1)
        }

        if (!dynoConfig.token) {
            console.log(chalk.red(" Key token not found"))
            process.exit(1)
        }

        return dynoConfig.token
    }

    async push(sql: string, token: string) {
        let response = await axios.post(`https://us.dynobird.com/api/v1/integration/importSql`, {
            token: token,
            sql: btoa(sql)
        })
        return response.data
    }
    async main() {
        let answer = await this.question()        
        let token = await this.getToken()
        console.log(chalk.yellow(" Dumping SQL create...."))
        let sqlCreate = await this.getSqlCreateMysql(answer)
        try {
            console.log(chalk.yellow(" Importing...."))
            let response = await this.push(sqlCreate, token)
            console.log(chalk.green(" Import finish 🎉"))

            if (response.success === false) {
                console.log(chalk.grey('-----------------------------------------'))
                console.log(chalk.red(` Error   : `) + response.message)
                console.log(chalk.grey('-----------------------------------------'))
                process.exit(1)
            } else {
                console.log(chalk.grey('-----------------------------------------'))
                console.log(chalk.green(` Success : `) + response.message)
                console.log(chalk.grey('-----------------------------------------'))
            }
        } catch (error) {
            console.log(chalk.grey('-----------------------------------------'))
            console.log(chalk.red(` Error   : `) + error.message)
            console.log(chalk.grey('-----------------------------------------'))
            process.exit(1)
        }


    }
}