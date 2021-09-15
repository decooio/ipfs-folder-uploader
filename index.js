/**
 * @auther zhouzibo
 * @date 2021/9/15
 */
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
const _ = require('lodash');
const ipfsPath = uuidv4();
const fromPath = process.argv[2]
const url = `https://ipfs-gw.decloud.foundation/api/v0/add`
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = createLogger({
    format: combine(
        label({ label: 'crust folder upload' }),
        timestamp(),
        myFormat
    ),
    transports: [new transports.Console()]
});

function getAllFiles(dirPath, ipfsPath) {
    const files = fs.readdirSync(dirPath)
    let arrayOfFiles = []
    files.forEach(file => {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = _.concat(arrayOfFiles, getAllFiles(dirPath + "/" + file, ipfsPath));
        } else {
            const absPath = path.join(dirPath, "/", file);
            const realPath = _.replace(absPath, fromPath, ipfsPath);
            arrayOfFiles.push({
                absPath: absPath,
                path: realPath,
            })
        }
    })
    return arrayOfFiles
}

async function uploadFiles() {
    if (_.isEmpty(fromPath)) {
        logger.info('please input from path')
        return;
    }
    if (_.isEmpty(ipfsPath)) {
        logger.info('please input ipfs temp path')
        return;
    }
    const form = new FormData();
    logger.info(`query all files`);
    const files = getAllFiles(fromPath, ipfsPath);
    for (const f of files) {
        const fileStream = fs.createReadStream(f.absPath);
        form.append('file', fileStream, { filepath: f.path });
    }
    logger.info(`start upload`);
    const result = await axios.request({
        headers: {
            ...form.getHeaders(),
            Authorization: 'Basic NURzczE1YnhlbVdHa2NlOTNxc1J2aVZ4ekI4a3dGYUJDODZwZVdOZnd2V2hSVkNhOjB4ZGE5NGRiYmY5YmVjMzJkZjc1NGFmYjI3YzgzYTQ5NWJjMThkYTFkZWZkNmZhNzAxYWI1YzQwNDdiMmEyMGU2NzEyN2JhMDhkYjBlMjhhNTQ4Njc4NTU3Y2MyM2M5Y2Y2MDIxMzZmNWYyYjAyMzIyZWRlOGYyYjcwY2FlYWE2OGU='
        },
        data: form,
        method: 'POST',
        url: url,
        timeout: 3600000,
        maxBodyLength: 10737418240
    });
    const resultArr = result.data.split('\n');
    const folder = JSON.parse(resultArr[resultArr.length - 2]);
    logger.info(`ipfs folder name: ${folder.Name} cid: ${folder.Hash} size: ${folder.Size}`);
}

uploadFiles()


