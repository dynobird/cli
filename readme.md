# Intorduction
Dynobird is database designer for web developer. So every line of code always think to make web developer easy in work. CLI tools is one of developer needs. We provide it with full support for community.
# Install
Dynobird cli must install under nodeJS and npm. If you dont have npm and nodeJS follow this tutorial https://nodejs.org/en/download/

dynobird recommend to use nodeJS version 14.04

```shell
npm i -g dynobird
```
# Using
dynobird CLI is build on top of nodeJS. NodeJS required to install in Operating system. 

## dynobird.json
this is configuration for project information and token for generating migration. This file can generate with command ```dynobird init```
## init
```$ dynobird init``` is command for initial dynobird.json if empty in project.

## migration
```$ dynobird migration:generate``` is command for generate database design to database migration.

