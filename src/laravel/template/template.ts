import { Column, Table } from "../../lib/type";

export class Template {
    makeTableTemplate(tableName: string, columnScript: string) {
        return `Schema::create('${tableName}', function (Blueprint $table) {
            ${columnScript}
        });\r\n`
    }

    changeTableTemplate(tableName: string, columnChangeScript: string) {
        return `Schema::table('${tableName}', function (Blueprint $table) {
            ${columnChangeScript}
        });\r\n`;
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

    async createTable(table: Table) {
        let tableName = table.properties.name;
        let columnScript = ""
        console.log("MASUKK")

        for await (const thisColumnKey of Object.keys(table.column)) {
            let thisColumn = table.column[thisColumnKey]
            columnScript += await this.addColumn(thisColumn);
        }
        return this.makeTableTemplate(tableName, columnScript)
    }

    async migrationTemplate(migrationName: string, upScript: string, downScript: string) {
        return `<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

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
