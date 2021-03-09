import mysql from "mysql2/promise"
import { GenerateConfig, History } from "../lib/type";
import axios from "axios"
import mysqldump from 'mysqldump';
import moment from 'moment'
import chalk from "chalk"
import { Import } from "../import"
import btoa from 'btoa'

export class Migration {
    async getLastMigration(config: GenerateConfig) {
        var connection = await mysql.createConnection({
            host: config.db.host,
            user: config.db.user,
            password: config.db.password,
            database: config.db.database,
            insecureAuth: true
        });

        const migrationExistrespond = await connection.execute
            (`SELECT * 
              FROM information_schema.tables
              WHERE table_schema = '${config.db.database}' 
              AND table_name = 'migrations'
              LIMIT 1;`
            )

        let existingMigration = <any>migrationExistrespond[0]

        if (existingMigration.length == 0) {
            return undefined
        }

        const respond = await connection.execute('SELECT * from migrations ORDER BY id DESC')

        let data = <any>respond[0]

        connection.end();

        if (!data[0]) {
            return undefined
        }

        return data[0]['migration']
    }

    async getHistoryByCreatedAt(createdAt: string, token: string): Promise<{
        success: boolean,
        message: string,
        payload: History
    }> {
        let respond = await axios.get(`https://app.dynobird.com/api/v1/integration/getHistoryByCreatedAt?createdAt=${createdAt}&token=${token}`)
        return respond.data
    }

    async convertCreateSqlToDesign(sql: string, token: string) {
        let response = await axios.post(`https://app.dynobird.com/api/v1/integration/convertSqlToDesign`, {
            token: token,
            sql: btoa(sql)
        })
        return response.data
    }


    async getOldHistory(config: GenerateConfig): Promise<History | undefined> {
        let lastMigration: string = await this.getLastMigration(config)
        if (!lastMigration) {
            return undefined
        }
        let lastMigrationDateTime = lastMigration.substr(0, 17)
        let dateTime = moment(lastMigrationDateTime, 'YYYY_MM_DD_HHmmss')
        let formated = dateTime.format('YYYY-MM-DD%20HH:mm:ss')
        let respond = await this.getHistoryByCreatedAt(formated, config.token)

        if (respond.success === false) {
            console.log(chalk.red(` Migration ${lastMigration} not found in dynobird history`))
            process.exit(1)
        }

        return respond.payload
    }


    async import(config: GenerateConfig) {

        await new Import().validating(config.token)

        console.log(chalk.yellow(" Get last migration...."))
        let lastMigration: string = await this.getLastMigration(config)
        if (!lastMigration) {
            console.log(chalk.red(` Last migration not found in database`))
            console.log(chalk.red(` Details :`))
            console.log(chalk.red(` Host      :${config.db.host}`))
            console.log(chalk.red(` Port      :${config.db.port}`))
            console.log(chalk.red(` Type      :${config.db.type}`))
            console.log(chalk.red(` Username  :${config.db.user}`))
            console.log(chalk.red(` Password  :${config.db.password}`))
            console.log(chalk.red(` Database  :${config.db.database}`))
            process.exit(1)
        }
        let lastMigrationDateTime = lastMigration.substr(0, 17)
        let dateTime = moment(lastMigrationDateTime, 'YYYY_MM_DD_HHmmss')
        let formated = dateTime.format('YYYY-MM-DD HH:mm:ss')

        console.log(chalk.yellow(" Dumping SQL create...."))

        console.log(chalk.yellow(" Importing migration...."))
        let sql = await new Import().getSqlCreateMysql({
            databaseName: config.db.database,
            host: config.db.host,
            password: config.db.password,
            port: config.db.port,
            user: config.db.user
        })

        let response = await axios.post(`https://app.dynobird.com/api/v1/integration/importSql`, {
            token: config.token,
            sql: btoa(sql),
            createdAt: formated
        })

        console.log(chalk.green(" Import finish 🎉"))

    }
}