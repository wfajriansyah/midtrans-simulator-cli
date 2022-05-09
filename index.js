const fetch = require('node-fetch')
const $ = require('string')

const baseFetch = async (
    bank = 'bca',
    step,
    headers = {
        'Accept-Language' : 'en-US,en;q=0.9',
        'Origin' : 'https://simulator.sandbox.midtrans.com',
        'Referer' : 'https://simulator.sandbox.midtrans.com/' + bank + '/va/index',
        'User-Agent' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36'
    },
    postdata) => {
    try {
        const send = await fetch('https://simulator.sandbox.midtrans.com/' + bank + '/va/' + step, {
            headers : {
                ...headers,
            },
            method : "POST",
            body : postdata
        })
        const response = await send.text()
        return Promise.resolve(response)
    } catch(err) {
        return Promise.reject(err)
    }
}

const main = async () => {
    if(process.argv.length < 5) {
        console.clear()
        console.log(`node ${process.argv[1]} va [bca/bni] [va_number]`)
    }

    try {
        console.log(`[+] Checking ${process.argv[3].toUpperCase()} VA Numbers`)
        const checkPayment = await baseFetch(process.argv[3], 'inquiry', {
            'Accept' : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Content-Type' : 'application/x-www-form-urlencoded',
        }, "va_number=" + process.argv[4])

        if(checkPayment.indexOf("alert alert-danger") >- 1) {
            const result = $(checkPayment).between(`<div class="alert alert-danger">`, `</div>`).s
            console.log(`[!] ERROR RESULT : ${result}`)
            process.exit(1)
        }

        const getAllRegex = Array.from(checkPayment.matchAll(/<input name="(.*?)" value="(.*?)"/g))
        let postData = []

        getAllRegex.forEach((value, index) => {
            postData.push(`${value[1]}=${value[2]}`)
        })

        console.log(postData)

        const sendPayment = await baseFetch(process.argv[3], 'payment', {
            'Accept' : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Content-Type' : 'application/x-www-form-urlencoded',
        }, postData.join("&"))

        if(sendPayment.indexOf("alert alert-danger") >- 1) {
            const result = $(sendPayment).between(`<div class="alert alert-danger">`, `</div>`).s
            console.log(`[!] ERROR RESULT : ${result}`)
            process.exit(1)
        }

        const result = $(sendPayment).between(`<div class="alert alert-success">`, `</div>`).s
        console.log(`[!] RESULT : ${result}`)
        process.exit(1)
    } catch(err) {
        console.log(`[!] Found error throw...`)
        console.log(err)
    }
}

main()