# Intorduction [0.0.14]
Dynobird.com is database designer for web developer. So every line of code always think to make web developer easy in work. CLI tools is one of developer needs. We provide it with full support for community.

youtube :

[![dynobird.com demo video](https://github.com/dynobird/cli/raw/master/docs/img/history.png)](https://www.youtube.com/watch?v=wtq0_OuL7cM)

# Install
[dynobird](https://dynobird.com) cli must install under nodeJS and npm. If you don't have npm and nodeJS follow this tutorial https://nodejs.org/en/download/

[dynobird](https://dynobird.com) recommend to use nodeJS version 14.04

```shell
npm i -g dynobird
```
# Using
[dynobird](https://dynobird.com) CLI is build on top of nodeJS. NodeJS required to install in Operating system. 
[dynobird](https://dynobird.com) CLI required token to access your project. Follow this picture for copy your project token.

<img src="https://github.com/dynobird/cli/raw/master/docs/img/token.png" width="400px">

## dynobird.json
this is configuration for project information and token for generating migration. This file can generate with command ```dynobird init```
```json
{
    "entitiesDir": "model",
    "migrationsDir": "migration",
    "framework": "laravel",
    "frameworkVersion": "8",
    "token": "xxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "db": {
        "type": "MY_SQL",
        "host": "localhost",
        "user": "root",
        "password": "root",
        "database": "laravel",
        "port": 3306
    }
}
```

## init
```$ dynobird init``` is command for initial dynobird.json if empty in project.

<img src="https://github.com/dynobird/cli/raw/master/docs/img/dynobird-init.png" width="400px">

## Migration strategy
This is command to work with dynobird migrtion. There are two strategy to use this migration tools from dynobird. 
Strategy :
* existing project
  In existing project need to import in first. Use `migration:import` for import all database dasign and migration version  to  dynobird. After all is imported work your design in dynobird.com. If need to generate code migration use `migration:generate` it will generate latest migration to project directory.
* new project 
  For new project is easy to integrate with it. Just generate with this command `migration:generate` every need to write migration code.

## migration:import
```$ dynobird migration:import``` is command to import migration and database to dynobird. This is command for integrate existing project with dynobird.

<img src="https://github.com/dynobird/cli/raw/master/docs/img/migration-import.png" width="400px">

## migration:generate
```$ dynobird migration:generate``` is command for generate database design to database migration.

<img src="https://github.com/dynobird/cli/raw/master/docs/img/dynobird-generate-migration.png" width="400px">

youtube :
https://www.youtube.com/watch?v=owpAH5PyfLE

## database:import
```$ dynobird database:import``` is command for import database design from existing database without import migration.

<img src="https://github.com/dynobird/cli/raw/master/docs/img/database-import.png" width="400px">

youtube :
https://www.youtube.com/watch?v=qiG_21WRQ6A