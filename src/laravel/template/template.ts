import { Column, ForeignKey, Index, IndexColumn, Table } from "../../lib/type";

export class Template {
    makeTableTemplate(tableName: string, columnScript: string) {
        return `Schema::create('${tableName}', function (Blueprint $table) {
            ${columnScript}
        });\r\n`
    }

    async columnDelete(column: Column) {
        return `$table->dropColumn('${column.name}');\r\n`;
    }
    async dropForeignKeyByColumn(oldTableList: any, deletedColumn: Column) {
        let scriptDelete = ""
        for await (const oldTableKey of Object.keys(oldTableList)) {
            let oldTable: Table = oldTableList[oldTableKey]
            let scriptDeletedFKTable = "";
            for await (const oldForeignKeyKey of Object.keys(oldTable.foreignKey)) {
                let oldForeignKey: ForeignKey = oldTable.foreignKey[oldForeignKeyKey]
                if (oldForeignKey.refColumnIds[0] === deletedColumn.id) {
                    scriptDeletedFKTable += await this.foreignKeyDelete(oldForeignKey)
                    continue;
                }

                if (oldForeignKey.columnIds[0] === deletedColumn.id) {
                    scriptDeletedFKTable += await this.foreignKeyDelete(oldForeignKey)
                    continue;
                }
            }


            if (scriptDeletedFKTable !== "") {
                scriptDelete += this.changeTableTemplate(oldTable.properties.name, scriptDeletedFKTable)
            }
        }
        return scriptDelete
    }

    async dropForeignKeyByTable(oldTableLIst: any, deletedTable: Table) {
        let scriptDelete = ""

        for await (const oldTableKey of Object.keys(oldTableLIst)) {
            let oldTable: Table = oldTableLIst[oldTableKey]
            let scriptDeleteFkTable = ""
            for await (const oldForeignKeyKey of Object.keys(oldTable.foreignKey)) {
                let oldForeignKey: ForeignKey = oldTable.foreignKey[oldForeignKeyKey]

                if (oldForeignKey.refTableId === deletedTable.id) {
                    scriptDeleteFkTable += await this.foreignKeyDelete(oldForeignKey)
                }
            }

            if (scriptDeleteFkTable !== "") {
                scriptDelete += this.changeTableTemplate(oldTable.properties.name, scriptDeleteFkTable)
            }
        }

        return scriptDelete
    }

    tableDelete(deletedTable: Table) {
        return `Schema::dropIfExists('${deletedTable.properties.name}');`;
    }

    changeTableTemplate(tableName: string, columnChangeScript: string) {
        return `Schema::table('${tableName}', function (Blueprint $table) {
            ${columnChangeScript}
        });\r\n`;
    }
    async indexRename(oldIndex: Index, thisIndex: Index) {
        return `$table->renameIndex('${oldIndex.name}', '${thisIndex.name}');\r\n`;
    }

    async indexAdd(index: Index, columnList: any) {
        let columnIndex = ''
        for await (const indexColumnKey of Object.keys(index.column)) {
            let thisIndexColumn: IndexColumn = index.column[indexColumnKey]
            let thisColumn: Column = columnList[thisIndexColumn.id]
            columnIndex += `'${thisColumn.name}', `
        }
        columnIndex = columnIndex.substring(0, columnIndex.length - 2)
        if (index.type === 'INDEX') {
            return `$table->index([${columnIndex}],'${index.name}');\r\n`;
        } else if (index.type === 'UNIQUE') {
            return `$table->unique([${columnIndex}],'${index.name}');\r\n`;
        }
    }
    async indexDelete(index: Index) {
        if (index.type === 'INDEX') {
            return `$table->dropIndex('${index.name}');\r\n`;
        } else if (index.type === 'UNIQUE') {
            return `$table->dropIndex('${index.name}');\r\n`;
        }
    }


    renameTable(oldTable: Table, thisTable: Table) {
        return `Schema::rename('${oldTable.properties.name}', '${thisTable.properties.name}');\r\n`;
    }

    columnRename(oldColumn: Column, thisColumn: Column) {
        return `$table->renameColumn('${oldColumn.name}', '${thisColumn.name}');\r\n`;
    }

