import crypto from 'crypto';

export const utils = {
  md5: (payload: string): string => {
    return crypto.createHash('MD5').update(payload).digest('hex');
  },


  syncFilter: async <T> (arr: T[], callback: (o: T) => Promise<boolean>): Promise<T[]> => {
    const promises: Promise<T|false>[] = arr.map(async (item: T): Promise<T|false> => {
      return new Promise((resolve) => {
        callback(item).then(result => {
          resolve(result ? item : false);
        });
      });
    }); // @ts-ignore
    return (await Promise.all(promises)).filter(i => i != false);
  }

};
