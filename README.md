# yapi-interface-extension

一个 YAPI 浏览器插件，在 YAPI 接口文档显示 TypeScript interface。

### Install

1. clone 项目，执行 `yarn install`。
2. 新增且修改 `public/manifest.json` 文件的 `matches` 字段，将 www.xxx.com 改为你部署的 YAPI 域名。

```json
{
  "name": "Yapi-Interface-Extension",
  "manifest_version": 2,
  "version": "1.2.1",
  "author": "seho",
  "description": "在 YAPI 接口文档中显示 TypeScript Interface",
  "icons": {
    "64": "icon-64.png"
  },
  "content_scripts": [
    {
      "matches": ["*://www.xxx.com/*"], // 例如www.baidu.com
      "js": ["content/main.js"],
      "run_at": "document_start"
    }
  ],
  "web_accessible_resources": ["inject/*.js"],
  "content_security_policy": "script-src 'self' 'unsafe-eval'; object-src 'self';"
}
```

3. 执行 `yarn build`，将生成后的 dist 文件夹拖入 chrome 插件页面。

### 新增特性

对于 Rest API, url 中不会体现动词，add, update, delete 等等，对于这一类 url，插件会自动根据 methods 推断一个动词自动加在 TS 类型声明中，如果推断不符合业务场景，需要开发者自行修改。

为了前端更方便的获得类型提示，在开发中要对 api url 有一定的要求，所以后端开发需要尽可能得贴合[rest 风格](https://zh.wikipedia.org/wiki/%E8%A1%A8%E7%8E%B0%E5%B1%82%E7%8A%B6%E6%80%81%E8%BD%AC%E6%8D%A2)

method 和动词的字典如下:

```ts
const methodMap: Record<string, string> = {
  GET: 'Get',
  POST: 'Create',
  PUT: 'Update',
  DELETE: 'Delete'
}
```

### Example

![Example](https://github.com/molvqingtai/yapi-interface-extension/blob/master/example.jpg)

### 伴生模板 💗

[和它使用能发挥更好的作用](https://github.com/seho-code-life/project_template/tree/master)

### License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/molvqingtai/yapi-interface-extension/blob/master/LICENSE) file for details
