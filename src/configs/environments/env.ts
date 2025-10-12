import prodEnv from '@/configs/environments/prod-env';
import AppEnv from '@/enums/app-env';

export type Env = {
  SERVER_URL: string;
};

const env: Env = {
  [AppEnv.Prod]: prodEnv,
}[process.env.APP_ENV as string] || prodEnv;

export default env;