    changeColumn(thisColumn: Column) {
        let columnScript = ""
        console.log("MASUKK columnnnn " + thisColumn.dataType)
        let tmp = thisColumn.dataType.split('(')
        let length = 0
        let cleanColumnType = tmp[0]
        if (tmp[1]) {
            console.log("no have lenth")
            length = parseInt(tmp[1].replace(")", "").trim())
        }
        if (length === 0) {
            columnScript += `$table->${cleanColumnType}('${thisColumn.name}')`
        } else {
            columnScript += `$table->${cleanColumnType}('${thisColumn.name}', ${length})`
        }
        if (thisColumn.unique === true) {
            columnScript += '->unique()';
        }

        if (thisColumn.notNull === false) {
            columnScript += '->nullable()';
        }

        if (thisColumn.default !== null) {
            // is number

            // is regular expression

            // is string
            columnScript += `->default('${thisColumn.default}')`;
        }

        if (thisColumn.comment !== '' && thisColumn.comment !== null) {
            columnScript += `->comment('${thisColumn.comment}')`
        }

        // closer
        columnScript += "->change();\r\n";
        return columnScript;
    }

    addColumn(thisColumn: Column) {
        let columnScript = ""
        console.log("MASUKK columnnnn " + thisColumn.dataType)
        let tmp = thisColumn.dataType.split('(')
        let length = 0
        let cleanColumnType = tmp[0]
        if (tmp[1]) {
            console.log("no have lenth")
            length = parseInt(tmp[1].replace(")", "").trim())
        }
        if (length === 0) {
            columnScript += `$table->${cleanColumnType}('${thisColumn.name}')`
        } else {
            columnScript += `$table->${cleanColumnType}('${thisColumn.name}', ${length})`
        }
        if (thisColumn.unique === true) {
            columnScript += '->unique()';
        }

        if (thisColumn.notNull === false) {
            columnScript += '->nullable()';
        }

        if (thisColumn.default !== null) {
            // is number

            // is regular expression

            // is string
            columnScript += `->default('${thisColumn.default}')`;
        }

        if (thisColumn.comment !== '' && thisColumn.comment !== null) {
            columnScript += `->comment('${thisColumn.comment}')`
        }

        // closer
        columnScript += ";\r\n";
        return columnScript;
    }

    async foreignKeyDelete(foreginKey: ForeignKey) {
        return `$table->dropForeign('${foreginKey.name}');\r\n             `;
    }
    async foreignKeyAdd(foreignKey: ForeignKey, thisTable: Table, thisListTable: any) {

        let sourceColumn: Column = thisTable.column[foreignKey.columnIds[0]];
        let refTable: Table = thisListTable[foreignKey.refTableId]
        let refColumn: Column = refTable.column[foreignKey.refColumnIds[0]]
        return `$table->foreign('${sourceColumn.name}', '${foreignKey.name}')->references('${refColumn.name}')->on('${refTable.properties.name}');\r\n             `;
    }
    async createTable(table: Table) {
        let tableName = table.properties.name;
        let columnScript = ""
        console.log("MASUKK")

        for await (const thisColumnKey of Object.keys(table.column)) {
            let thisColumn: Column = table.column[thisColumnKey]
            columnScript += await this.addColumn(thisColumn);
        }


        let primaryColumn = ""
        for await (const thisColumnKey of Object.keys(table.column)) {
            let thisColumn: Column = table.column[thisColumnKey]

            if (thisColumn.primary === true && thisColumn.dataType !== 'id') {
                primaryColumn += `'${thisColumn.name}', `
            }
        }

        if (primaryColumn !== "") {
            primaryColumn = primaryColumn.substring(0, primaryColumn.length - 2)
            columnScript += `table->primary([${primaryColumn}]);\r\n             `
        }

        return this.makeTableTemplate(tableName, columnScript)
    }

    async migrationTemplate(migrationName: string, upScript: string, downScript: string) {
        return `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

class ${migrationName} extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        ${upScript}
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        ${downScript}
    }
};`
    }
}
