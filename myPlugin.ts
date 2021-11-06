import * as path from "path";
import * as fs from "fs";
import * as http from "http";
import express from "express";
import axios from "axios";
import { Plugin } from "vite";
import { Express } from "./node_modules/@types/express-serve-static-core/index";

// 想要在 node 环境下直接读取文件，需要使用 ts-node 的 register
require("ts-node/register");

const bodyParser = require("body-parser");
const apisPath = path.join(__dirname, "./src/apis");

// 发起请求的模板
const requestTemp = (
  fileName: string,
  fn: string
) => `export function ${fn}(data) {
    const isGet = !data
    return fetch("/api/${fileName}/${fn}", {
        method: isGet ? "GET" : "POST",
        body: isGet ? undefined : JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        },
    }).then((res) => res.json());
}`;

// 获取 apis 下的文件和函数
function getApis() {
  const files = fs
    .readdirSync(apisPath)
    .map((filePath) => path.join(apisPath, filePath));
  const apis = files
    .filter((filePath) => {
      const stat = fs.statSync(filePath);
      return stat.isFile();
    })
    .map((filePath) => {
      const fns = require(filePath);
      const fileName = path.basename(filePath, ".ts");
      return Object.keys(fns).map((fnName) => ({
        fileName,
        fn: fns[fnName],
      }));
    });
  return apis.flat();
}

// 注册路由处理函数
function registerApis(server: Express) {
  const apis = getApis();

  // 遍历 apis，注册路由及其处理函数
  apis.forEach(({ fileName, fn }) => {
    server.all(`/api/${fileName}/${fn.name}`, async (req, res) => {
      const data = await fn(req.body);
      res.send(JSON.stringify(data));
    });
  });
}

// 启动 app
function appStart(): Promise<string> {
  const app = express();
  app.use(bodyParser.json());
  registerApis(app);
  const server = http.createServer(app);

  return new Promise((resolve) => {
    // listen 的第一个参数如果为 0，则表示随机获取一个未被占用的端口
    server.listen(0, () => {
      const address = server.address();

      if (typeof address === 'string') {
        resolve(`http://${address}`);
      } else {
        resolve(`http://127.0.0.1:${address.port}`);
      }
    });
  });
}

// 请求转发
function sendRequest(address: string, url: string, body: any, params: any) {
  return axios.post(`${address}${url}`, body, {
    params,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

// 设置 middleware 拦截请求
async function middleware() {
  // 启动 app
  const address = await appStart();
  return async (req, res, next) => {
    if (req.url.startsWith('/api')) {
      // 转发请求到 app
      const response = await sendRequest(address, req.url, req.body, req.query);
      // 返回结果
      res.end(JSON.stringify(response.data));
      return;
    }
    next();
  };
}

// 将函数转为请求
function transformRequest(src: string, id: string) {
  if (id.startsWith(apisPath)) {
    const fileName = path.basename(id, ".ts");
    const fnNames = [...src.matchAll(/async function (\w+)/g)].map(
      (item) => item[1]
    );
    return {
      code: fnNames.map((fn) => requestTemp(fileName, fn)).join("\n"),
      map: null,
    };
  }
}

export default function VitePlugin(): Plugin {
  return {
    name: 'my-plugin',
    transform: transformRequest,
    async configureServer(server) {
      // vite 内部的 server 也要注册 bodyParser
      // 用于在转发时获取 body
      server.middlewares.use(bodyParser.json());
      server.middlewares.use(await middleware());
    },
  };
}
