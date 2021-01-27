export interface GenerateConfig {
    tag: string
    frameworkVersion: string
    token: string
    framework: string
    migrationsDir: string
    entitiesDir: string
}

export interface History {
    id: string
    design: {
        table: any,
        connector: any,
        canvas: any
    }
    name: string
    schemaVersion: string
    createdAt: string
    tags: Tag[]
}

export interface Tag {
    id: string
    name: string
    note: string
    createdAt: string
    updatedAt: string
}

export interface Table {
    id: string
    properties: {
        width: number,
        height: number,
        name: string,
        point: {
            x: number,
            y: number
        },
    },
    connectorIds: any[],
    foreignKey: any,
    index: any,
    column: any

}
export interface ForeignKey {
    id: string
    name: string
    columnIds: [
        string
    ]
    refTableId: string
    refColumnIds: [
        string
    ],
    onDelete: string,
    onUpdate: string
}
export interface IndexColumn {
    id: string
    order: number
}
export interface Index {
    id: string
    name: string
    type: 'INDEX' | 'UNIQUE'
    comment: string,
    column: any
}

export interface Column {
    id: string,
    name: string,
    dataType: string,
    primary: boolean,
    notNull: boolean,
    unique: boolean,
    default: null | string,
    comment: string,
    option: {},
    style: {
        shadowBlur: number,
        shadowColor: string
    }
}