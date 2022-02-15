import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import config from 'config';
import { IncomingHttpHeaders } from 'http';
import rp from 'request-promise';
import cheerio from 'cheerio';

import { joinUrlPath, isFullUrl } from './utils/index';

interface CacheItem {
  etag: string;
  html: string;
}

interface HttpError<E> extends Error {
  result?: E;
}

interface HttpClientRes<T, E> {
  err?: HttpError<E>;
  statusCode?: number;
  result?: T;
  headers?: IncomingHttpHeaders;
}

@Injectable()
export class AppService {
  // 缓存
  private cache: { [url: string]: CacheItem | undefined } = {};

  async fetchIndexHtml(cdnRoot: string): Promise<string> {
    const ossUrl = `${config.get('OSS_BASE_URL')}${cdnRoot}/index.html`;
    const cacheItem = this.cache[ossUrl];
    // 请求options
    const options = {
      uri: ossUrl,
      resolveWithFullResponse: true, // 设置获取完整的响应，当值为false时，响应体只有body
      headers: {
        'If-None-Match': cacheItem && cacheItem.etag,
      },
    };

    // 响应
    const httpRes: HttpClientRes<any, any> = {};

    try {
      const response = await rp(options).promise();
      const { statusCode, headers, body } = response;
      httpRes.statusCode = statusCode;
      httpRes.headers = headers;
      if (statusCode < 300) {
        httpRes.result = body;
      } else {
        const err: HttpError<any> = new Error(
          `Request: 请求失败，${response.statusCode}`,
        );
        err.name = 'StatusCodeError';
        err.result = body;
        httpRes.err = err;
      }
    } catch (err) {
      httpRes.statusCode = err.statusCode; // 对于 GET 和 HEAD 方法来说，当验证失败的时候（有相同的Etag），服务器端必须返回响应码 304 （Not Modified，未改变）
      httpRes.err = err;
    }

    if (httpRes.statusCode === HttpStatus.OK) {
      // 文件有变化，更新缓存，并返回最新文件
      const finalHtml = this.htmlPostProcess(httpRes.result, cdnRoot);
      const etag = httpRes.headers.etag;
      this.cache[ossUrl] = {
        etag,
        html: finalHtml,
      };
      return finalHtml;
    } else if (httpRes.statusCode === HttpStatus.NOT_MODIFIED) {
      // 文件没有变化，返回缓存文件，
      // 服务端验证发现返回缓存文件计算出的Etag与请求头If-None-Match相同，返回304状态码
      return this.cache[ossUrl].html;
    } else {
      if (!this.cache[ossUrl]) {
        throw new HttpException(
          `不能正常获取页面 ${cdnRoot}`,
          HttpStatus.NOT_FOUND,
        );
      }
    }
    // 兜底
    return this.cache[ossUrl].html;
  }

  // 预处理
  htmlPostProcess(html: string, cdnRoot: string) {
    const $ = cheerio.load(html);
    const cdn = 'https://mstatic.cassmall.com'; // CDN域名
    const baseUrl = joinUrlPath(cdn, cdnRoot, '/'); // 拼接路径
    // 替换link相对路径引用
    $('link').each((index: number, ele: cheerio.TagElement) => {
      let href = ele.attribs['href'];
      if (href && !isFullUrl(href)) {
        href = joinUrlPath(baseUrl, href);
        ele.attribs['href'] = href;
      }
    });
    // 替换script相对路径引用
    $('script').each((index: number, ele: cheerio.TagElement) => {
      let src = ele.attribs['src'];
      if (src && !isFullUrl(src)) {
        src = joinUrlPath(baseUrl, src);
        ele.attribs['src'] = src;
      }
    });
    // 添加神策埋点Web JS SDK
    $('head').append(
      `<script type="text/javascript" src="https://mstatic.cassmall.com/assets/sensors/cassSensors.js"></script>`,
    );
    return $.html();
  }
}
