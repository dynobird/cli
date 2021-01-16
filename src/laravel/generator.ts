import { Column, GenerateConfig, History, Table } from "../lib/type";
import { Template } from "./template/template"
import axios from "axios"
import { FileMaker } from "./fileMaker"
import {
    camelCase,
    capitalCase,
    constantCase,
    dotCase,
    headerCase,
    noCase,
    paramCase,
    pascalCase,
    pathCase,
    sentenceCase,
    snakeCase,
} from "change-case";
import moment from "moment"
import fs from "fs"

export class LaravelGenerator {
    async migration(config: GenerateConfig) {
        console.log("DO migration for laravel")
        let historyList: History[];
        try {
            let respond = await axios.get("https://app-testung.dynobird.com/api/v1/integration/access?keyword=%%&tokenId=c6013d42705038eace64673a9a19c641a5f3ced407dbc9623e33770128effec49d7f87f6775d21c8e48e6508368478fb13fb")
            if (respond.data.success === false) {
                console.error("Error : " + respond.data.message)
                process.exit(1)
            }
            historyList = respond.data.payload.history
            // console.log(JSON.stringify(respond.data))
        } catch (error) {
            console.error("Error : " + error.message)
            process.exit(1)
        }


        let thisHistoryKey = -1
        for await (const thisHistory of historyList) {
            thisHistoryKey++;
            let dateFormated = moment(thisHistory.createdAt).format("YYYY_MM_DD_HHmmss")
            let historyNameFormated = snakeCase(thisHistory.name)
            let migrationFileName = `${dateFormated}_${historyNameFormated}`
            let migrationClassName = pascalCase(thisHistory.name)
            console.log(migrationFileName)
            let up = ''


            for await (const thisTableKey of Object.keys(thisHistory.design.table)) {
                const thisTable: Table = thisHistory.design.table[thisTableKey]
                if (thisHistoryKey === 0) {
                    console.log("for each 345345 MAKAN NGGAK MASUK")
                    up += await new Template().createTable(thisTable);
                    continue
                }
                console.log("MAKANNNNNNNN")
                const oldHistory = historyList[thisHistoryKey - 1];
                const oldTable: Table = oldHistory.design.table[thisTableKey]

                if (oldTable === undefined) {
                    up += await new Template().createTable(thisTable);
                    continue
                }

                if (thisTable.properties.name !== oldTable.properties.name) {
                    up += await new Template().renameTable(oldTable, thisTable)
                }

                let columnChangeScript = ""

                for await (const thisColumnKey of Object.keys(thisTable.column)) {
                    const thisColumn: Column = thisTable.column[thisColumnKey]

                    const oldColumn: Column = oldTable.column[thisColumnKey]
                    if (oldColumn === undefined) {
                        columnChangeScript += await new Template().addColumn(thisColumn)
                        continue;
                    }

                    if (oldColumn.name !== thisColumn.name) {
                        columnChangeScript += await new Template().columnRename(oldColumn, thisColumn)
                    }

                    if ((oldColumn.notNull !== thisColumn.notNull) ||
                        (oldColumn.unique !== thisColumn.unique) ||
                        (oldColumn.default !== thisColumn.default) ||
                        (oldColumn.comment !== thisColumn.comment) ||
                        (oldColumn.dataType !== thisColumn.dataType)
                    ) {
                        columnChangeScript += await new Template().changeColumn(oldColumn)
                    }

                }

                if (columnChangeScript !== "") {
                    up += await new Template().changeTableTemplate(thisTable.properties.name, columnChangeScript)
                }

            }

            let migrationScript = await new Template().migrationTemplate(migrationClassName, up, '');
            await new FileMaker().makeMigration(config, migrationFileName, migrationScript);
        }
    }
}