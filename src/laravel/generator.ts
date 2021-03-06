import { Column, ForeignKey, GenerateConfig, History, Index, Table } from "../lib/type";
import { Template } from "./template/template"
import axios from "axios"
import { FileMaker } from "./fileMaker"
import prompts from "prompts"
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
import chalk from "chalk"
import { Migration } from "./migration";

export class LaravelGenerator {
    fakeName = [
        "Abiu",
        "Acerola",
        "Ackee",
        "Apple",
        "Apricot",
        "Avocado",
        "Banana",
        "Bilberry",
        "Blackberry",
        "Blackcurrant",
        "Black sapote",
        "Blueberry",
        "Boysenberry",
        "Breadfruit",
        "Cempedak",
        "Currant",
        "Cherry",
        "Cloudberry",
        "Coconut",
        "Cranberry",
        "Damson",
        "Date",
        "Durian",
        "Elderberry",
        "Feijoa",
        "Fig",
        "Gooseberry",
        "Grape",
        "Raisin",
        "Grapefruit",
        "Guava",
        "Honeyberry",
        "Huckleberry",
        "Jabuticaba",
        "Jackfruit",
        "Jambul",
        "Jostaberry",
        "Jujube",
        "Kiwifruit",
        "Kumquat",
        "Lemon",
        "Lime",
        "Loganberry",
        "Loquat",
        "Longan",
        "Lulo",
        "Lychee",
        "Mango",
        "Mangosteen",
        "Marionberry",
        "Melon",
        "Cantaloupe",
        "Honeydew",
        "Watermelon",
        "Mulberry",
        "Nance",
        "Nectarine",
        "Orange",
        "Clementine",
        "Mandarine",
        "Tangerine",
        "Papaya",
    ]
    getRandomeFakeName(number: number) {
        return this.fakeName[number]
    }

    async getOldTable(oldHistory: History, tableName: string) {

        if (!oldHistory) {
            return undefined
        }

        for await (const tableId of Object.keys(oldHistory.design.table)) {
            let table = oldHistory.design.table[tableId]
            if (table.name === tableName) {
                return table
            }
        }

        return undefined
    }

    async getOldColumn(oldHistory: History, tableName: string, columnName: string) {

        if (!oldHistory) {
            return undefined
        }

        for await (const tableKey of Object.keys(oldHistory.design.table)) {
            let table: Table = oldHistory.design.table[tableKey]
            if (table.properties.name === tableName) {
                for await (const columnKey of Object.keys(table.column)) {
                    let column: Column = table.column[columnKey]
                    if (columnName === column.name) {
                        return column
                    }
                }
            }
        }
        return undefined
    }

    async getOldIndex(oldHistory: History, tableName: string, indexName: string) {
        if (!oldHistory) {
            return undefined
        }

        for await (const tableKey of Object.keys(oldHistory.design.table)) {
            let table: Table = oldHistory.design.table[tableKey]
            if (table.properties.name === tableName) {
                for await (const indexKey of Object.keys(table.index)) {
                    let index: Index = table.index[indexKey]
                    if (indexName === index.name) {
                        return index
                    }
                }
            }
        }
        return undefined
    }

