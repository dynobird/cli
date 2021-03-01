import mysql from "mysql2/promise"
import { GenerateConfig, History } from "../lib/type";
import axios from "axios"
import mysqldump from 'mysqldump';
import moment from 'moment'

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

        console.log(createdAt)
        let respond = await axios.get(`http://localhost:8081/api/v1/integration/getHistoryByCreatedAt?createdAt=${createdAt}&token=${token}`)
        return respond.data
    }

    async convertCreateSqlToDesign(sql: string, token: string) {
        let response = await axios.post(`http://localhost:8081/api/v1/integration/convertSqlToDesign`, {
            token: token,
            sql: btoa(sql)
        })
        return response.data
    }


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
            return undefined
        }

        return respond.payload
    }
}