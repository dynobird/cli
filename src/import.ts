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
        const token = await prompts({
            type: 'text',
            name: 'value',
            message: 'Token project :',
            initial: '',
        });
        return token.value
    }

    async push(sql: string, token: string) {
        let response = await axios.post(`https://us.dynobird.com/api/v1/integration/importSql`, {
            token: token,
            sql: btoa(sql)
        })
        return response.data
    }

    async validating(token: string) {
        console.log(chalk.yellow(" Validating token...."))
        try {
            let page = 0
            let limit = 1
            var respond = await axios.get(`https://us.dynobird.com/api/v1/integration/access?tag=--latest&token=${token}&page=${page}&limit=${limit}`)
            if (respond.data.success === false) {
                console.log(chalk.red(" Error : " + respond.data.message))
                process.exit(1)
            }
        } catch (error) {
            console.log(chalk.red(" Error : " + error.message))
            process.exit(1)
        }

        console.log(chalk.green(" Validating finish 🎉"))
        console.log(chalk.grey('-----------------------------------------'))
        console.log(chalk.green(` Project  name     : `) + respond.data.payload.properties.name)
        console.log(chalk.green(` Database type     : `) + respond.data.payload.properties.databaseType)
        console.log(chalk.green(` Schema version    : `) + respond.data.payload.properties.schemaVersion)
        console.log(chalk.green(` Total history     : `) + respond.data.payload.total)
        console.log(chalk.grey('-----------------------------------------'))

        const isContinue = await prompts({
            type: 'confirm',
            name: 'value',
            message: 'Do you want to import to this project ?',
            initial: '',
        });

        if (isContinue.value == false) {
            process.exit(1)
        }

    }
    async main() {
        let answer = await this.question()
        let token = await this.getToken()

        await this.validating(token)

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