    async migration(config: GenerateConfig) {
        // console.log("DO migration for laravel")
        console.log(chalk.yellow(" Fetching data...."))
        var thisHistory: History;
        try {
            let page = 0
            let limit = 1
            var respond = await axios.get(`https://app.dynobird.com/api/v1/integration/access?tag=--latest&token=${config.token}&page=${page}&limit=${limit}`)
            if (respond.data.success === false) {
                console.log(chalk.red(" Error : " + respond.data.message))
                process.exit(1)
            }
            thisHistory = respond.data.payload.history[0]
        } catch (error) {
            console.log(chalk.red(" Error : " + error.message))
            process.exit(1)
        }

        console.log(chalk.green(" Fetching finish 🎉"))
        console.log(chalk.grey('-----------------------------------------'))
        console.log(chalk.green(` Project  name     : `) + respond.data.payload.properties.name)
        console.log(chalk.green(` Database type     : `) + respond.data.payload.properties.databaseType)
        console.log(chalk.green(` Schema version    : `) + respond.data.payload.properties.schemaVersion)
        console.log(chalk.green(` Total history     : `) + respond.data.payload.total)
        console.log(chalk.grey('-----------------------------------------'))

        // for await (const thisHistory of historyList) {
        if (!thisHistory.name || thisHistory.name.trim() == '') {
            let fakerName = this.getRandomeFakeName(moment(thisHistory.createdAt).get('second'))
            const name = await prompts({
                type: 'text',
                name: 'value',
                message: 'Migration name ?',
                initial: fakerName,
            });

            thisHistory.name = name.value
        }
        let dateFormated = moment(thisHistory.createdAt).utc().format("YYYY_MM_DD_HHmmss")
        let historyNameFormated = snakeCase(thisHistory.name)
        let migrationFileName = `${dateFormated}_${historyNameFormated}`
        let migrationClassName = pascalCase(thisHistory.name)
        let up = ''
        let fullForeignKeyScript = "";
        let fullIndexScript = "";
        let fullDeleteScript = "";
        let fullPrimaryScript = "";
        console.log(chalk.green(" Read migration in existing database..."))
        const oldHistory: History | undefined = await new Migration().getOldHistory(config)
        /**
         * Create table and change column
         */
        for await (const thisTableKey of Object.keys(thisHistory.design.table)) {
            const thisTable: Table = thisHistory.design.table[thisTableKey]
            if (oldHistory === undefined) {
                up += await new Template().createTable(thisTable);

                //create new foreignKey
                let foreignKeyScript = ""
                for await (const thisForeignKeyKey of Object.keys(thisTable.foreignKey)) {
                    const thisForeignKey = thisTable.foreignKey[thisForeignKeyKey]
                    foreignKeyScript += await new Template().foreignKeyAdd(thisForeignKey, thisTable, thisHistory.design.table)
                    // console.log(foreignKeyScript)
                }
                if (foreignKeyScript !== "") {
                    fullForeignKeyScript += await new Template().changeTableTemplate(thisTable.properties.name, foreignKeyScript)
                }

                // create new index
                let indexScript: string = ""
                for await (const thisIndexKey of Object.keys(thisTable.index)) {
                    let thisIndex = thisTable.index[thisIndexKey]
                    indexScript += await new Template().indexAdd(thisIndex, thisTable.column)
                }
                if (indexScript !== "") {
                    up += await new Template().changeTableTemplate(thisTable.properties.name, indexScript)
                }
                continue
            }
            const oldTable: Table = oldHistory.design.table[thisTableKey]

            if (oldTable === undefined) {
                up += await new Template().createTable(thisTable);

                // ADD FOREIGN KEY
                let foreignKeyScript = ""
                for await (const thisForeignKeyKey of Object.keys(thisTable.foreignKey)) {
                    const thisForeignKey = thisTable.foreignKey[thisForeignKeyKey]
                    foreignKeyScript += await new Template().foreignKeyAdd(thisForeignKey, thisTable, thisHistory.design.table)
                    // console.log(foreignKeyScript)
                }
                if (foreignKeyScript !== "") {
                    fullForeignKeyScript += await new Template().changeTableTemplate(thisTable.properties.name, foreignKeyScript)
                }

                // ADD INDEX
                let indexScript = ""
                for await (const thisIndexKey of Object.keys(thisTable.index)) {
                    let thisIndex = thisTable.index[thisIndexKey]
                    indexScript += await new Template().indexAdd(thisIndex, thisTable.column)
                }
                if (indexScript !== "") {
                    // console.log("CREATE NEW INDEX_____________________________________________________________________________ ")
                    up += await new Template().changeTableTemplate(thisTable.properties.name, indexScript)
                }
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
                    (oldColumn.dataType !== thisColumn.dataType) ||
                    (oldColumn.option.autoIncrement?.value !== thisColumn.option.autoIncrement?.value)||
                    (oldColumn.option.unsigned?.value !== thisColumn.option.unsigned?.value)
                ) {
                    columnChangeScript += await new Template().changeColumn(thisColumn)
                }

            }

            if (columnChangeScript !== "") {
                up += await new Template().changeTableTemplate(thisTable.properties.name, columnChangeScript)
            }



            /**
            * ------------ start primary column manipulation
            */


            let thisPrimaryColumnNameList: string[] = []
            let oldPrimaryColumnNameList: string[] = []
            // Get all this primary column name
            for await (const thisColumnKey of Object.keys(thisTable.column)) {
                // console.log("1 pppppp");
                const thisColumn: Column = thisTable.column[thisColumnKey]
                if (thisColumn.primary === true) {
                    thisPrimaryColumnNameList.push(thisColumn.name)
                }
            }
            // short ascending
            thisPrimaryColumnNameList.sort()


            // Get all old primary column name
            for await (const oldColumnKey of Object.keys(oldTable.column)) {
                // console.log("2 pppppp");
                const oldColumn: Column = oldTable.column[oldColumnKey]
                if (oldColumn.primary === true) {
                    oldPrimaryColumnNameList.push(oldColumn.name)
                }
            }
            oldPrimaryColumnNameList.sort()

            // console.log(oldPrimaryColumnNameList);
            // console.log(thisPrimaryColumnNameList);

            let isDifferent = false;
            // compare change and additional
            for (let i = 0; i < thisPrimaryColumnNameList.length; i++) {
                // console.log("3 pppppp");
                // if there are additional primary key
                if (oldPrimaryColumnNameList[i] === undefined) {
                    isDifferent = true
                    break;
                }

                // if there are changed primary key
                if (thisPrimaryColumnNameList[i] !== oldPrimaryColumnNameList[i]) {
                    isDifferent = true
                    break;
                }
            }

            for (let i = 0; i < oldPrimaryColumnNameList.length; i++) {
                // console.log("4 pppppp");
                // if there are deleted primary column
                if (thisPrimaryColumnNameList[i] === undefined) {
                    isDifferent = true
                    break;
                }

                // if there are changed primary key
                if (oldPrimaryColumnNameList[i] !== thisPrimaryColumnNameList[i]) {
                    isDifferent = true
                    break;
                }
            }

            if (isDifferent === true) {
                let dropPrimaryKeyScript = await new Template().dropPrimary(thisTable)
                let primaryChangeScript = "";
                for await (const thisColumnKey of Object.keys(thisTable.column)) {
                    let thisColumn: Column = thisTable.column[thisColumnKey]

                    if (thisColumn.primary === true && thisColumn.dataType !== 'id' && thisColumn.option.autoIncrement?.value !== true) {
                        primaryChangeScript += `'${thisColumn.name}', `
                    }
                }

                if (primaryChangeScript !== "") {
                    primaryChangeScript = primaryChangeScript.substring(0, primaryChangeScript.length - 2)
                    primaryChangeScript = `$table->primary([${primaryChangeScript}]);\r\n`
                }

                primaryChangeScript = dropPrimaryKeyScript + primaryChangeScript
                fullPrimaryScript += await new Template().changeTableTemplate(thisTable.properties.name, primaryChangeScript)

            }


            /**
             * ------------ end primary column manipulation
             */

            let foreignKeyScript = ""
            for await (const thisForeignKeyKey of Object.keys(thisTable.foreignKey)) {
                const thisForeignKey: ForeignKey = thisTable.foreignKey[thisForeignKeyKey]
                const oldForeignKey: ForeignKey = oldTable.foreignKey[thisForeignKeyKey]
                if (oldForeignKey === undefined) {
                    foreignKeyScript += await new Template().foreignKeyAdd(thisForeignKey, thisTable, thisHistory.design.table)
                    continue;
                }

                if ((oldForeignKey.name !== thisForeignKey.name) ||
                    (oldForeignKey.columnIds[0] !== thisForeignKey.columnIds[0]) ||
                    (oldForeignKey.refTableId !== oldForeignKey.refTableId) ||
                    (oldForeignKey.refColumnIds[0] !== oldForeignKey.refColumnIds[0]) ||
                    (oldForeignKey.onDelete !== oldForeignKey.onDelete) ||
                    (oldForeignKey.onUpdate !== oldForeignKey.onUpdate)
                ) {
                    foreignKeyScript += await new Template().foreignKeyDelete(oldForeignKey)
                    foreignKeyScript += await new Template().foreignKeyAdd(thisForeignKey, thisTable, thisHistory.design.table)
                }
            }

            if (foreignKeyScript !== "") {
                fullForeignKeyScript += await new Template().changeTableTemplate(thisTable.properties.name, foreignKeyScript)
            }

            let indexScript = ""
            for await (const thisIndexKey of Object.keys(thisTable.index)) {
                let thisIndex: Index = thisTable.index[thisIndexKey]

                let oldIndex: Index = oldTable.index[thisIndexKey]

                if (oldIndex === undefined) {
                    indexScript += await new Template().indexAdd(thisIndex, thisTable.column)
                    continue;
                }

                let isIndexColumnChanged = false

                // detect additional column in index rule
                for await (const thisIndexColumnKey of Object.keys(thisIndex.column)) {
                    if (oldIndex.column[thisIndexColumnKey] === undefined) {
                        isIndexColumnChanged = true
                        break;
                    }
                }


                // detect removed column in index rule
                for await (const oldIndexColumnKey of Object.keys(oldIndex.column)) {
                    if (thisIndex.column[oldIndexColumnKey] === undefined) {
                        isIndexColumnChanged = true
                        break;
                    }
                }

                if ((oldIndex.name !== thisIndex.name) &&
                    (oldIndex.type === thisIndex.type) &&
                    (oldIndex.comment === oldIndex.comment) &&
                    isIndexColumnChanged === false
                ) {
                    indexScript += await new Template().indexRename(oldIndex, thisIndex)
                }
                else if ((oldIndex.type !== thisIndex.type) ||
                    (oldIndex.comment !== thisIndex.comment) ||
                    isIndexColumnChanged === true
                ) {
                    indexScript += await new Template().indexDelete(oldIndex)
                    indexScript += await new Template().indexAdd(thisIndex, thisTable.column)
                }
            }

            if (indexScript !== "") {
                fullIndexScript += await new Template().changeTableTemplate(thisTable.properties.name, indexScript)
            }

        }


