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

/** query 参数生成 interface */
const queryToCode = (query: Query[], data: ApiData) => {
  const content = query.reduce((acc, { required, name, desc }) => {
    const symbol = required === '0' ? '?' : ''
    return `${acc}\n  /** ${desc} */\n  ${name}${symbol}: string;`
  }, '')
  return `interface Req${firstUpperCase(data.function_name)} {${content}\n}`
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
      const requestCode = isGet
        ? queryToCode(data.req_query, data)
        : rawToTs(requestRaw, {
            rootName: `Req${firstUpperCase(data.function_name)}`
          }).reduce((a, b) => `${a}\n\n${b}`)
      const responseCode = rawToTs(responseRaw, {
        rootName: `Res${firstUpperCase(data.function_name)}`
      }).reduce((a, b) => `${a}\n\n${b}`)
      const code = `${removeStr(requestCode)}\n\n${removeStr(responseCode)}`
      // 渲染 app
      render(code)
    } catch (error: any) {
      console.error('Yapi-Interface-Extension:', error.message)
    }
  }
}

export default responseHandler
