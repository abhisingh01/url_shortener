import { readFile, writeFile } from 'fs/promises';
import { createServer } from 'http';
import path from 'path';

const PORT = 3000;

const DATA_File = path.join('data','links.json')

const serveFile = async (res, filePath, contentType) => {
    try{
        const data = await readFile(filePath)
        res.writeHead(200, {'Content-Type': contentType})
        res.end(data)
    }catch(err){
        res.writeHead(200, {'Content-Type': 'text/plain'})
        res.end('404 Page not found')
    }
}

const loadLinks = async () => {
    try{
        const fileData = await readFile(DATA_File, 'utf-8')
        return JSON.parse(fileData)
    } catch(err){
        if(err.code === 'ENOENT'){
            await writeFile(DATA_File, JSON.stringify({}))
            return {}
        }
        throw err
    }
}

const saveLinks = async (links) => {
   try{
        await writeFile(DATA_File, JSON.stringify(links), 'utf-8')
   }catch(err){
        console.log(err)
   }
}

const server = createServer(async(req,res)=>{
    if(req.method === 'GET'){
        if(req.url === '/'){
            serveFile(res, path.join('public','index.html'), 'text/html')
        } else if(req.url === '/style.css'){
            serveFile(res, path.join('public','style.css'), 'text/css')
        } else if(req.url === '/getLinks'){
            const linksResponse = await loadLinks()
            res.writeHead(200,{'Content-Type': 'application/json'})
            res.end(JSON.stringify(linksResponse))
        }
    }

    if(req.method === 'POST' && req.url === '/shortenURL'){

        const links = await loadLinks()

        let body = '';
        req.on('data',(chunk)=>{
            body+=chunk
        })

        req.on('end', async ()=>{
            let {url, shortURL} = await JSON.parse(body)

            if(!url){
                res.writeHead(400,{'Content-Type': 'text/plain'})
                return res.end('URL is required')
            }
            
            if(links[shortURL]){
                res.writeHead(400,{'Content-Type': 'text/plain'})
                return res.end('Custom short url already exists. Try adding new Custom short url')
            }

            links[shortURL] = url

            await saveLinks(links)

            res.writeHead(200,{'Content-Type': 'text/plain'})
            res.end()
        })
        
        req.on('error',()=>{
            res.end(400, {'Content-Type':'text/plain'})
            res.end(`Error while shortening URL`)
        })
    }
})

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
})