        if (oldHistory !== undefined) {
            for await (const oldTableKey of Object.keys(oldHistory.design.table)) {
                const oldTable: Table = oldHistory.design.table[oldTableKey]
                const thisTable: Table = thisHistory.design.table[oldTableKey]

                if (thisTable === undefined) {
                    fullDeleteScript += await new Template().dropForeignKeyByTable(oldHistory.design.table, oldTable)
                    fullDeleteScript += await new Template().tableDelete(oldTable)
                    continue;
                }

                // delete index script
                let dropIndexScript = ""
                for await (const oldIndexKey of Object.keys(oldTable.index)) {
                    let oldIndex: Index = oldTable.index[oldIndexKey]
                    let thisIndex: Index = thisTable.index[oldIndexKey]
                    if (thisIndex === undefined) {
                        dropIndexScript += await new Template().indexDelete(oldIndex)
                    }
                }

                if (dropIndexScript !== "") {
                    fullDeleteScript += await new Template().changeTableTemplate(oldTable.properties.name, dropIndexScript)
                }


                // deleted column
                let dropColumnScript = ""
                for await (const oldColumnKey of Object.keys(oldTable.column)) {
                    let thisColumn = thisTable.column[oldColumnKey]
                    let oldColumn = oldTable.column[oldColumnKey]

                    if (thisColumn === undefined) {
                        fullDeleteScript += await new Template().dropForeignKeyByColumn(oldHistory.design.table, oldColumn)
                        dropColumnScript += await new Template().columnDelete(oldColumn)
                    }

                }
                if (dropColumnScript !== "") {
                    fullDeleteScript += await new Template().changeTableTemplate(oldTable.properties.name, dropColumnScript)
                }


                // delete foreign key
                let dropForeignKeyScript = "";
                for await (const oldForeignKeyKey of Object.keys(oldTable.foreignKey)) {
                    let oldForeignKey: ForeignKey = oldTable.foreignKey[oldForeignKeyKey]
                    // check if depedency to column and table deleted it must handle delete in parent check
                    let refTable: Table = thisHistory.design.table[oldForeignKey.refTableId]
                    if ((refTable === undefined) ||
                        (refTable.column[oldForeignKey.refColumnIds[0]] === undefined) ||
                        (thisTable.column[oldForeignKey.columnIds[0]]) === undefined) {
                        continue
                    }


                    if (thisTable.foreignKey[oldForeignKeyKey] === undefined) {
                        dropForeignKeyScript += await new Template().foreignKeyDelete(oldForeignKey)
                    }
                }

                if (dropForeignKeyScript !== "") {
                    fullDeleteScript += await new Template().changeTableTemplate(oldTable.properties.name, dropForeignKeyScript)
                }
            }
        }

        up += fullForeignKeyScript
        up += fullIndexScript;
        up += fullDeleteScript;
        up += fullPrimaryScript;

        let migrationScript = await new Template().migrationTemplate(migrationClassName, up, '');
        await new FileMaker().makeMigration(config, migrationFileName, migrationScript);
        // }
        console.log(chalk.bgGreen(chalk.black(" Status     : Generate migration completed ✔  ")))
        process.exit(1)
    }
}