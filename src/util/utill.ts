import axios from "axios"
export class Utill {
    async getLastVersion(){
        let respond=await axios.get(`https://raw.githubusercontent.com/dynobird/cli/master/package.json`)
        return respond.data.version
    }
}