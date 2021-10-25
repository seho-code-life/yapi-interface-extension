import rawToTs from 'raw-to-ts'
import { IsomorphicResponse } from '@mswjs/interceptors'

interface Query {
  required: string
  name: string
  desc: string
}
interface ApiData {
  path: string
  method: string
  function_name: string
}

// methods和动词字典
const methodMap: Record<string, string> = {
  GET: 'Get',
  POST: 'Create',
  PUT: 'Update',
  DELETE: 'Delete'
}

// 首字母大写
const firstUpperCase = (str: string) => {
  return str.toLowerCase().replace(/^\S/g, function (s: string) {
    return s.toUpperCase()
  })
}

// 去除指定字符串的某个子串
const removeStr = (str: string, targetStr: string = 'export ') => {
  return str.replace(targetStr, '')
}

// 生成model api 代码片段
const initModelApiCode = (params: {
  url: string
  method: string
  moduleName: string
  reqTypeName: string
  resTypeName: string
}) => {
  const { url, method, moduleName, reqTypeName, resTypeName } = params
  const upperCaseModuleName = firstUpperCase(moduleName)
  // 获取方法名称， 动词 + 模块名
  const functionName = methodMap[method].toLowerCase() + upperCaseModuleName
  return `${functionName}(params: T${upperCaseModuleName}ApiModel.${reqTypeName}): Promise<T${upperCaseModuleName}ApiModel.${resTypeName}> {
  return useRequest({
    url: '${url}',
    method: '${method}',
    data: params
  });
}
`
}
// 生成controller 代码片段
const initControllerCode = (params: {
  method: string
  moduleName: string
  reqTypeName: string
}) => {
  const { method, moduleName, reqTypeName } = params
  const upperCaseModuleName = firstUpperCase(moduleName)
  // 获取方法名称， 动词 + 模块名
  const functionName = methodMap[method].toLowerCase() + upperCaseModuleName
  return `${functionName}(params: T${upperCaseModuleName}ApiModel.${reqTypeName}) {
  return this.apiModel.${functionName}(params);
}
`
}

/** query 参数生成 interface */
const queryToCode = (query: Query[], data: ApiData) => {
  const content = query.reduce((acc, { required, name, desc }) => {
    const symbol = required === '0' ? '?' : ''
    return `${acc}\n  /** ${desc} */\n  ${name}${symbol}: string;`
  }, '')
  return `interface Req${methodMap[data.method]}${firstUpperCase(
    data.function_name
  )} {${content}\n}`
}

const responseHandler = (render: Function) => {
  return (res: IsomorphicResponse) => {
    try {
      const data = JSON.parse(res.body ?? `{}`).data
      const isGet = data.method === 'GET'
      const requestRaw = JSON.parse(data?.req_body_other || `{}`)
      const responseRaw = JSON.parse(data?.res_body || `{}`)
      // 处理data中的path，获取模块名和方法名
      const paths = data.path.split('/')
      data.function_name = paths[paths.length - 1]
      // req root name
      const reqRootName = `Req${methodMap[data.method]}${firstUpperCase(
        data.function_name
      )}`
      // res root name
      const resRootName = `Res${methodMap[data.method]}${firstUpperCase(
        data.function_name
      )}`
      const requestCode = isGet
        ? queryToCode(data.req_query, data)
        : rawToTs(requestRaw, {
            rootName: reqRootName
          }).reduce((a, b) => `${a}\n\n${b}`)
      const responseCode = rawToTs(responseRaw, {
        rootName: resRootName
      }).reduce((a, b) => `${a}\n\n${b}`)
      const code = [`${removeStr(requestCode)}\n\n${removeStr(responseCode)}`]
      // 生成model & controller 的代码片段
      const modelApiCode = initModelApiCode({
        url: data.path,
        method: data.method,
        moduleName: data.function_name,
        reqTypeName: reqRootName,
        resTypeName: resRootName
      })
      const controllerCode = initControllerCode({
        method: data.method,
        moduleName: data.function_name,
        reqTypeName: reqRootName
      })
      console.log(modelApiCode)
      // 渲染 app
      render(code.concat([modelApiCode, controllerCode]))
    } catch (error: any) {
      console.error('Yapi-Interface-Extension:', error.message)
    }
  }
}

export default responseHandler
