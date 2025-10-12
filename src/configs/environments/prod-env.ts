import { Env } from '@/configs/environments/env';
import AppEnv from '@/enums/app-env';

const prodEnv: Env = {
  SERVER_URL: `${process.env.SERVER_URL}/${AppEnv.Prod}`,
};

export default prodEnv;
