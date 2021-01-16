import { LaravelGenerator } from "./laravel/generator";
import { GenerateConfig } from "./lib/type";


export class Generator {
    migration(config: GenerateConfig) {
        if (config.framework === 'laravel') {
            new LaravelGenerator().migration(config)
        }
    }
}