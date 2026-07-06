import { SetMetadata } from '@nestjs/common';

export const LOG_LOCATION_ACCESS_KEY = 'log_location_access';

export interface LogLocationAccessOptions {
  endpoint: string;
  deviceIdParam?: string;
  mapBulk?: boolean;
}

export const LogLocationAccess = (options: LogLocationAccessOptions) =>
  SetMetadata(LOG_LOCATION_ACCESS_KEY, options);
