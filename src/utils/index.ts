import * as url from 'url';
import * as path from 'path';

export function joinUrlPath(baseUrl: string, ...paths: string[]): string {
  const urlObj = url.parse(baseUrl);
  urlObj.pathname = path.posix.join(urlObj.pathname, ...paths);
  const searchIdx = urlObj.pathname.indexOf('?');
  if (searchIdx > -1) {
    urlObj.search = urlObj.pathname.slice(searchIdx + 1);
    urlObj.pathname = urlObj.pathname.slice(0, searchIdx);
  }
  return url.format(urlObj);
}

export function isFullUrl(url: string) {
  return /^https?:|^\/\//.test(url);
}
