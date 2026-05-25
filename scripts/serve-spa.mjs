import { createReadStream } from 'node:fs'
import { access, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, resolve, sep } from 'node:path'

const [rootArg, portArg] = process.argv.slice(2)

if (!rootArg || !portArg) {
  console.error('Usage: node scripts/serve-spa.mjs <dist-dir> <port>')
  process.exit(1)
}

const root = resolve(rootArg)
const port = Number(portArg)

const contentTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

const isInsideRoot = (filePath) => filePath === root || filePath.startsWith(`${root}${sep}`)

const getFilePath = async (url) => {
  const requestUrl = new URL(url ?? '/', 'http://127.0.0.1')
  const requestedPath = decodeURIComponent(requestUrl.pathname)
  const candidatePath = resolve(root, `.${requestedPath === '/' ? '/index.html' : requestedPath}`)

  if (isInsideRoot(candidatePath)) {
    try {
      const fileStat = await stat(candidatePath)

      if (fileStat.isFile()) {
        return candidatePath
      }
    } catch {
      // Fall through to the SPA fallback.
    }
  }

  return resolve(root, 'index.html')
}

await access(resolve(root, 'index.html'))

const server = createServer(async (request, response) => {
  try {
    const filePath = await getFilePath(request.url)
    const extension = extname(filePath)

    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': contentTypes[extension] ?? 'application/octet-stream',
    })
    createReadStream(filePath).pipe(response)
  } catch {
    response.writeHead(500, { 'Content-Type': 'text/plain' })
    response.end('Server error')
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Serving ${root} at http://127.0.0.1:${port}`)
})
