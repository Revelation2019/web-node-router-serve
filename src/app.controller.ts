import {
  Controller,
  Get,
  Header,
  HttpException,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { AppService } from './app.service';
import { Request } from 'express';
import config from 'config';

type Route = { gitRepo: string; cdnRoot: string; url: string[] };
const routes = config.get('ROUTES');
const routeMap: { [key: string]: Route } = {};
routes.forEach((route) => {
  for (const url of route.url) {
    routeMap[url] = route;
  }
});

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get(Object.keys(routeMap))
  @Header('X-UA-Compatible', 'IE=edge,chrome=1')
  async route(@Req() request: Request): Promise<string> {
    // const path = request.path.replace(/\/$/g, '');
    const route = routeMap[request.path];
    if (!route) {
      throw new HttpException(
        '没有找到当前url对应的路由',
        HttpStatus.NOT_FOUND,
      );
    }
    // 获取请求路径对应的静态页面
    return this.appService.fetchIndexHtml(route.cdnRoot);
  }
}
